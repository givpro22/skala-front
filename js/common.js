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

// ---------- 테마 (기본: 다크 IDE / 토글: 라이트) ----------
(function initTheme() {
    var saved = localStorage.getItem("skala-theme");
    if (saved === "light") {
        document.documentElement.setAttribute("data-theme", "light");
    }
    // 저장값이 없거나 "dark" 면 기본(다크) 유지
})();

function toggleTheme() {
    var root = document.documentElement;
    var isLight = root.getAttribute("data-theme") === "light";
    if (isLight) {
        root.removeAttribute("data-theme");
        localStorage.setItem("skala-theme", "dark");
    } else {
        root.setAttribute("data-theme", "light");
        localStorage.setItem("skala-theme", "light");
    }
    if (window.unlock) window.unlock("theme");
    updateThemeIcon();
}

function updateThemeIcon() {
    var btn = document.querySelector(".theme-toggle");
    if (!btn) return;
    var isLight = document.documentElement.getAttribute("data-theme") === "light";
    // 현재 라이트면 다크로 갈 수 있게 달, 현재 다크면 해 표시
    btn.textContent = isLight ? "🌙" : "☀️";
    btn.setAttribute("aria-label", isLight ? "다크 모드로 전환" : "라이트 모드로 전환");
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
    injectStatusBar();
    initCommandPalette();

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

/* ---------- VS Code 하단 상태바 ---------- */
function injectStatusBar() {
    if (document.querySelector(".statusbar")) return;
    var bar = document.createElement("div");
    bar.className = "statusbar";
    bar.innerHTML =
        '<div class="left">' +
            '<span class="sb accent">⎇ feature/ui-upgrade</span>' +
            '<span class="sb">✓ 0  ✕ 0</span>' +
            '<span class="sb kbd" data-cmdk title="명령 팔레트 열기">⌘K 명령</span>' +
            '<span class="sb kbd help" data-hint title="단축키 &amp; 숨은 기능 보기">? 도움말</span>' +
            '<span class="sb kbd" data-ambient title="배경 캐릭터 설정 (클릭)">✨ 배경</span>' +
            '<span class="sb ach kbd" id="achBadge" title="업적 보기 (클릭)">🏆 0/9</span>' +
        '</div>' +
        '<div class="right">' +
            '<span class="sb">UTF-8</span>' +
            '<span class="sb">HTML</span>' +
            '<span class="sb accent2" id="sbClock">--:--:--</span>' +
            '<span class="sb" id="sbCoord" title="클릭한 위치의 좌표">Ln 1, Col 1</span>' +
        '</div>';
    document.body.appendChild(bar);

    function tick() {
        var n = new Date();
        var el = document.getElementById("sbClock");
        if (el) {
            el.textContent =
                String(n.getHours()).padStart(2, "0") + ":" +
                String(n.getMinutes()).padStart(2, "0") + ":" +
                String(n.getSeconds()).padStart(2, "0");
        }
    }
    tick();
    setInterval(tick, 1000);

    var kbd = bar.querySelector("[data-cmdk]");
    if (kbd) kbd.addEventListener("click", openCmdk);

    var hintBtn = bar.querySelector("[data-hint]");
    if (hintBtn) hintBtn.addEventListener("click", function () {
        if (typeof window.showFeatureHint === "function") window.showFeatureHint();
    });

    var ambBtn = bar.querySelector("[data-ambient]");
    if (ambBtn) ambBtn.addEventListener("click", function () {
        if (typeof window.openAmbientSettings === "function") window.openAmbientSettings();
    });

    var achBtn = bar.querySelector("#achBadge");
    if (achBtn) achBtn.addEventListener("click", function () {
        if (typeof window.openAchievements === "function") window.openAchievements();
    });

    // 클릭 위치를 에디터 좌표처럼 갱신 (Ln = y, Col = x)
    document.addEventListener("click", function (e) {
        var c = document.getElementById("sbCoord");
        if (c) c.textContent = "Ln " + e.clientY + ", Col " + e.clientX;
    });

    if (typeof window.updateAchBadge === "function") window.updateAchBadge();
}

/* ---------- 커맨드 팔레트 (⌘K / Ctrl+K) ---------- */
var CMDK_ITEMS = [
    { label: "홈으로 이동", hint: "index.html", icon: "🏠", href: "index.html" },
    { label: "소개 보기", hint: "myProfile.html", icon: "👤", href: "myProfile.html" },
    { label: "강의 시간표", hint: "myClass.html", icon: "📅", href: "myClass.html" },
    { label: "휴일 일과", hint: "holiday.html", icon: "🎉", href: "holiday.html" },
    { label: "여행 앨범", hint: "myTrip.html", icon: "🌏", href: "myTrip.html" },
    { label: "회원가입", hint: "signUp.html", icon: "📝", href: "signUp.html" },
    { label: "테마 전환 (다크 / 라이트)", hint: "theme", icon: "🌓", action: "theme" },
    { label: "매트릭스 효과 실행", hint: "matrix", icon: "🟦", action: "matrix" },
    { label: "업적 보기", hint: "achievements", icon: "🏆", action: "ach" },
    { label: "사용법 안내 보기", hint: "tutorial help", icon: "❔", action: "help" },
    { label: "배경 캐릭터 설정 (밀도)", hint: "ambient background density", icon: "✨", action: "ambient" },
    { label: "맨 위로 스크롤", hint: "scroll top", icon: "⬆️", action: "top" },
    { label: "GitHub 프로필 열기", hint: "github.com/givpro22", icon: "🔗", href: "https://github.com/givpro22", external: true }
];

var cmdkState = { open: false, sel: 0, filtered: CMDK_ITEMS };

function initCommandPalette() {
    if (document.getElementById("cmdkOverlay")) return;
    var overlay = document.createElement("div");
    overlay.className = "cmdk-overlay";
    overlay.id = "cmdkOverlay";
    overlay.innerHTML =
        '<div class="cmdk" role="dialog" aria-label="명령 팔레트">' +
            '<input type="text" id="cmdkInput" placeholder="  명령 또는 페이지 검색...   (Esc 닫기)" autocomplete="off">' +
            '<ul id="cmdkList"></ul>' +
        '</div>';
    document.body.appendChild(overlay);

    var input = document.getElementById("cmdkInput");

    overlay.addEventListener("click", function (e) {
        if (e.target === overlay) closeCmdk();
    });

    input.addEventListener("input", function () {
        renderCmdk(input.value);
    });

    input.addEventListener("keydown", function (e) {
        if (e.key === "ArrowDown") { e.preventDefault(); moveCmdkSel(1); }
        else if (e.key === "ArrowUp") { e.preventDefault(); moveCmdkSel(-1); }
        else if (e.key === "Enter") { e.preventDefault(); runCmdk(cmdkState.filtered[cmdkState.sel]); }
        else if (e.key === "Escape") { closeCmdk(); }
    });

    // 전역 단축키
    document.addEventListener("keydown", function (e) {
        if ((e.metaKey || e.ctrlKey) && (e.key === "k" || e.key === "K")) {
            e.preventDefault();
            cmdkState.open ? closeCmdk() : openCmdk();
        }
    });
}

function moveCmdkSel(dir) {
    var n = cmdkState.filtered.length;
    if (!n) return;
    cmdkState.sel = (cmdkState.sel + dir + n) % n;
    highlightCmdk();
}

function renderCmdk(query) {
    var list = document.getElementById("cmdkList");
    if (!list) return;
    var q = (query || "").trim().toLowerCase();
    cmdkState.filtered = CMDK_ITEMS.filter(function (it) {
        return !q || it.label.toLowerCase().indexOf(q) >= 0 || it.hint.toLowerCase().indexOf(q) >= 0;
    });
    cmdkState.sel = 0;
    list.innerHTML = "";
    if (!cmdkState.filtered.length) {
        list.innerHTML = '<li class="empty">일치하는 명령이 없어요 🔍</li>';
        return;
    }
    cmdkState.filtered.forEach(function (it, i) {
        var li = document.createElement("li");
        li.innerHTML =
            '<span class="ic">' + it.icon + '</span>' +
            '<span>' + it.label + '</span>' +
            '<span class="k">' + it.hint + '</span>';
        li.addEventListener("mouseenter", function () { cmdkState.sel = i; highlightCmdk(); });
        li.addEventListener("click", function () { runCmdk(it); });
        list.appendChild(li);
    });
    highlightCmdk();
}

function highlightCmdk() {
    var items = document.querySelectorAll("#cmdkList li");
    items.forEach(function (li, i) {
        li.classList.toggle("sel", i === cmdkState.sel);
    });
    var sel = items[cmdkState.sel];
    if (sel && sel.scrollIntoView) sel.scrollIntoView({ block: "nearest" });
}

function runCmdk(item) {
    if (!item) return;
    closeCmdk();
    if (item.action === "theme") { toggleTheme(); showToast("🌓 테마를 전환했어요"); }
    else if (item.action === "matrix") {
        if (typeof window.runMatrix === "function") { window.runMatrix(); showToast("> DEVELOPER MODE"); }
    }
    else if (item.action === "ach") {
        if (typeof window.openAchievements === "function") window.openAchievements();
    }
    else if (item.action === "help") {
        if (typeof window.showFeatureHint === "function") window.showFeatureHint();
    }
    else if (item.action === "ambient") {
        if (typeof window.openAmbientSettings === "function") window.openAmbientSettings();
    }
    else if (item.action === "top") { window.scrollTo({ top: 0, behavior: "smooth" }); }
    else if (item.href && item.external) { window.open(item.href, "_blank", "noopener"); }
    else if (item.href) { location.href = item.href; }
}

function openCmdk() {
    var overlay = document.getElementById("cmdkOverlay");
    if (!overlay) return;
    if (window.unlock) window.unlock("palette");
    cmdkState.open = true;
    overlay.classList.add("open");
    renderCmdk("");
    var input = document.getElementById("cmdkInput");
    input.value = "";
    setTimeout(function () { input.focus(); }, 30);
}

function closeCmdk() {
    var overlay = document.getElementById("cmdkOverlay");
    if (!overlay) return;
    cmdkState.open = false;
    overlay.classList.remove("open");
}
