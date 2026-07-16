/* ============================================================
   achievements.js — 업적 시스템 (강화판)
   · 해금 시: 폭죽(confetti) + 업적 배너(설명 + 달성 방법)
   · 상태바 🏆 클릭 → 전체 업적 목록 패널 (달성 방법 안내)
   · 진행 상황은 localStorage 저장
   ============================================================ */

(function () {
    "use strict";

    var LIST = [
        { id: "explorer", icon: "🧭", title: "탐험가", desc: "모든 페이지를 방문했다", how: "홈·소개·시간표·휴일·여행·회원가입·결과 페이지를 모두 방문하세요" },
        { id: "rookie", icon: "🌱", title: "첫 명령", desc: "터미널에 첫 명령어를 입력했다", how: "메인 터미널에 아무 명령어나 입력해보세요 (예: help)" },
        { id: "master", icon: "⌨️", title: "터미널 마스터", desc: "터미널 명령을 15회 사용했다", how: "메인 터미널에서 명령어를 15번 실행하세요" },
        { id: "matrix", icon: "🟦", title: "네오", desc: "매트릭스 이스터에그를 발견했다", how: "터미널에 matrix 입력, 또는 ⌘K → 매트릭스" },
        { id: "konami", icon: "🕹️", title: "고전 게이머", desc: "코나미 코드를 입력했다", how: "키보드로 ↑ ↑ ↓ ↓ 를 순서대로 누르세요" },
        { id: "palette", icon: "⚡", title: "파워 유저", desc: "명령 팔레트를 열었다", how: "⌘K (또는 Ctrl+K) 를 누르세요" },
        { id: "theme", icon: "🌗", title: "빛과 어둠", desc: "테마를 전환했다", how: "우측 상단 🌙 버튼으로 다크/라이트를 전환하세요" },
        { id: "gamer", icon: "✊", title: "승부사", desc: "가위바위보 게임을 했다", how: "터미널에 rps 가위 (또는 바위/보) 를 입력하세요" },
        { id: "helper", icon: "❔", title: "길잡이", desc: "도움말을 열어봤다", how: "우측 하단 보라색 ? 버튼을 누르세요" },
        { id: "ambient", icon: "✨", title: "커스터마이저", desc: "배경 밀도를 조절했다", how: "명령 팔레트에서 '배경 캐릭터 설정'을 열어 밀도를 바꾸세요" }
    ];

    var KEY = "skala-ach";

    function load() {
        try { return JSON.parse(localStorage.getItem(KEY) || "{}"); }
        catch (e) { return {}; }
    }
    function save(o) { localStorage.setItem(KEY, JSON.stringify(o)); }
    function meta(id) { for (var i = 0; i < LIST.length; i++) if (LIST[i].id === id) return LIST[i]; return null; }
    function countGot() { var s = load(), n = 0; LIST.forEach(function (a) { if (s[a.id]) n++; }); return n; }

    /* ---------- 폭죽 ---------- */
    function burst(cx, cy) {
        var colors = ["#58a6ff", "#a371f7", "#f0b429", "#3fb950", "#ff7b72", "#79c0ff"];
        var layer = document.createElement("div");
        layer.className = "fx-layer";
        document.body.appendChild(layer);
        var pieces = [];
        for (var i = 0; i < 54; i++) {
            var el = document.createElement("div");
            el.className = "fx-piece";
            el.style.background = colors[i % colors.length];
            if (i % 2) el.style.borderRadius = "50%";
            layer.appendChild(el);
            var ang = Math.random() * Math.PI * 2;
            var sp = 4 + Math.random() * 7;
            pieces.push({ el: el, x: cx, y: cy, vx: Math.cos(ang) * sp, vy: Math.sin(ang) * sp - 4, rot: Math.random() * 360 });
        }
        var start = null, dur = 1300;
        function frame(ts) {
            if (!start) start = ts;
            var t = ts - start;
            pieces.forEach(function (p) {
                p.vy += 0.28; p.x += p.vx; p.y += p.vy; p.rot += 9;
                p.el.style.transform = "translate(" + p.x + "px," + p.y + "px) rotate(" + p.rot + "deg)";
                p.el.style.opacity = String(Math.max(0, 1 - t / dur));
            });
            if (t < dur) requestAnimationFrame(frame);
            else layer.remove();
        }
        requestAnimationFrame(frame);
    }

    /* ---------- 해금 배너 ---------- */
    function showUnlockEffect(m) {
        var el = document.createElement("div");
        el.className = "ach-pop";
        el.innerHTML =
            '<div class="ach-pop-icon">' + m.icon + '</div>' +
            '<div class="ach-pop-body">' +
                '<div class="ach-pop-label">🏆 업적 해금!</div>' +
                '<div class="ach-pop-title">' + m.title + '</div>' +
                '<div class="ach-pop-desc">' + m.desc + '</div>' +
                '<div class="ach-pop-how">달성 방법 · ' + m.how + '</div>' +
            '</div>';
        document.body.appendChild(el);
        requestAnimationFrame(function () { el.classList.add("show"); });
        setTimeout(function () { burst(window.innerWidth / 2, 120); }, 120);
        setTimeout(function () {
            el.classList.remove("show");
            setTimeout(function () { if (el.parentNode) el.remove(); }, 400);
        }, 4200);
    }

    /* ---------- 해금 ---------- */
    window.unlock = function (id) {
        var m = meta(id);
        if (!m) return;
        var state = load();
        if (state[id]) return;
        state[id] = Date.now();
        save(state);
        showUnlockEffect(m);
        updateBadge();
    };

    window.getAchievements = function () {
        var s = load();
        return LIST.map(function (a) {
            return { icon: a.icon, title: a.title, desc: a.desc, how: a.how, unlocked: !!s[a.id] };
        });
    };

    /* ---------- 상태바 배지 ---------- */
    function updateBadge() {
        var el = document.getElementById("achBadge");
        if (!el) return;
        el.textContent = "🏆 " + countGot() + "/" + LIST.length;
    }
    window.updateAchBadge = updateBadge;

    /* ---------- 전체 업적 패널 ---------- */
    function openAchievements() {
        if (document.getElementById("achModalOv")) return;
        var s = load();
        var got = countGot();
        var items = LIST.map(function (a) {
            var on = !!s[a.id];
            return '<div class="ach-item ' + (on ? "on" : "off") + '">' +
                '<span class="ach-i">' + (on ? a.icon : "🔒") + '</span>' +
                '<div class="ach-t">' +
                    '<div class="ach-name">' + a.title + (on ? '' : ' <span class="ach-lock">잠김</span>') + '</div>' +
                    '<div class="ach-how">' + (on ? "✓ " + a.desc : "달성 방법 · " + a.how) + '</div>' +
                '</div></div>';
        }).join("");

        var ov = document.createElement("div");
        ov.className = "ach-modal-ov";
        ov.id = "achModalOv";
        ov.innerHTML =
            '<div class="ach-modal" role="dialog" aria-label="업적">' +
                '<div class="ach-modal-head">' +
                    '<span>🏆 업적 <b>' + got + ' / ' + LIST.length + '</b></span>' +
                    '<button class="ach-close" aria-label="닫기">&times;</button>' +
                '</div>' +
                '<div class="ach-bar"><div class="ach-bar-fill" style="width:' + (got / LIST.length * 100) + '%"></div></div>' +
                '<div class="ach-list">' + items + '</div>' +
            '</div>';
        document.body.appendChild(ov);

        function close() {
            ov.classList.remove("show");
            document.removeEventListener("keydown", onKey);
            setTimeout(function () { if (ov.parentNode) ov.remove(); }, 250);
        }
        function onKey(e) { if (e.key === "Escape") close(); }
        ov.addEventListener("click", function (e) { if (e.target === ov) close(); });
        ov.querySelector(".ach-close").addEventListener("click", close);
        document.addEventListener("keydown", onKey);
        requestAnimationFrame(function () { ov.classList.add("show"); });
    }
    window.openAchievements = openAchievements;

    /* ---------- 페이지 방문 추적 ---------- */
    var PAGES = ["index.html", "myProfile.html", "myClass.html", "holiday.html",
                 "myTrip.html", "signUp.html", "signUpResult.html"];

    document.addEventListener("DOMContentLoaded", function () {
        var here = location.pathname.split("/").pop() || "index.html";
        var vkey = "skala-visited", visited;
        try { visited = JSON.parse(localStorage.getItem(vkey) || "[]"); }
        catch (e) { visited = []; }
        if (PAGES.indexOf(here) >= 0 && visited.indexOf(here) < 0) {
            visited.push(here);
            localStorage.setItem(vkey, JSON.stringify(visited));
        }
        if (PAGES.every(function (p) { return visited.indexOf(p) >= 0; })) window.unlock("explorer");
        updateBadge();
    });
})();
