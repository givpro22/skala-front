/* ============================================================
   presence.js — 지금 접속 중인 사람 + 실시간 커서
   · Supabase Realtime 의 presence 로 동시 접속자를 센다 (테이블 불필요)
   · 같은 채널의 broadcast 로 마우스 위치를 주고받아 남의 커서를 띄운다
     → presence 와 커서가 채널 하나를 공유한다 (웹소켓 2개를 열지 않으려고)
   · 같은 페이지를 보는 사람의 커서만 그린다

   ── 좌표 기준 ──────────────────────────────────────────────
   뷰포트 기준(clientX/innerWidth)으로 보내면 안 된다. 그러면 상대가 페이지를
   아래로 내려서 다른 내용을 가리켜도 내 화면의 같은 자리에 커서가 뜬다
   (스크롤 위치가 전혀 반영되지 않음).

   그래서 '콘텐츠(.container) 기준' 으로 보낸다:
     x → 컨테이너 폭 대비 비율(0~1)  — 창 너비가 달라도 같은 내용을 가리킨다
     y → 컨테이너 위에서 몇 px       — 스크롤과 무관하게 같은 지점에 붙는다
   그리고 커서 레이어를 position:absolute 로 두어 문서와 함께 스크롤되게 한다.
   덕분에 스크롤 이벤트를 듣지 않아도 커서가 콘텐츠에 붙어 따라다닌다.

   개인정보는 보내지 않는다: 닉네임(공개용)과 좌표뿐.
   ============================================================ */

