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

    /* ---------- 숨은 기능 안내 팝업 (메인, 세션당 1회) ---------- */
    function featureHint() {
        if (!isHome) return;
        if (sessionStorage.getItem("skala-hint")) return;
        // 부팅 화면이 끝날 시간을 고려해 지연
        var delay = sessionStorage.getItem("skala-booted") ? 900 : 2900;
        setTimeout(buildHint, delay);
    }

    function buildHint() {
        if (document.getElementById("hintPop")) return;
        var pop = document.createElement("div");
        pop.className = "hint-pop";
        pop.id = "hintPop";
        pop.innerHTML =
            '<div class="hint-head"><span>단축키 &amp; 숨은 기능</span>' +
                '<button class="hint-close" aria-label="닫기">&times;</button></div>' +
            '<div class="hint-body">' +
                '<div class="hint-row">' +
                    '<div class="hint-keys"><kbd>⌘</kbd><kbd>K</kbd>' +
                        '<span style="color:var(--text-soft);font-size:.78rem;margin-left:4px">/ Ctrl+K</span></div>' +
                    '<div class="hint-desc">명령 팔레트 — 페이지 이동 · 테마 전환</div>' +
                '</div>' +
                '<div class="hint-row">' +
                    '<div class="hint-keys"><kbd>↑</kbd><kbd>↑</kbd><kbd>↓</kbd><kbd>↓</kbd></div>' +
                    '<div class="hint-desc">코나미 코드 — 매트릭스 이스터에그 실행</div>' +
                '</div>' +
                '<button class="hint-try btn btn-primary" id="hintTry">지금 ⌘K 열어보기</button>' +
            '</div>';
        document.body.appendChild(pop);
        requestAnimationFrame(function () { pop.classList.add("show"); });
        sessionStorage.setItem("skala-hint", "1");

        function close() {
            pop.classList.remove("show");
            setTimeout(function () { if (pop.parentNode) pop.remove(); }, 350);
        }
        pop.querySelector(".hint-close").addEventListener("click", close);
        pop.querySelector("#hintTry").addEventListener("click", function () {
            close();
            if (typeof window.openCmdk === "function") window.openCmdk();
        });
        setTimeout(close, 14000); // 14초 후 자동 닫힘
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
                matrixRain();
                if (typeof showToast === "function") showToast("> DEVELOPER MODE UNLOCKED");
            }
        });
    }

    function matrixRain() {
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
        var ex = document.getElementById("hintPop");
        if (ex) ex.remove();
        buildHint();
    };
})();
