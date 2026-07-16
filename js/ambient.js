/* ============================================================
   ambient.js — 배경 앰비언트 코드 글리프
   · 콘텐츠 "뒤" 배경에서 코드 기호가 자유롭게 떠다님
   · 밀도 설정 가능 (끄기 / 적게 / 보통 / 많이) — localStorage 저장
   · 명령 팔레트 '배경 캐릭터 설정' 에서 조절
   · pointer-events 없음 (상호작용/방해 없음)
   ============================================================ */

(function () {
    "use strict";

    var CHARS = ["</>", "{ }", "=>", "01", "$_", "();", "&&", "[ ]", "::", "//",
                 "==", "#!", "fn", "let", "if", "0x", "++", "||", "<=", "=>", "``"];
    var COLORS = ["#58a6ff", "#79c0ff", "#a371f7", "#d2a8ff"];
    var COUNTS = { off: 0, low: 12, medium: 24, high: 42 };

    var layer = null, sprites = [], raf = null, t = 0;
    var mx = -9999, my = -9999;

    // 마우스 추적 & 클릭 충격파 (한 번만 등록)
    document.addEventListener("mousemove", function (e) { mx = e.clientX; my = e.clientY; }, { passive: true });
    document.addEventListener("click", function (e) {
        var cx = e.clientX, cy = e.clientY, R = 210;
        sprites.forEach(function (s) {
            var rx = (s.x + s.px) - cx, ry = (s.y + s.py) - cy;
            var d = Math.sqrt(rx * rx + ry * ry) || 1;
            if (d < R) {
                var f = (1 - d / R) * 26;
                s.px += (rx / d) * f;
                s.py += (ry / d) * f;
            }
        });
    });

    function getLevel() {
        var v = localStorage.getItem("skala-ambient");
        if (v === null || v === "on") return "medium";  // 기본값 / 이전값 호환
        if (v === "off") return "off";
        return COUNTS.hasOwnProperty(v) ? v : "medium";
    }

    function create(count) {
        layer = document.createElement("div");
        layer.className = "ambient-layer";
        layer.setAttribute("aria-hidden", "true");
        document.body.appendChild(layer);
        var w = window.innerWidth, h = window.innerHeight;
        sprites = [];
        for (var i = 0; i < count; i++) {
            var el = document.createElement("span");
            el.className = "ambient-char";
            el.textContent = CHARS[i % CHARS.length];
            el.style.color = COLORS[i % COLORS.length];
            layer.appendChild(el);
            sprites.push({
                el: el,
                x: Math.random() * (w - 40),
                y: Math.random() * (h - 60),
                px: 0, py: 0,
                vx: (Math.random() < 0.5 ? -1 : 1) * (0.22 + Math.random() * 0.3),
                vy: (Math.random() < 0.5 ? -1 : 1) * (0.18 + Math.random() * 0.25),
                phase: Math.random() * 100
            });
        }
        raf = requestAnimationFrame(loop);
    }

    function destroy() {
        if (raf) cancelAnimationFrame(raf);
        raf = null;
        if (layer) layer.remove();
        layer = null;
        sprites = [];
    }

    function loop() {
        raf = requestAnimationFrame(loop);
        t++;
        var w = window.innerWidth, h = window.innerHeight;
        var R = 130;
        sprites.forEach(function (s) {
            // 기본 배회
            s.x += s.vx;
            s.y += s.vy;
            if (s.x <= 0) { s.x = 0; s.vx = Math.abs(s.vx); }
            else if (s.x >= w - 34) { s.x = w - 34; s.vx = -Math.abs(s.vx); }
            if (s.y <= 0) { s.y = 0; s.vy = Math.abs(s.vy); }
            else if (s.y >= h - 40) { s.y = h - 40; s.vy = -Math.abs(s.vy); }

            // 커서 근처면 밀려나고 밝아짐
            var op = 0.22;
            var rx = (s.x + s.px) - mx, ry = (s.y + s.py) - my;
            var d2 = rx * rx + ry * ry;
            if (d2 < R * R && d2 > 1) {
                var d = Math.sqrt(d2), f = 1 - d / R;
                s.px += (rx / d) * f * 2.4;
                s.py += (ry / d) * f * 2.4;
                op = 0.22 + f * 0.55;
            }

            // 상호작용 오프셋은 서서히 원위치로
            s.px *= 0.88;
            s.py *= 0.88;

            var bob = Math.sin((t + s.phase) * 0.05) * 2;
            s.el.style.transform = "translate(" + (s.x + s.px) + "px," + (s.y + s.py + bob) + "px)";
            s.el.style.opacity = op.toFixed(2);
        });
    }

    function render() {
        destroy();
        var count = COUNTS[getLevel()] || 0;
        if (count > 0) create(count);
    }

    // 밀도 설정 (설정 모달에서 호출)
    window.setAmbientDensity = function (level) {
        localStorage.setItem("skala-ambient", level);
        render();
    };

    // 설정 모달
    window.openAmbientSettings = function () {
        if (document.getElementById("ambOv")) return;
        var cur = getLevel();
        var levels = [["off", "끄기"], ["low", "적게"], ["medium", "보통"], ["high", "많이"]];
        var btns = levels.map(function (l) {
            return '<button class="amb-opt' + (l[0] === cur ? " on" : "") + '" data-lv="' + l[0] + '">' + l[1] + "</button>";
        }).join("");

        var ov = document.createElement("div");
        ov.className = "amb-ov";
        ov.id = "ambOv";
        ov.innerHTML =
            '<div class="amb-modal" role="dialog" aria-label="배경 설정">' +
                '<div class="amb-head"><span>배경 캐릭터 설정</span>' +
                    '<button class="amb-close" aria-label="닫기">&times;</button></div>' +
                '<div class="amb-body">' +
                    '<p class="amb-note">떠다니는 코드 글리프의 밀도를 조절하세요.</p>' +
                    '<div class="amb-opts">' + btns + '</div>' +
                '</div>' +
            '</div>';
        document.body.appendChild(ov);

        function close() {
            ov.classList.remove("show");
            document.removeEventListener("keydown", onKey);
            setTimeout(function () { if (ov.parentNode) ov.remove(); }, 200);
        }
        function onKey(e) { if (e.key === "Escape") close(); }
        ov.addEventListener("click", function (e) { if (e.target === ov) close(); });
        ov.querySelector(".amb-close").addEventListener("click", close);
        ov.querySelectorAll(".amb-opt").forEach(function (b) {
            b.addEventListener("click", function () {
                window.setAmbientDensity(b.getAttribute("data-lv"));
                ov.querySelectorAll(".amb-opt").forEach(function (x) { x.classList.remove("on"); });
                b.classList.add("on");
                if (window.unlock) window.unlock("ambient");
            });
        });
        document.addEventListener("keydown", onKey);
        requestAnimationFrame(function () { ov.classList.add("show"); });
    };

    document.addEventListener("DOMContentLoaded", render);
})();
