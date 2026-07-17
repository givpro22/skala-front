/* ============================================================
   login.js — 로그인 페이지
   · Supabase Auth 이메일/비밀번호 로그인
   · 이미 로그인 상태면 프로필 페이지로 보낸다
   ============================================================ */

document.addEventListener("DOMContentLoaded", function () {

    var form = document.getElementById("loginForm");
    var emailEl = document.getElementById("loginEmail");
    var pwEl = document.getElementById("loginPw");
    var btn = document.getElementById("loginBtn");
    var statusEl = document.getElementById("loginStatus");

    function status(text, kind) { showFormStatus(statusEl, text, kind); }

    // ---------- 비밀번호 표시/숨김 ----------
    var toggle = document.getElementById("loginPwToggle");
    if (toggle && pwEl) {
        toggle.addEventListener("click", function () {
            var showing = pwEl.type === "text";
            pwEl.type = showing ? "password" : "text";
            toggle.textContent = showing ? "👁️" : "🙈";
        });
    }

    // ---------- 이미 로그인했다면 ----------
    // 익명 세션(방명록)만 있는 방문자는 아직 로그인한 게 아니므로 폼을 보여준다.
    if (window.SkalaAuth) {
        window.SkalaAuth.getMember().then(function (res) {
            if (res.user) {
                status("이미 로그인되어 있습니다. 프로필로 이동합니다…", "ok");
                setTimeout(function () { location.href = "myProfile.html"; }, 600);
            }
        });
    }

    // ---------- 제출 ----------
    if (form) {
        form.addEventListener("submit", function (e) {
            e.preventDefault();

            var email = (emailEl && emailEl.value.trim()) || "";
            var pw = (pwEl && pwEl.value) || "";
            if (!email || !pw) {
                showToast("⚠️ 이메일과 비밀번호를 입력해 주세요.");
                return;
            }

            if (btn) { btn.disabled = true; btn.value = "로그인 중…"; }
            status("로그인 중입니다…", "");

            window.SkalaAuth.signIn(email, pw).then(function (res) {
                if (btn) { btn.disabled = false; btn.value = "로그인"; }

                if (res.error) {
                    status("❌ " + res.error, "err");
                    showToast("⚠️ " + res.error);
                    return;
                }

                status("✓ 로그인되었습니다. 이동합니다…", "ok");
                location.href = "myProfile.html";
            });
        });
    }
});
