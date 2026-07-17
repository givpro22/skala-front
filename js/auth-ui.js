/* ============================================================
   auth-ui.js — 상단바 계정 표시
   · 모든 페이지의 .topbar 에 계정 칩을 끼워 넣는다
     (상단바 마크업이 7개 파일에 흩어져 있어, HTML 을 고치는 대신
      statusbar 처럼 JS 로 주입한다 — 한 곳만 관리하면 된다)
   · 로그인 O → ● 닉네임 ▾  (내 계정 / 로그아웃 메뉴)
   · 로그인 X → 로그인 링크
   · 방명록으로 생긴 익명 세션은 '로그인'으로 치지 않는다 (getMember 사용)
   ============================================================ */

(function () {
    "use strict";

    var wrap = null;
    var menuOpen = false;

    /* 표시 이름: 닉네임 > 아이디 > 이메일 앞부분 순.
       실명(name)은 쓰지 않는다 — 상단바는 늘 보이는 자리라 노출 위험이 크다. */
    function displayName(user, profile) {
        if (profile && profile.nickname) return profile.nickname;
        if (profile && profile.handle) return profile.handle;
        if (user && user.email) return user.email.split("@")[0];
        return "계정";
    }

    function closeMenu() {
        menuOpen = false;
        var menu = document.getElementById("acctMenu");
        var chip = document.getElementById("acctChip");
        if (menu) menu.hidden = true;
        if (chip) chip.setAttribute("aria-expanded", "false");
    }

    function toggleMenu() {
        var menu = document.getElementById("acctMenu");
        var chip = document.getElementById("acctChip");
        if (!menu) return;
        menuOpen = !menuOpen;
        menu.hidden = !menuOpen;
        chip.setAttribute("aria-expanded", menuOpen ? "true" : "false");
    }

    /* 로그아웃 상태 */
    function renderGuest() {
        wrap.innerHTML = "";
        var a = document.createElement("a");
        a.className = "acct-login";
        a.href = "login.html";
        a.textContent = "로그인";
        wrap.appendChild(a);
    }

    /* 로그인 상태 */
    function renderMember(user, profile) {
        wrap.innerHTML = "";

        var chip = document.createElement("button");
        chip.type = "button";
        chip.className = "acct-chip";
        chip.id = "acctChip";
        chip.setAttribute("aria-haspopup", "menu");
        chip.setAttribute("aria-expanded", "false");

        var dot = document.createElement("span");
        dot.className = "acct-dot";
        chip.appendChild(dot);

        // 내 칭호 — 로컬 선택값을 우선 쓴다 (방금 바꾼 게 바로 보이도록).
        // 내 화면이므로 서버 검증 없이 표시해도 무방하다.
        var titleId = (typeof window.getTitle === "function" && window.getTitle()) ||
                      (profile && profile.title) || "";
        var titleEl = renderTitle(titleId);
        if (titleEl) { titleEl.classList.add("acct-title"); chip.appendChild(titleEl); }

        // 닉네임은 사용자 입력 → textContent 로 넣는다
        var name = document.createElement("span");
        name.className = "acct-name";
        name.textContent = displayName(user, profile);
        chip.appendChild(name);

        var caret = document.createElement("span");
        caret.className = "acct-caret";
        caret.textContent = "▾";
        chip.appendChild(caret);

        chip.addEventListener("click", function (e) {
            e.stopPropagation();
            toggleMenu();
        });
        wrap.appendChild(chip);

        var menu = document.createElement("div");
        menu.className = "acct-menu";
        menu.id = "acctMenu";
        menu.setAttribute("role", "menu");
        menu.hidden = true;

        var profileLink = document.createElement("a");
        profileLink.setAttribute("role", "menuitem");
        profileLink.href = "myProfile.html";
        profileLink.textContent = "내 계정";
        menu.appendChild(profileLink);

        var out = document.createElement("button");
        out.type = "button";
        out.setAttribute("role", "menuitem");
        out.className = "acct-out";
        out.textContent = "로그아웃";
        out.addEventListener("click", function () {
            out.disabled = true;
            window.SkalaAuth.signOut().then(function (res) {
                if (res.error) {
                    out.disabled = false;
                    showToast("⚠️ " + res.error);
                    return;
                }
                closeMenu();
                showToast("로그아웃했습니다.");
                // 회원 전용 화면(내 계정 등)에 머물러 있을 수 있으므로 새로 그린다
                location.reload();
            });
        });
        menu.appendChild(out);

        wrap.appendChild(menu);
    }

    function refresh() {
        // 익명 세션(방명록)은 회원이 아니다 → getMember
        window.SkalaAuth.getMember().then(function (res) {
            if (!res.user) { renderGuest(); return; }
            return window.SkalaAuth.getProfile().then(function (p) {
                renderMember(res.user, p.profile);
            });
        }).catch(function () {
            renderGuest();
        });
    }

    document.addEventListener("DOMContentLoaded", function () {
        var bar = document.querySelector(".topbar");
        if (!bar || !window.SkalaAuth) return;

        wrap = document.createElement("div");
        wrap.className = "acct";
        var themeBtn = bar.querySelector(".theme-toggle");
        if (themeBtn) bar.insertBefore(wrap, themeBtn);
        else bar.appendChild(wrap);

        renderGuest();   // 세션 확인 전에는 로그아웃 상태로 (깜빡임 최소화)
        refresh();

        // 로그인/로그아웃/익명 로그인 시 상단바를 다시 그린다
        window.SkalaAuth.onAuthChange(function () { refresh(); });

        // 칭호를 바꾸면 계정 칩을 다시 그린다
        window.addEventListener("skala-title-changed", function () { refresh(); });

        // 메뉴 바깥 클릭 · Esc 로 닫기
        document.addEventListener("click", function () { if (menuOpen) closeMenu(); });
        document.addEventListener("keydown", function (e) {
            if (e.key === "Escape" && menuOpen) closeMenu();
        });
    });
})();