(function () {
    "use strict";

    var SEND_MS = 60;        // 커서 전송 간격 (초당 ~16회)
    var STALE_MS = 8000;     // 이 시간 동안 소식 없으면 커서를 지운다
    var COLORS = ["#58a6ff", "#3fb950", "#f0b429", "#a371f7", "#ff7b72", "#ff9bce"];

    var channel = null;
    var layer = null;
    var me = null;           // 내 임시 id (세션마다 달라짐)
    var cursors = {};        // id → { el, last }
    var lastSent = 0;
    var page = location.pathname.split("/").pop() || "index.html";

    /* 상태바에 "● N명 접속 중" 을 넣는다 */
    function badge() {
        var el = document.getElementById("sbPresence");
        if (el) return el;
        var left = document.querySelector(".statusbar .left");
        if (!left) return null;
        el = document.createElement("span");
        el.className = "sb presence";
        el.id = "sbPresence";
        el.title = "지금 이 사이트를 함께 보고 있는 사람";
        left.appendChild(el);
        return el;
    }

    function setCount(n) {
        var el = badge();
        if (!el) return;
        el.innerHTML = '<span class="presence-dot"></span>' +
            (n <= 1 ? "나 혼자" : n + "명 접속 중");
    }

    /* 임의의 세션 id — 로그인과 무관하며 새로고침하면 바뀐다 */
    function newId() {
        return (window.crypto && window.crypto.randomUUID)
            ? window.crypto.randomUUID()
            : "u" + Math.random().toString(36).slice(2, 10);
    }

    function colorFor(id) {
        var h = 0;
        for (var i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
        return COLORS[h % COLORS.length];
    }

    function nick() {
        try { return localStorage.getItem("skala-nick") || "익명"; }
        catch (e) { return "익명"; }
    }

    /* ---------- 남의 커서 ---------- */
    function cursorEl(id, name) {
        if (cursors[id]) return cursors[id].el;
        if (!layer) {
            layer = document.createElement("div");
            layer.className = "cursor-layer";
            document.body.appendChild(layer);
        }
        var el = document.createElement("div");
        el.className = "rc";
        var c = colorFor(id);
        el.innerHTML =
            '<svg viewBox="0 0 16 16" width="16" height="16">' +
                '<path d="M1 1l5.5 13 2-5.5L14 6.5 1 1z" fill="' + c + '" stroke="#0d1117" stroke-width="1"/>' +
            '</svg>' +
            '<span class="rc-name" style="background:' + c + '"></span>';
        // 닉네임은 남이 정한 값 → textContent 로 넣는다
        el.querySelector(".rc-name").textContent = name;
        layer.appendChild(el);
        // docX/docY 는 문서 좌표로 보관한다 (화면 좌표는 스크롤에 따라 계산)
        cursors[id] = { el: el, last: Date.now(), docX: 0, docY: 0 };
        return el;
    }

    /* 콘텐츠 영역 — 좌표의 기준점. 없으면 문서 전체를 기준으로 삼는다. */
    function anchor() {
        var c = document.querySelector(".container");
        if (!c) {
            return { left: 0, top: 0, width: document.documentElement.clientWidth || 1 };
        }
        var r = c.getBoundingClientRect();
        return {
            left: r.left + window.scrollX,   // 문서 좌표
            top: r.top + window.scrollY,
            width: r.width || 1
        };
    }

    /* 커서 하나를 현재 스크롤 위치에 맞춰 화면에 배치한다.
       저장해 둔 문서 좌표 → 뷰포트 좌표로 환산 (레이어가 fixed 이므로). */
    function place(c) {
        c.el.style.transform =
            "translate(" + Math.round(c.docX - window.scrollX) + "px," +
                           Math.round(c.docY - window.scrollY) + "px)";
    }

    function moveCursor(p) {
        if (p.id === me || p.page !== page) return;
        var el = cursorEl(p.id, p.nick);
        var c = cursors[p.id];
        c.last = Date.now();

        // 보낸 사람의 콘텐츠 기준 좌표를 내 문서 좌표로 되돌린다
        var a = anchor();
        c.docX = a.left + p.cx * a.width;
        c.docY = a.top + p.cy;
        place(c);
    }

    /* 스크롤·리사이즈하면 모든 커서를 다시 배치한다.
       rAF 로 묶어 한 프레임에 한 번만 계산한다. */
    var raf = false;
    function replaceAll() {
        if (raf) return;
        raf = true;
        requestAnimationFrame(function () {
            raf = false;
            Object.keys(cursors).forEach(function (id) { place(cursors[id]); });
        });
    }

    /* 소식이 끊긴 커서 정리 (탭을 닫으면 leave 가 안 올 수도 있다) */
    function sweep() {
        var now = Date.now();
        Object.keys(cursors).forEach(function (id) {
            if (now - cursors[id].last < STALE_MS) return;
            cursors[id].el.remove();
            delete cursors[id];
        });
    }

    function dropCursor(id) {
        if (!cursors[id]) return;
        cursors[id].el.remove();
        delete cursors[id];
    }

    /* ---------- 시작 ---------- */
    function start(sb) {
        me = newId();

        channel = sb.channel("skala-site", {
            config: { presence: { key: me }, broadcast: { self: false } }
        });

        channel
            .on("presence", { event: "sync" }, function () {
                setCount(Object.keys(channel.presenceState()).length);
            })
            .on("presence", { event: "leave" }, function (e) {
                (e.leftPresences || []).forEach(function (p) { dropCursor(p.id || e.key); });
                dropCursor(e.key);
            })
            .on("broadcast", { event: "cursor" }, function (m) {
                moveCursor(m.payload);
            })
            .subscribe(function (st) {
                if (st !== "SUBSCRIBED") return;
                channel.track({ id: me, page: page, nick: nick() });
            });

        document.addEventListener("mousemove", function (e) {
            var now = Date.now();
            if (now - lastSent < SEND_MS || !channel) return;
            lastSent = now;

            // 콘텐츠 기준 좌표로 변환해서 보낸다 (뷰포트 기준이면 스크롤이 무시된다)
            var a = anchor();
            channel.send({
                type: "broadcast", event: "cursor",
                payload: {
                    id: me, page: page, nick: nick(),
                    cx: (e.pageX - a.left) / a.width,   // 컨테이너 폭 대비 비율
                    cy: e.pageY - a.top                 // 컨테이너 위에서 px
                }
            });
        }, { passive: true });

        // 레이어가 fixed 라 스크롤해도 안 움직인다 → 직접 다시 배치해야
        // 커서가 가리키던 콘텐츠에 계속 붙어 있다
        window.addEventListener("scroll", replaceAll, { passive: true });
        window.addEventListener("resize", replaceAll, { passive: true });

        setInterval(sweep, 2000);

        // 탭을 닫거나 이동할 때 깔끔히 빠진다
        window.addEventListener("pagehide", function () {
            if (channel) channel.untrack();
        });
    }

    document.addEventListener("DOMContentLoaded", function () {
        if (!document.querySelector(".topbar")) return;
        setCount(1);
        window.supabaseReady.then(start).catch(function () {
            var el = badge();
            if (el) el.remove();   // Supabase 미설정이면 뱃지를 아예 감춘다
        });
    });
})();
