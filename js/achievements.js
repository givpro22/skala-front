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
        { id: "ambient", icon: "✨", title: "커스터마이저", desc: "배경 밀도를 조절했다", how: "명령 팔레트에서 '배경 캐릭터 설정'을 열어 밀도를 바꾸세요" },
        { id: "weather", icon: "🌦️", title: "기상캐스터", desc: "실시간 날씨를 조회했다", how: "메인 우측 '실시간 날씨'에서 도시를 바꾸거나 터미널에 weather 를 입력하세요" },
        { id: "player", icon: "🎮", title: "미니앱 플레이어", desc: "미니 앱을 실행했다", how: "Up-Down 게임·성적 계산기·내 가방 보기 버튼을 눌러보세요" },
        { id: "guest", icon: "✍️", title: "방명록 손님", desc: "방명록에 글을 남겼다", how: "우측 도크의 방명록에 닉네임과 한 마디를 남겨보세요" },
        { id: "liker", icon: "💖", title: "다정한 사람", desc: "방명록 글에 좋아요를 눌렀다", how: "방명록의 다른 글에 하트를 눌러보세요" },
        { id: "ranker", icon: "📈", title: "경쟁심", desc: "업적 랭킹을 확인했다", how: "우측 도크의 🏆 랭킹 탭을 열어보세요" },
        { id: "vlog", icon: "🎬", title: "시청자", desc: "여행 브이로그를 재생했다", how: "여행 앨범 페이지에서 브이로그 영상을 재생하세요" },
        { id: "dj", icon: "🎧", title: "여행 DJ", desc: "여행 배경 음악을 틀었다", how: "여행 앨범 페이지의 음악 플레이어를 재생하세요" },
        { id: "gallery", icon: "🖼️", title: "감상가", desc: "여행 사진을 크게 봤다", how: "여행 앨범에서 사진을 클릭해 라이트박스로 열어보세요" },
        { id: "nightowl", icon: "🦉", title: "올빼미", desc: "새벽에 방문했다", how: "새벽 0시~5시 사이에 사이트를 방문해보세요" },
        { id: "comeback", icon: "🔁", title: "단골", desc: "다른 날 다시 찾아왔다", how: "오늘 말고 다른 날에 다시 방문해주세요" },
        { id: "painter", icon: "🎨", title: "화백", desc: "함께 그리기에 픽셀을 칠했다", how: "우측 도크의 🎨 낙서판에서 칸을 칠해보세요" },
        { id: "winner", icon: "🎯", title: "행운아", desc: "Up-Down 게임에서 정답을 맞혔다", how: "터미널에 updown 을 입력해 숫자를 맞혀보세요" },
        { id: "champion", icon: "✌️", title: "챔피언", desc: "가위바위보에서 이겼다", how: "터미널에 rps 가위/바위/보 를 입력해 이겨보세요" },
        { id: "member", icon: "🪪", title: "정식 회원", desc: "회원가입을 완료했다", how: "회원가입 페이지에서 계정을 만드세요" },
        { id: "collector", icon: "🏅", title: "수집가", desc: "업적 절반을 모았다", how: "전체 업적의 절반 이상을 해금하세요" },
        { id: "completionist", icon: "👑", title: "올클리어", desc: "모든 업적을 해금했다", how: "이 목록의 모든 업적을 달성하세요" },
        { id: "hacker", icon: "🕶️", title: "해커", desc: "콘솔에서 비밀 명령을 찾았다", how: "브라우저 개발자 콘솔에서 skala() 를 실행해보세요" }
    ];

    var KEY = "skala-ach";

    function load() {
        try { return JSON.parse(localStorage.getItem(KEY) || "{}"); }
        catch (e) { return {}; }
    }
    function save(o) { localStorage.setItem(KEY, JSON.stringify(o)); }
    function meta(id) { for (var i = 0; i < LIST.length; i++) if (LIST[i].id === id) return LIST[i]; return null; }
    function countGot() { var s = load(), n = 0; LIST.forEach(function (a) { if (s[a.id]) n++; }); return n; }

    /* ============================================================
       Supabase 동기화 (로그인 상태에서만)
       · localStorage 가 원본 — 오프라인·비로그인에서도 업적은 그대로 동작한다.
       · Supabase 는 기기 간 사본. 실패해도 로컬 진행에는 영향을 주지 않는다.
       · 로그인 시 원격↔로컬을 합집합으로 병합하므로,
         가입 전에 쌓아둔 업적도 계정에 그대로 올라간다.
       ============================================================ */

    /* supabase 스크립트가 없는 페이지도 있으므로 항상 방어적으로 접근 */
    function sbReady() {
        return window.supabaseReady || Promise.reject(new Error("supabase 미설정"));
    }

    function pushRemote(ids) {
        if (!ids.length) return Promise.resolve();
        return sbReady().then(function (sb) {
            // getSession() 은 localStorage 를 읽는다 — getUser() 와 달리 네트워크 왕복이 없다.
            return sb.auth.getSession().then(function (u) {
                if (!u.data || !u.data.session) return;
                var rows = ids.map(function (id) {
                    return { user_id: u.data.session.user.id, achievement_id: id };
                });
                // 이미 있는 업적은 그대로 둔다 (최초 해금 시각 보존)
                return sb.from("achievements")
                    .upsert(rows, { onConflict: "user_id,achievement_id", ignoreDuplicates: true });
            });
        }).catch(function () { /* 동기화 실패는 조용히 무시 — 로컬이 원본 */ });
    }

    function syncAll() {
        return sbReady().then(function (sb) {
            // getSession() 은 localStorage 를 읽는다 — getUser() 와 달리 네트워크 왕복이 없다.
            return sb.auth.getSession().then(function (u) {
                if (!u.data || !u.data.session) return;

                return sb.from("achievements").select("achievement_id, unlocked_at")
                    .then(function (res) {
                        if (res.error) return;

                        var local = load();
                        var changed = false;

                        // 원격 → 로컬
                        (res.data || []).forEach(function (row) {
                            if (!local[row.achievement_id]) {
                                local[row.achievement_id] = new Date(row.unlocked_at).getTime();
                                changed = true;
                            }
                        });
                        if (changed) { save(local); updateBadge(); }

                        // 로컬 → 원격 (원격에 없는 것만)
                        var remoteIds = (res.data || []).map(function (r) { return r.achievement_id; });
                        var localOnly = Object.keys(local).filter(function (id) {
                            return meta(id) && remoteIds.indexOf(id) < 0;
                        });
                        return pushRemote(localOnly);
                    });
            });
        }).catch(function () { /* 비로그인·미설정 — 무시 */ });
    }

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

    /* 진행형 업적(다른 업적을 모아야 열리는 것)의 목표 개수.
       LIST 길이에서 파생하므로 업적을 추가해도 자동으로 맞춰진다.
       이 둘은 스스로 계산되므로 how 안내와 달리 직접 해금 훅이 없다. */
    var MILESTONE = { collector: 0, completionist: 0 };
    (function milestoneTargets() {
        var total = LIST.length;
        MILESTONE.collector = Math.ceil(total / 2);   // 전체의 절반
        MILESTONE.completionist = total - 1;          // 자신을 뺀 나머지 전부
    })();

    /* 실제 해금 로직. cascade=false 면 진행형 업적 재검사를 건너뛴다(재귀 방지). */
    function doUnlock(id, cascade) {
        var m = meta(id);
        if (!m) return false;
        var state = load();
        if (state[id]) return false;
        state[id] = Date.now();
        save(state);
        showUnlockEffect(m);
        updateBadge();
        pushRemote([id]);   // 로그인 상태면 계정에도 기록 (실패해도 로컬은 유지)
        window.dispatchEvent(new CustomEvent("skala-achievement-unlocked", { detail: { id: id } }));

        // 진행형 업적 검사 — 방금 해금으로 목표에 도달했는지.
        // MILESTONE 자신을 해금할 때는 다시 세지 않는다 (재귀 방지).
        if (cascade && id !== "collector" && id !== "completionist") {
            var got = countGot();   // 방금 저장분이 반영된 개수
            if (got >= MILESTONE.collector) doUnlock("collector", false);
            if (got >= MILESTONE.completionist) doUnlock("completionist", false);
        }
        return true;
    }

    /* ---------- 해금 ---------- */
    window.unlock = function (id) { doUnlock(id, true); };

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

        /* ---------- 올빼미: 새벽 0~5시 방문 ---------- */
        var hour = new Date().getHours();
        if (hour >= 0 && hour < 5) window.unlock("nightowl");

        /* ---------- 단골: 처음 온 날과 다른 날 재방문 ----------
           방문 '날짜'만 저장한다 (시각·횟수는 쓰지 않는다) */
        try {
            var dkey = "skala-first-day";
            var today = new Date().toLocaleDateString("sv");   // YYYY-MM-DD
            var first = localStorage.getItem(dkey);
            if (!first) localStorage.setItem(dkey, today);
            else if (first !== today) window.unlock("comeback");
        } catch (e) { /* 시크릿 모드 등 — 업적만 못 받을 뿐 */ }

        updateBadge();

        // 계정의 업적과 병합한다.
        // onAuthChange 는 페이지 로드 시 INITIAL_SESSION 으로 한 번 발화하므로
        // 최초 병합과 이후 로그인 시 병합이 모두 여기서 처리된다.
        // (별도로 syncAll() 을 또 부르면 매 페이지 로드마다 동기화가 2번 돈다)
        if (window.SkalaAuth) {
            window.SkalaAuth.onAuthChange(function (user) {
                if (user) syncAll();
            });
        }
    });
})();
