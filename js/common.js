/* ============================================================
   common.js — 모든 페이지 공통 인터랙션
   · 다크모드 토글 (localStorage 저장)
   · 맨 위로 버튼
   · 스크롤 등장 애니메이션 (IntersectionObserver)
   · 현재 페이지 네비 활성화
   · 실시간 시계 (#clock 있을 때만)
   · 토스트 알림 유틸
   ============================================================ */

// ---------- 깨진 이미지 자동 대체 (미디어 파일 준비 전에도 안정적 표시) ----------
window.addEventListener("error", function (e) {
    var t = e.target;
    if (t && t.tagName === "IMG" && !t.dataset.fallback) {
        t.dataset.fallback = "1";
        t.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='260'%3E%3Crect width='400' height='260' fill='%23cfd8e3'/%3E%3Ctext x='200' y='135' font-size='20' fill='%23708090' text-anchor='middle'%3E%F0%9F%93%B7 PHOTO%3C/text%3E%3C/svg%3E";
    }
}, true);

// ---------- 다크모드 ----------
(function initTheme() {
    var saved = localStorage.getItem("skala-theme");
    if (saved === "dark") {
        document.documentElement.setAttribute("data-theme", "dark");
    }
})();

function toggleTheme() {
    var root = document.documentElement;
    var isDark = root.getAttribute("data-theme") === "dark";
    if (isDark) {
        root.removeAttribute("data-theme");
        localStorage.setItem("skala-theme", "light");
    } else {
        root.setAttribute("data-theme", "dark");
        localStorage.setItem("skala-theme", "dark");
    }
    updateThemeIcon();
}

function updateThemeIcon() {
    var btn = document.querySelector(".theme-toggle");
    if (!btn) return;
    var isDark = document.documentElement.getAttribute("data-theme") === "dark";
    btn.textContent = isDark ? "☀️" : "🌙";
    btn.setAttribute("aria-label", isDark ? "라이트 모드로 전환" : "다크 모드로 전환");
}

// ---------- 토스트 ----------
function showToast(message) {
    var toast = document.createElement("div");
    toast.className = "toast";
    toast.textContent = message;
    document.body.appendChild(toast);
    requestAnimationFrame(function () {
        toast.classList.add("show");
    });
    setTimeout(function () {
        toast.classList.remove("show");
        setTimeout(function () { toast.remove(); }, 300);
    }, 2200);
}

// ---------- 실시간 시계 ----------
function startClock() {
    var el = document.getElementById("clock");
    if (!el) return;
    var days = ["일", "월", "화", "수", "목", "금", "토"];
    function tick() {
        var now = new Date();
        var y = now.getFullYear();
        var m = String(now.getMonth() + 1).padStart(2, "0");
        var d = String(now.getDate()).padStart(2, "0");
        var day = days[now.getDay()];
        var hh = String(now.getHours()).padStart(2, "0");
        var mm = String(now.getMinutes()).padStart(2, "0");
        var ss = String(now.getSeconds()).padStart(2, "0");
        el.textContent = "🕒 " + y + "." + m + "." + d + " (" + day + ") " + hh + ":" + mm + ":" + ss;
    }
    tick();
    setInterval(tick, 1000);
}

// ---------- 페이지 로드 시 초기화 ----------
document.addEventListener("DOMContentLoaded", function () {
    updateThemeIcon();
    startClock();

    // 현재 페이지 네비 active 표시
    var here = location.pathname.split("/").pop() || "index.html";
    document.querySelectorAll(".topbar nav a").forEach(function (a) {
        var target = a.getAttribute("href");
        if (target === here) a.classList.add("active");
    });

    // 스크롤 등장 애니메이션
    var revealEls = document.querySelectorAll("[data-reveal]");
    if ("IntersectionObserver" in window && revealEls.length) {
        var io = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (entry.isIntersecting) {
                    entry.target.classList.add("revealed");
                    io.unobserve(entry.target);
                }
            });
        }, { threshold: 0.12 });
        revealEls.forEach(function (el) { io.observe(el); });
    } else {
        revealEls.forEach(function (el) { el.classList.add("revealed"); });
    }

    // 맨 위로 버튼
    var toTop = document.querySelector(".to-top");
    if (toTop) {
        window.addEventListener("scroll", function () {
            toTop.classList.toggle("show", window.scrollY > 320);
        });
        toTop.addEventListener("click", function () {
            window.scrollTo({ top: 0, behavior: "smooth" });
        });
    }
});
