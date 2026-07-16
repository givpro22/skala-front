/* ============================================================
   signup.js — 회원가입 폼 실시간 인터랙션
   · 아이디/비밀번호/이메일 실시간 유효성 검사
   · 비밀번호 강도 미터
   · 비밀번호 표시/숨김 토글
   · 이메일 도메인 자동 완성 (select → input)
   · 자기소개 글자 수 카운터
   · 제출 전 최종 검증
   ============================================================ */

document.addEventListener("DOMContentLoaded", function () {

    // ---------- 유틸: 메시지 표시 ----------
    function setMsg(input, msgEl, ok, text) {
        msgEl.textContent = text;
        msgEl.className = "field-msg " + (ok ? "ok" : "err");
        input.classList.toggle("valid", ok);
        input.classList.toggle("invalid", !ok);
    }

    // ---------- 아이디 ----------
    var userId = document.getElementById("userId");
    var idMsg = document.getElementById("idMsg");
    if (userId && idMsg) {
        userId.addEventListener("input", function () {
            var v = userId.value.trim();
            if (v.length === 0) {
                setMsg(userId, idMsg, false, "");
                userId.classList.remove("valid", "invalid");
            } else if (!/^[A-Za-z0-9]{4,15}$/.test(v)) {
                setMsg(userId, idMsg, false, "4~15자의 영문/숫자만 사용할 수 있어요.");
            } else {
                setMsg(userId, idMsg, true, "✓ 사용 가능한 형식입니다.");
            }
        });
    }

    // ---------- 비밀번호 + 강도 ----------
    var userPw = document.getElementById("userPw");
    var pwMsg = document.getElementById("pwMsg");
    var strengthBar = document.getElementById("strengthBar");

    function scorePw(v) {
        var score = 0;
        if (v.length >= 8) score++;
        if (/[A-Z]/.test(v)) score++;
        if (/[a-z]/.test(v)) score++;
        if (/[0-9]/.test(v)) score++;
        if (/[^A-Za-z0-9]/.test(v)) score++;
        return score;
    }

    if (userPw && pwMsg) {
        userPw.addEventListener("input", function () {
            var v = userPw.value;
            var s = scorePw(v);

            if (strengthBar) {
                var pct = [0, 20, 40, 60, 80, 100][s];
                var colors = ["#e74c3c", "#e74c3c", "#f39c12", "#f1c40f", "#2ecc71", "#27ae60"];
                strengthBar.style.width = pct + "%";
                strengthBar.style.background = colors[s];
            }

            if (v.length === 0) {
                pwMsg.textContent = "";
                userPw.classList.remove("valid", "invalid");
            } else if (v.length < 8) {
                setMsg(userPw, pwMsg, false, "8자 이상 입력해 주세요.");
            } else {
                var label = s <= 2 ? "약함" : s === 3 ? "보통" : s === 4 ? "강함" : "매우 강함";
                setMsg(userPw, pwMsg, true, "✓ 비밀번호 강도: " + label);
            }
        });
    }

    // ---------- 비밀번호 표시/숨김 ----------
    var pwToggle = document.getElementById("pwToggle");
    if (pwToggle && userPw) {
        pwToggle.addEventListener("click", function () {
            var showing = userPw.type === "text";
            userPw.type = showing ? "password" : "text";
            pwToggle.textContent = showing ? "👁️" : "🙈";
        });
    }

    // ---------- 이메일 도메인 자동 완성 ----------
    var emailDomain = document.getElementById("emailDomain");
    var emailDomainInput = document.getElementById("emailDomainInput");
    if (emailDomain && emailDomainInput) {
        emailDomain.addEventListener("change", function () {
            if (emailDomain.value === "direct") {
                emailDomainInput.value = "";
                emailDomainInput.readOnly = false;
                emailDomainInput.focus();
            } else {
                emailDomainInput.value = emailDomain.value;
                emailDomainInput.readOnly = true;
            }
        });
    }

    // ---------- 자기소개 글자 수 ----------
    var intro = document.getElementById("intro");
    var charCount = document.getElementById("charCount");
    if (intro && charCount) {
        var max = 200;
        intro.addEventListener("input", function () {
            var len = intro.value.length;
            if (len > max) {
                intro.value = intro.value.slice(0, max);
                len = max;
            }
            charCount.textContent = len + " / " + max + "자";
            charCount.style.color = len >= max ? "#e74c3c" : "";
        });
    }

    // ---------- 제출 전 최종 검증 ----------
    var form = document.getElementById("signupForm");
    if (form) {
        form.addEventListener("submit", function (e) {
            var okId = /^[A-Za-z0-9]{4,15}$/.test((userId && userId.value.trim()) || "");
            var okPw = userPw && userPw.value.length >= 8;
            if (!okId || !okPw) {
                e.preventDefault();
                showToast("⚠️ 아이디와 비밀번호 형식을 다시 확인해 주세요.");
                if (!okId && userId) userId.focus();
                else if (!okPw && userPw) userPw.focus();
            }
        });
    }
});
