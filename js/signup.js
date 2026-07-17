/* ============================================================
   signup.js — 회원가입 폼 실시간 인터랙션 + Supabase 가입 처리
   · 아이디/비밀번호/이메일 실시간 유효성 검사
   · 아이디 중복 확인 (Supabase RPC, 입력 멈춘 뒤 조회)
   · 비밀번호 강도 미터
   · 비밀번호 표시/숨김 토글
   · 이메일 도메인 자동 완성 (select → input)
   · 자기소개 글자 수 카운터
   · 제출 시 Supabase Auth 로 계정 생성 (프로필은 DB 트리거가 생성)
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
    var idCheckTimer = null;
    var idAvailable = false;   // 중복 확인을 통과한 아이디인지

    if (userId && idMsg) {
        userId.addEventListener("input", function () {
            var v = userId.value.trim();
            idAvailable = false;
            if (idCheckTimer) clearTimeout(idCheckTimer);

            if (v.length === 0) {
                setMsg(userId, idMsg, false, "");
                userId.classList.remove("valid", "invalid");
                return;
            }
            if (!/^[A-Za-z0-9]{4,15}$/.test(v)) {
                setMsg(userId, idMsg, false, "4~15자의 영문/숫자만 사용할 수 있어요.");
                return;
            }

            // 형식은 통과 — 입력이 멈추면 서버에 중복 확인
            setMsg(userId, idMsg, true, "확인 중…");
            idCheckTimer = setTimeout(function () {
                var asked = v;
                window.SkalaAuth.isHandleAvailable(v).then(function (res) {
                    // 확인하는 사이 사용자가 다른 값을 입력했으면 결과 무시
                    if (userId.value.trim() !== asked) return;
                    if (res.error) {
                        setMsg(userId, idMsg, false, "중복 확인 실패: " + res.error);
                    } else if (res.available) {
                        idAvailable = true;
                        setMsg(userId, idMsg, true, "✓ 사용 가능한 아이디입니다.");
                    } else {
                        setMsg(userId, idMsg, false, "이미 사용 중인 아이디입니다.");
                    }
                });
            }, 400);
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

    // ---------- 제출: Supabase Auth 로 가입 ----------
    var form = document.getElementById("signupForm");
    var submitBtn = document.getElementById("submitBtn");
    var formStatus = document.getElementById("formStatus");

    function status(text, kind) { showFormStatus(formStatus, text, kind); }

    /* 엘리먼트가 없어도 안전하게 값을 읽는다 */
    function val(id) {
        var el = document.getElementById(id);
        return el ? el.value.trim() : "";
    }

    /* 폼에서 이메일 주소를 조립한다. */
    function readEmail() {
        var local = val("userEmail");
        var domain = val("emailDomainInput");
        if (!local || !domain) return "";
        return local + "@" + domain;
    }

    /* 체크된 관심 분야를 배열로 */
    function readInterests() {
        var boxes = form.querySelectorAll('input[name="interest"]:checked');
        return Array.prototype.map.call(boxes, function (b) { return b.value; });
    }

    if (form) {
        form.addEventListener("submit", function (e) {
            e.preventDefault();   // 항상 우리가 처리한다 (GET 제출 금지 — 비밀번호 노출)

            var handle = (userId && userId.value.trim()) || "";
            var password = (userPw && userPw.value) || "";
            var email = readEmail();
            var name = val("userName");

            // --- 클라이언트 검증 (DB 제약이 최종 방어선) ---
            if (!/^[A-Za-z0-9]{4,15}$/.test(handle)) {
                showToast("⚠️ 아이디는 4~15자의 영문/숫자여야 합니다.");
                if (userId) userId.focus();
                return;
            }
            if (password.length < 8) {
                showToast("⚠️ 비밀번호는 8자 이상이어야 합니다.");
                if (userPw) userPw.focus();
                return;
            }
            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
                showToast("⚠️ 이메일 주소를 정확히 입력해 주세요.");
                var em = document.getElementById("userEmail");
                if (em) em.focus();
                return;
            }
            if (!name) {
                showToast("⚠️ 이름을 입력해 주세요.");
                return;
            }
            if (!idAvailable) {
                showToast("⚠️ 아이디 중복 확인이 끝나지 않았거나 사용할 수 없는 아이디입니다.");
                if (userId) userId.focus();
                return;
            }

            // --- 전송 ---
            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.value = "가입 처리 중…";
            }
            status("Supabase 에 계정을 만드는 중입니다…", "");

            var profile = {
                handle: handle,
                name: name,
                birth: val("userBirth"),
                gender: (form.querySelector('input[name="gender"]:checked') || {}).value || "",
                interests: readInterests(),
                route: val("route"),
                intro: val("intro")
            };

            window.SkalaAuth.signUp(email, password, profile).then(function (res) {
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.value = "동의하고 회원가입";
                }

                if (res.error) {
                    status("❌ " + res.error, "err");
                    showToast("⚠️ " + res.error);
                    return;
                }

                // 결과 페이지에서 보여줄 요약 (비밀번호는 절대 담지 않는다).
                // 이메일 인증 대기 중이면 세션이 없어 DB 조회가 안 되므로 이 값을 쓴다.
                try {
                    sessionStorage.setItem("skala-signup-summary", JSON.stringify({
                        handle: profile.handle,
                        email: email,
                        name: profile.name,
                        birth: profile.birth,
                        gender: profile.gender,
                        interests: profile.interests,
                        route: profile.route,
                        intro: profile.intro,
                        needsEmailConfirm: res.needsEmailConfirm
                    }));
                } catch (err) { /* 시크릿 모드 등 — 요약이 없어도 진행 */ }

                if (window.unlock) window.unlock("member");   // 정식 회원 업적
                location.href = "signUpResult.html";
            });
        });
    }
});
