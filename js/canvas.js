/* ============================================================
   canvas.js — 함께 그리기 (공동 픽셀 캔버스)
   · 32×32 격자를 모든 방문자가 공유한다 (r/place 미니판)
   · 남이 칠한 칸도 덮어쓸 수 있고, 변경은 Realtime 으로 즉시 퍼진다
   · 칠하려면 신원이 필요 → 없으면 조용히 익명 로그인
   · 도배 방지는 DB 트리거(2초에 한 칸)가 담당한다 — 여기서는 안내만

   격자를 DOM 1024개로 만들면 무거워서 <canvas> 로 그린다.
   ============================================================ */

(function () {
    "use strict";

    var SIZE = 32;          // 32×32
    var CELL = 10;          // 셀 한 변(px) → 320×320
    var PALETTE = [
        "#0d1117", "#ffffff", "#ff7b72", "#f0b429",
        "#3fb950", "#58a6ff", "#a371f7", "#ff9bce",
        "#79c0ff", "#8b949e"
    ];

    var view, cv, ctx, statusEl, swatchWrap;
    var pixels = {};        // "x,y" → color index
    var picked = 5;         // 기본 색 (브랜드 블루)
    var started = false;
    var busy = false;

    function status(text, kind) { showFormStatus(statusEl, text, kind); }

    var VIEW_HTML =
        '<p class="dock-sub">모든 방문자가 함께 쓰는 32×32 도화지예요. ' +
            '칸을 눌러 칠하면 다른 사람 화면에도 바로 나타납니다. ' +
            '남이 칠한 칸도 덮어쓸 수 있어요.</p>' +
        '<div class="cv-palette" id="cvPalette" role="radiogroup" aria-label="색 선택"></div>' +
        '<div class="cv-wrap">' +
            '<canvas id="cvBoard" width="' + SIZE * CELL + '" height="' + SIZE * CELL + '"' +
            ' aria-label="공동 픽셀 캔버스"></canvas>' +
        '</div>' +
        '<p class="form-status" id="cvStatus" role="status" aria-live="polite"></p>';

    /* ---------- 그리기 ---------- */
    function draw() {
        // 배경 + 격자
        ctx.fillStyle = PALETTE[0];
        ctx.fillRect(0, 0, SIZE * CELL, SIZE * CELL);

        Object.keys(pixels).forEach(function (k) {
            var xy = k.split(",");
            ctx.fillStyle = PALETTE[pixels[k]] || PALETTE[0];
            ctx.fillRect(xy[0] * CELL, xy[1] * CELL, CELL, CELL);
        });

        // 격자선 — 어디를 누르는지 보이도록
        ctx.strokeStyle = "rgba(139,148,158,0.18)";
        ctx.lineWidth = 1;
        for (var i = 0; i <= SIZE; i++) {
            ctx.beginPath();
            ctx.moveTo(i * CELL + 0.5, 0); ctx.lineTo(i * CELL + 0.5, SIZE * CELL);
            ctx.moveTo(0, i * CELL + 0.5); ctx.lineTo(SIZE * CELL, i * CELL + 0.5);
            ctx.stroke();
        }
    }

    function renderPalette() {
        swatchWrap.textContent = "";
        PALETTE.forEach(function (c, i) {
            var b = document.createElement("button");
            b.type = "button";
            b.className = "cv-swatch" + (i === picked ? " on" : "");
            b.style.background = c;
            b.setAttribute("role", "radio");
            b.setAttribute("aria-checked", i === picked ? "true" : "false");
            b.setAttribute("aria-label", "색 " + (i + 1));
            b.addEventListener("click", function () {
                picked = i;
                renderPalette();
            });
            swatchWrap.appendChild(b);
        });
    }

    /* ---------- 서버에서 받아오기 ---------- */
    function load() {
        return window.supabaseReady.then(function (sb) {
            return sb.from("canvas_pixels").select("x,y,color");
        }).then(function (res) {
            if (res.error) throw res.error;
            pixels = {};
            (res.data || []).forEach(function (p) { pixels[p.x + "," + p.y] = p.color; });
            draw();
        }).catch(function (e) {
            console.error("[canvas] 불러오기 실패:", e);
            status(window.SkalaAuth.errorText(e), "err");
        });
    }

    /* ---------- 칠하기 ---------- */
    function paint(x, y) {
        if (busy) return;
        busy = true;

        var prev = pixels[x + "," + y];
        // 낙관적 반영 — 서버 왕복을 기다리지 않고 바로 칠해 보여준다
        pixels[x + "," + y] = picked;
        draw();

        window.supabaseReady.then(function (sb) {
            return sb.auth.getSession().then(function (s) {
                var session = s.data && s.data.session;
                if (session) return session;
                // 칠하려면 신원이 필요하다 → 조용히 익명 계정 발급
                return window.SkalaAuth.signInAnonymously(
                    localStorage.getItem("skala-nick") || "익명"
                ).then(function (r) {
                    if (r.error) throw window.SkalaAuth.friendlyError(r.error);
                    return sb.auth.getSession().then(function (s2) { return s2.data.session; });
                });
            }).then(function (session) {
                return sb.from("canvas_pixels").upsert({
                    x: x, y: y, color: picked, user_id: session.user.id
                }, { onConflict: "x,y" });
            });
        }).then(function (res) {
            if (res && res.error) throw res.error;
            status("", "");
            if (window.unlock) window.unlock("painter");
        }).catch(function (e) {
            // 실패하면 낙관적 반영을 되돌린다 (화면과 서버가 어긋나면 안 된다)
            if (prev === undefined) delete pixels[x + "," + y];
            else pixels[x + "," + y] = prev;
            draw();

            var m = /canvas_rate_limit/.test(e.message || "")
                ? "너무 빨라요! 2초에 한 칸씩 칠할 수 있어요."
                : window.SkalaAuth.errorText(e);
            status("❌ " + m, "err");
        }).then(function () {
            busy = false;
        });
    }

    /* ---------- Realtime ---------- */
    function subscribe(sb) {
        sb.channel("canvas-live")
            .on("postgres_changes",
                { event: "*", schema: "public", table: "canvas_pixels" },
                function (payload) {
                    var p = payload.new;
                    if (!p) return;
                    pixels[p.x + "," + p.y] = p.color;
                    draw();
                })
            .subscribe();
    }

    /* ---------- 초기화 ---------- */
    window.addEventListener("skala-dock-ready", function () {
        view = document.querySelector('[data-view="draw"]');
        if (!view) return;
        view.innerHTML = VIEW_HTML;

        cv = document.getElementById("cvBoard");
        ctx = cv.getContext("2d");
        statusEl = document.getElementById("cvStatus");
        swatchWrap = document.getElementById("cvPalette");

        renderPalette();
        draw();

        cv.addEventListener("click", function (e) {
            var r = cv.getBoundingClientRect();
            // 캔버스가 CSS 로 축소될 수 있으므로 실제 크기 비율로 환산한다
            var x = Math.floor((e.clientX - r.left) / r.width * SIZE);
            var y = Math.floor((e.clientY - r.top) / r.height * SIZE);
            if (x < 0 || y < 0 || x >= SIZE || y >= SIZE) return;
            paint(x, y);
        });
    });

    // 패널을 처음 열 때만 받아오고 구독한다
    window.addEventListener("skala-dock-open", function (e) {
        if (e.detail.view !== "draw" || started) return;
        started = true;
        window.supabaseReady.then(function (sb) {
            load();
            subscribe(sb);
        }).catch(function () {
            status("Supabase 설정이 필요합니다.", "err");
        });
    });
})();
