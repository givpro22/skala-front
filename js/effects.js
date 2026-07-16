/* ============================================================
   effects.js — 창의적 인터랙션 & 화면 효과
   · 인트로 부팅 화면 (첫 진입, 세션당 1회, index 전용)
   · 페이지 전환 효과 (페이드 아웃 + 상단 로딩바)
   · 스크롤 진행바
   · 카드 3D 틸트 (마우스 추적)
   · 코나미 코드 이스터에그 → 매트릭스 레인
   head 에서 로드되어 부팅 화면이 콘텐츠보다 먼저 뜨도록 함
   ============================================================ */

(function () {
    "use strict";

    var path = location.pathname.split("/").pop() || "index.html";
    var isHome = path === "index.html" || path === "";

    /* ---------- 인트로 부팅 화면 (즉시 실행) ---------- */
    if (isHome && !sessionStorage.getItem("skala-booted")) {
        showBootScreen();
    }

    function showBootScreen() {
        var root = document.documentElement;
        var overlay = document.createElement("div");
        overlay.id = "bootScreen";
        overlay.innerHTML =
            '<div class="boot-inner">' +
                '<pre class="boot-log" id="bootLog"></pre>' +
                '<div class="boot-bar"><div class="boot-fill" id="bootFill"></div></div>' +
                '<div class="boot-hint">press any key to skip</div>' +
            '</div>';
        root.appendChild(overlay);
        root.classList.add("booting"); // 스크롤 잠금

        var lines = [
            "$ ./launch skala-front --user=park",
            "[ 0.01s ] booting kernel ................ ok",
            "[ 0.05s ] mount /portfolio ............. ok",
            "[ 0.09s ] load modules: html css js .... ok",
            "[ 0.14s ] hydrate components .......... ok",
            "[ 0.18s ] starting dev server ......... ok",
            "",
            "  welcome, Park Youngseo.",
            "  compiling portfolio..."
        ];

        var log = overlay.querySelector("#bootLog");
        var fill = overlay.querySelector("#bootFill");
        var li = 0, done = false;

        function finish() {
            if (done) return;
            done = true;
            sessionStorage.setItem("skala-booted", "1");
            root.classList.remove("booting");
            overlay.classList.add("boot-out");
            setTimeout(function () { if (overlay.parentNode) overlay.remove(); }, 600);
            document.removeEventListener("keydown", skip, true);
            overlay.removeEventListener("click", skip, true);
        }
        function skip() { finish(); }

        document.addEventListener("keydown", skip, true);
        overlay.addEventListener("click", skip, true);

        function typeLine() {
            if (done) return;
            if (li >= lines.length) { setTimeout(finish, 500); return; }
            log.textContent += lines[li] + "\n";
            li++;
            fill.style.width = Math.round((li / lines.length) * 100) + "%";
            setTimeout(typeLine, li <= 6 ? 150 : 350);
        }
        typeLine();
    }

    /* ---------- DOM 준비 후 나머지 효과 ---------- */
    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", initEffects);
    } else {
        initEffects();
    }

    function initEffects() {
        scrollProgress();
        pageTransition();
        cardTilt();
        konami();
        featureHint();
        injectHelpButton();
        countUp();
        buildHeatmap();
    }

    /* ---------- GitHub 활동 히트맵 (실제 데이터 + 폴백) ---------- */
    function buildHeatmap() {
        var el = document.getElementById("heatmap");
        if (!el) return;
        var cap = document.getElementById("heatmapCap");
        var USER = "givpro22";

        fetch("https://github-contributions-api.jogruber.de/v4/" + USER + "?y=last")
            .then(function (r) { if (!r.ok) throw new Error("bad"); return r.json(); })
            .then(function (data) {
                var days = (data && data.contributions) || [];
                if (!days.length) throw new Error("empty");
                el.innerHTML = "";
                // 첫 날 요일만큼 빈 칸으로 채워 요일 정렬
                var pad = new Date(days[0].date + "T00:00:00").getDay();
                for (var i = 0; i < pad; i++) {
                    var sp = document.createElement("div");
                    sp.className = "cell empty";
                    el.appendChild(sp);
                }
                var total = 0;
                days.forEach(function (d) {
                    total += d.count || 0;
                    var cell = document.createElement("div");
                    cell.className = "cell";
                    var lvl = (typeof d.level === "number")
                        ? d.level
                        : (d.count === 0 ? 0 : d.count < 3 ? 1 : d.count < 6 ? 2 : d.count < 10 ? 3 : 4);
                    if (lvl) cell.classList.add("l" + lvl);
                    cell.title = d.date + " · " + (d.count || 0) + " commits";
                    el.appendChild(cell);
                });
                if (cap) cap.textContent =
                    "실제 GitHub 커밋 활동 · github.com/" + USER + " (최근 1년 · 총 " + total.toLocaleString() + "회)";
            })
            .catch(function () {
                renderExampleHeatmap(el);
                if (cap) cap.textContent = "지난 1년간의 커밋 활동 (예시 데이터 · GitHub 연결 실패)";
            });
    }

    function renderExampleHeatmap(el) {
        el.innerHTML = "";
        for (var w = 0; w < 52; w++) {
            for (var d = 0; d < 7; d++) {
                var cell = document.createElement("div");
                cell.className = "cell";
                var r = Math.random();
                var lvl = r > 0.85 ? 4 : r > 0.7 ? 3 : r > 0.5 ? 2 : r > 0.28 ? 1 : 0;
                if (lvl) cell.classList.add("l" + lvl);
                el.appendChild(cell);
            }
        }
    }

    /* ---------- 숫자 카운트업 (화면에 보일 때) ---------- */
    function countUp() {
        var els = document.querySelectorAll(".count-up");
        if (!els.length) return;
        function animate(el) {
            var target = parseInt(el.getAttribute("data-target"), 10) || 0;
            var suffix = el.getAttribute("data-suffix") || "";
            var dur = 1100, start = null;
            function step(ts) {
                if (!start) start = ts;
                var p = Math.min((ts - start) / dur, 1);
                var eased = 1 - Math.pow(1 - p, 3);
                el.textContent = Math.round(eased * target) + suffix;
                if (p < 1) requestAnimationFrame(step);
            }
            requestAnimationFrame(step);
        }
        if ("IntersectionObserver" in window) {
            var io = new IntersectionObserver(function (entries) {
                entries.forEach(function (en) {
                    if (en.isIntersecting) { animate(en.target); io.unobserve(en.target); }
                });
            }, { threshold: 0.4 });
            els.forEach(function (el) { io.observe(el); });
        } else {
            els.forEach(animate);
        }
    }

    /* ---------- 플로팅 도움말 버튼 (전 페이지) ---------- */
    function injectHelpButton() {
        if (document.querySelector(".help-fab")) return;
        var b = document.createElement("button");
        b.className = "help-fab";
        b.type = "button";
        b.title = "단축키 & 숨은 기능 보기";
        b.setAttribute("aria-label", "도움말 열기");
        b.textContent = "?";
        b.addEventListener("click", function () {
            if (typeof window.showFeatureHint === "function") window.showFeatureHint();
        });
        document.body.appendChild(b);
    }

    /* ---------- 첫 방문 튜토리얼 (홈, 영구 1회) ---------- */
    function featureHint() {
        if (!isHome) return;
        if (localStorage.getItem("skala-welcomed")) return;
        var delay = sessionStorage.getItem("skala-booted") ? 700 : 2800;
        setTimeout(function () {
            localStorage.setItem("skala-welcomed", "1");
            showTutorial();
        }, delay);
    }

    function tutStep(icon, keys, desc) {
        return '<div class="tut-step"><span class="tut-ic">' + icon + '</span>' +
            '<div><div class="tut-keys">' + keys + '</div>' +
            '<div class="tut-desc">' + desc + '</div></div></div>';
    }

    function showTutorial() {
        if (document.getElementById("tutOv")) return;
        var ov = document.createElement("div");
        ov.className = "tut-ov";
        ov.id = "tutOv";
        ov.innerHTML =
            '<div class="tut-modal" role="dialog" aria-label="사용법 안내">' +
                '<div class="tut-head">' +
                    '<span>👋 환영합니다 · SKALA·FRONT 사용법</span>' +
                    '<button class="tut-close" aria-label="닫기">&times;</button>' +
                '</div>' +
                '<div class="tut-body">' +
                    '<p class="tut-intro">개발자 IDE 컨셉의 인터랙티브 포트폴리오예요. 이렇게 즐겨보세요:</p>' +
                    tutStep("⌨️", '<kbd>⌘K</kbd> <kbd>Ctrl+K</kbd>', "명령 팔레트 — 페이지 이동 · 테마 · 검색") +
                    tutStep("💻", '터미널에 <b>help</b> 입력', "숨은 명령어 — neofetch · rps 게임 · cowsay 등") +
                    tutStep("🏆", '탐험하며 <b>숨은 업적</b> 해금', "하단 금색 🏆 를 눌러 목록 · 달성 방법 확인") +
                    tutStep("🕹️", '<kbd>↑</kbd><kbd>↑</kbd><kbd>↓</kbd><kbd>↓</kbd>', "매트릭스 이스터에그") +
                    tutStep("🌙", '우측 상단 버튼', "다크 / 라이트 테마 전환") +
                '</div>' +
                '<div class="tut-foot">' +
                    '<span class="tut-note">이 안내는 우측 하단 <b>?</b> 버튼으로 다시 볼 수 있어요</span>' +
                    '<button class="btn btn-primary tut-start">시작하기</button>' +
                '</div>' +
            '</div>';
        document.body.appendChild(ov);

        function close() {
            ov.classList.remove("show");
            document.removeEventListener("keydown", onKey);
            setTimeout(function () { if (ov.parentNode) ov.remove(); }, 250);
        }
        function onKey(e) { if (e.key === "Escape") close(); }
        ov.addEventListener("click", function (e) { if (e.target === ov) close(); });
        ov.querySelector(".tut-close").addEventListener("click", close);
        ov.querySelector(".tut-start").addEventListener("click", close);
        document.addEventListener("keydown", onKey);
        requestAnimationFrame(function () { ov.classList.add("show"); });
    }

    /* ---------- 스크롤 진행바 (겸 네비 로딩바) ---------- */
    var progressEl;
    function scrollProgress() {
        progressEl = document.createElement("div");
        progressEl.className = "scroll-progress";
        document.body.appendChild(progressEl);
        window.addEventListener("scroll", updateProgress, { passive: true });
        updateProgress();
    }
    function updateProgress() {
        if (!progressEl || progressEl.dataset.loading) return;
        var h = document.documentElement;
        var max = h.scrollHeight - h.clientHeight;
        var pct = max > 0 ? (h.scrollTop / max) * 100 : 0;
        progressEl.style.width = pct + "%";
    }

    /* ---------- 페이지 전환 효과 ---------- */
    function pageTransition() {
        // 진입 시 페이드 인
        document.body.classList.add("page-in");

        document.addEventListener("click", function (e) {
            var a = e.target.closest("a");
            if (!a) return;
            var href = a.getAttribute("href");
            if (!href) return;
            // 내부 .html 링크만 (새 탭/외부/앵커 제외)
            if (a.target === "_blank" || a.hasAttribute("download")) return;
            if (!/\.html($|[?#])/.test(href)) return;
            if (/^https?:\/\//.test(href)) return;
            if (e.metaKey || e.ctrlKey || e.shiftKey) return;

            e.preventDefault();
            // 로딩바 채우기
            if (progressEl) {
                progressEl.dataset.loading = "1";
                progressEl.style.transition = "width 0.34s ease";
                progressEl.style.width = "100%";
            }
            document.body.classList.add("page-out");
            setTimeout(function () { location.href = href; }, 340);
        });
    }

    /* ---------- 카드 3D 틸트 ---------- */
    function cardTilt() {
        var cards = document.querySelectorAll(".info-card, .trip-card");
        cards.forEach(function (card) {
            card.addEventListener("mousemove", function (e) {
                var r = card.getBoundingClientRect();
                var px = (e.clientX - r.left) / r.width - 0.5;
                var py = (e.clientY - r.top) / r.height - 0.5;
                card.style.transform =
                    "perspective(680px) rotateX(" + (-py * 6).toFixed(2) + "deg) rotateY(" +
                    (px * 6).toFixed(2) + "deg) translateY(-4px)";
            });
            card.addEventListener("mouseleave", function () {
                card.style.transform = "";
            });
        });
    }

    /* ---------- 코나미 코드 → 매트릭스 레인 ---------- */
    function konami() {
        var seq = [38, 38, 40, 40]; // ↑ ↑ ↓ ↓ (간단 버전)
        var pos = 0;
        document.addEventListener("keydown", function (e) {
            pos = (e.keyCode === seq[pos]) ? pos + 1 : (e.keyCode === seq[0] ? 1 : 0);
            if (pos === seq.length) {
                pos = 0;
                if (window.unlock) window.unlock("konami");
                matrixRain();
                if (typeof showToast === "function") showToast("> DEVELOPER MODE UNLOCKED");
            }
        });
    }

    function matrixRain() {
        if (window.unlock) window.unlock("matrix");
        if (document.getElementById("matrixCanvas")) return;
        var canvas = document.createElement("canvas");
        canvas.id = "matrixCanvas";
        document.body.appendChild(canvas);
        var ctx = canvas.getContext("2d");

        var font = 16;
        var drops = [];
        function resize() {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            var cols = Math.ceil(canvas.width / font);
            for (var i = 0; i < cols; i++) {
                if (drops[i] === undefined) drops[i] = Math.floor(Math.random() * canvas.height / font);
            }
        }
        resize();
        window.addEventListener("resize", resize);

        // 첫 프레임은 어두운 배경으로 꽉 채워 깔끔하게 시작
        ctx.fillStyle = "#0d1117";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        var chars = "アイウエオカキクケコサシスセソタチabcdef0123456789<>/{}[]=;:".split("");
        var start = Date.now();
        var ended = false;

        function end() {
            if (ended) return;
            ended = true;
            clearInterval(timer);
            window.removeEventListener("resize", resize);
            canvas.removeEventListener("click", end);
            canvas.style.transition = "opacity 0.6s";
            canvas.style.opacity = "0";
            setTimeout(function () { if (canvas.parentNode) canvas.remove(); }, 600);
        }

        // 클릭하면 즉시 종료 (잠깐 클릭 허용)
        canvas.style.pointerEvents = "auto";
        canvas.addEventListener("click", end);

        var timer = setInterval(function () {
            ctx.fillStyle = "rgba(13,17,23,0.10)";
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = "#58a6ff";
            ctx.font = font + "px monospace";
            for (var i = 0; i < drops.length; i++) {
                var ch = chars[Math.floor(Math.random() * chars.length)];
                ctx.fillText(ch, i * font, drops[i] * font);
                if (drops[i] * font > canvas.height && Math.random() > 0.975) drops[i] = 0;
                drops[i]++;
            }
            if (Date.now() - start > 5000) end();
        }, 50);
    }

    // 어디서든 쉽게 호출할 수 있도록 전역 노출 (콘솔: runMatrix())
    window.runMatrix = matrixRain;

    // 안내 팝업을 언제든 다시 열기 (상태바 "? 도움말" 버튼 등에서 호출)
    window.showFeatureHint = function () {
        if (window.unlock) window.unlock("helper");
        showTutorial();
    };
})();
