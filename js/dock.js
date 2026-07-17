/* ============================================================
   dock.js — 우측 도크 패널 (방명록 · 현황 · 랭킹 · 낙서판)
   · VS Code 사이드바 컨셉: 아이콘 바는 항상, 패널은 눌렀을 때
   · 마크업을 여기서 주입한다 — 상단바 계정 칩과 같은 방식.
     7개 HTML 에 같은 마크업(+아이콘 스프라이트)을 복붙하지 않기 위함이며,
     덕분에 dock.js 를 불러오는 모든 페이지에 자동으로 붙는다.
   · position:fixed 라 스크롤을 따라온다
   · Esc 로 닫기 · 좁은 화면에서는 하단 시트 (CSS 가 처리)

   패널 '내용'은 각 모듈이 그린다:
     guestbook.js(방명록) · stats.js(현황·랭킹) · canvas.js(낙서판)
   이 파일은 뼈대와 열고/닫기/탭 전환만 담당한다.

   주입이 끝나면 "skala-dock-ready" 를 쏜다 → 다른 모듈은 그때 DOM 을 잡는다
   (스크립트 로드 순서에 의존하지 않도록).
   ============================================================ */

(function () {
    "use strict";

    var TABS = [
        { id: "gb",   icon: "i-guestbook", title: "방명록" },
        { id: "stat", icon: "i-stats",     title: "사이트 현황" },
        { id: "rank", icon: "i-trophy",    title: "업적 랭킹" },
        { id: "draw", icon: "i-palette",   title: "함께 그리기" }
    ];
    var SEEN_KEY = "skala-dock-seen";   // 방명록을 한 번이라도 열어봤는지

    var dock, panel, titleEl, dot;
    var tabs = [], views = [];
    var current = null;   // 열려 있는 탭 id, 닫혀 있으면 null

    /* 아이콘 스프라이트 — 한 번만 정의하고 <use> 로 재사용한다.
       stroke="currentColor" 라 테마·활성 상태에 따라 색이 따라온다. */
    var SPRITE =
        '<svg class="icon-sprite" aria-hidden="true" focusable="false">' +
        '<symbol id="i-guestbook" viewBox="0 0 24 24">' +
            '<path d="M3.5 5.5A1.5 1.5 0 0 1 5 4h14a1.5 1.5 0 0 1 1.5 1.5v9A1.5 1.5 0 0 1 19 16H9l-5.5 4.2V5.5Z"/>' +
            '<path d="M8 8.5h8M8 12h5"/></symbol>' +
        '<symbol id="i-stats" viewBox="0 0 24 24">' +
            '<path d="M4 3.5v16.5h16.5"/><path d="M8.5 17v-4.5M13 17V7.5M17.5 17v-7"/></symbol>' +
        '<symbol id="i-trophy" viewBox="0 0 24 24">' +
            '<path d="M7.5 4h9v5.5a4.5 4.5 0 0 1-9 0V4Z"/>' +
            '<path d="M7.5 6H5.5a2 2 0 0 0 0 4h2M16.5 6h2a2 2 0 0 1 0 4h-2"/>' +
            '<path d="M12 14v3.5M9 20.5h6M10 17.5h4"/></symbol>' +
        '<symbol id="i-heart" viewBox="0 0 24 24">' +
            '<path d="M12 20.5s-6.6-4.3-8.6-8C1.6 9.2 3.4 5.6 6.8 5.1c1.9-.3 3.8.6 5.2 2.3 1.4-1.7 3.3-2.6 5.2-2.3 3.4.5 5.2 4.1 3.4 7.4-2 3.7-8.6 8-8.6 8Z"/></symbol>' +
        '<symbol id="i-palette" viewBox="0 0 24 24">' +
            '<path d="M12 3.5c-4.7 0-8.5 3.6-8.5 8s3.8 8 8.5 8c1.4 0 2-.9 2-1.8 0-.5-.2-.9-.5-1.2-.3-.4-.5-.8-.5-1.3 0-1 .8-1.7 1.8-1.7h1.7c2.5 0 4.5-2 4.5-4.5 0-3.5-3.6-5.5-9-5.5Z"/>' +
            '<circle cx="7.5" cy="11.5" r="1.1"/><circle cx="11" cy="7.5" r="1.1"/><circle cx="16" cy="8.5" r="1.1"/></symbol>' +
        '</svg>';

    function markup() {
        var rail = TABS.map(function (t) {
            return '<button type="button" class="dock-tab" data-panel="' + t.id + '"' +
                   ' aria-label="' + t.title + '" title="' + t.title + '">' +
                   '<svg class="ico dock-ico" aria-hidden="true"><use href="#' + t.icon + '"/></svg>' +
                   (t.id === "gb" ? '<span class="dock-dot" id="dockDot" hidden></span>' : '') +
                   '</button>';
        }).join("");

        var views = TABS.map(function (t) {
            return '<div class="dock-view" data-view="' + t.id + '"' +
                   (t.id === "gb" ? ' id="guestbook"' : "") + ' hidden></div>';
        }).join("");

        return SPRITE +
            '<div class="dock" id="dock">' +
                '<nav class="dock-rail" aria-label="사이드 패널">' + rail + '</nav>' +
                '<section class="dock-panel" id="dockPanel" aria-live="polite" hidden>' +
                    '<header class="dock-head">' +
                        '<span class="dock-title" id="dockTitle"></span>' +
                        '<button type="button" class="dock-close" id="dockClose" aria-label="패널 닫기">✕</button>' +
                    '</header>' +
                    '<div class="dock-body">' + views + '</div>' +
                '</section>' +
            '</div>';
    }

    /* 패널은 상단바 아래에서 시작해야 네비게이션을 가리지 않는다.
       상단바 높이는 폰트·줄바꿈에 따라 달라지므로 값을 박지 않고 실제로 잰다. */
    function syncTopbarHeight() {
        var tb = document.querySelector(".topbar");
        if (!tb) return;
        document.documentElement.style.setProperty("--topbar-h", tb.offsetHeight + "px");
    }

    function open(id) {
        if (!TABS.some(function (t) { return t.id === id; })) return;
        current = id;
        panel.hidden = false;
        document.body.classList.add("dock-open");
        titleEl.textContent = (TABS.filter(function (t) { return t.id === id; })[0] || {}).title || "";

        views.forEach(function (v) { v.hidden = v.getAttribute("data-view") !== id; });
        tabs.forEach(function (t) {
            var on = t.getAttribute("data-panel") === id;
            t.classList.toggle("active", on);
            t.setAttribute("aria-expanded", on ? "true" : "false");
        });

        if (id === "gb") {
            try { localStorage.setItem(SEEN_KEY, "1"); } catch (e) { /* noop */ }
            if (dot) dot.hidden = true;
        }

        // 각 패널의 내용은 처음 열릴 때 로드된다 (guestbook.js / stats.js / canvas.js 가 듣는다).
        // 아무도 안 여는 패널 때문에 요청·웹소켓을 쓰지 않기 위함.
        window.dispatchEvent(new CustomEvent("skala-dock-open", { detail: { view: id } }));
    }

    function close() {
        current = null;
        panel.hidden = true;
        document.body.classList.remove("dock-open");
        tabs.forEach(function (t) {
            t.classList.remove("active");
            t.setAttribute("aria-expanded", "false");
        });
        window.dispatchEvent(new CustomEvent("skala-dock-close"));
    }

    function toggle(id) { if (current === id) close(); else open(id); }

    document.addEventListener("DOMContentLoaded", function () {
        // 상단바가 있는 페이지에만 붙인다 (도크는 사이트 공통 UI)
        if (!document.querySelector(".topbar")) return;
        if (document.getElementById("dock")) return;   // 중복 주입 방지

        var host = document.createElement("div");
        host.innerHTML = markup();
        while (host.firstChild) document.body.appendChild(host.firstChild);

        dock = document.getElementById("dock");
        panel = document.getElementById("dockPanel");
        titleEl = document.getElementById("dockTitle");
        dot = document.getElementById("dockDot");
        tabs = Array.prototype.slice.call(dock.querySelectorAll(".dock-tab"));
        views = Array.prototype.slice.call(dock.querySelectorAll(".dock-view"));

        syncTopbarHeight();
        window.addEventListener("resize", syncTopbarHeight);

        tabs.forEach(function (t) {
            t.setAttribute("aria-expanded", "false");
            t.addEventListener("click", function () { toggle(t.getAttribute("data-panel")); });
        });
        document.getElementById("dockClose").addEventListener("click", close);

        // Esc 로 닫기 — 단, 모달(다이얼로그·명령 팔레트)이 떠 있으면 그쪽이 우선
        document.addEventListener("keydown", function (e) {
            if (e.key !== "Escape" || !current) return;
            if (document.querySelector(".sk-dialog-ov, .cmdk-overlay.show, .ach-modal-ov")) return;
            close();
        });

        // 방명록을 아직 안 열어본 방문자에게 배지로 유도
        var seen = null;
        try { seen = localStorage.getItem(SEEN_KEY); } catch (e) { /* noop */ }
        if (!seen && dot) dot.hidden = false;

        window.openDock = open;
        window.closeDock = close;

        // 내용 모듈들이 이제 DOM 을 잡을 수 있다 (로드 순서와 무관하게)
        window.dispatchEvent(new CustomEvent("skala-dock-ready"));

        // 다른 페이지의 명령 팔레트에서 "방명록 남기기" 등을 고르면
        // 이동하면서 표시를 남긴다 → 여기서 받아 연다
        var pending = null;
        try {
            pending = sessionStorage.getItem("skala-dock-open");
            if (pending) sessionStorage.removeItem("skala-dock-open");
        } catch (e) { /* noop */ }
        if (pending) open(pending);
    });
})();
