/* ============================================================
   profile.js — myProfile.html 의 "내 계정" 섹션
   · 로그인한 사용자의 profiles 행을 읽어 폼을 채우고, 수정을 저장한다
   · 비로그인 상태면 섹션을 감추고 로그인 안내만 보여준다
   ============================================================ */

document.addEventListener("DOMContentLoaded", function () {

    var card = document.getElementById("accountCard");
    var guest = document.getElementById("accountGuest");
    if (!card || !guest) return;   // 이 섹션이 없는 페이지면 아무것도 안 함

    var metaEl = document.getElementById("accountMeta");
    var form = document.getElementById("profileForm");
    var nameEl = document.getElementById("pfName");
    var birthEl = document.getElementById("pfBirth");
    var introEl = document.getElementById("pfIntro");
    var countEl = document.getElementById("pfCharCount");
    var saveBtn = document.getElementById("pfSaveBtn");
    var statusEl = document.getElementById("pfStatus");

    function status(text, kind) { showFormStatus(statusEl, text, kind); }

    function showGuest() {
        card.hidden = true;
        guest.hidden = false;
    }

    // ---------- 자기소개 글자 수 ----------
    if (introEl && countEl) {
        var updateCount = function () {
            countEl.textContent = introEl.value.length + " / 200자";
        };
        introEl.addEventListener("input", updateCount);
        updateCount();
    }

    // ---------- 폼 채우기 ----------
    function fill(profile, email) {
        if (metaEl) {
            metaEl.textContent = "@" + profile.handle + " · " + email;
        }
        if (nameEl) nameEl.value = profile.name || "";
        if (birthEl) birthEl.value = profile.birth || "";
        if (introEl) {
            introEl.value = profile.intro || "";
            introEl.dispatchEvent(new Event("input"));
        }

        var g = form.querySelector('input[name="pfGender"][value="' + (profile.gender || "none") + '"]');
        if (g) g.checked = true;

        var picked = profile.interests || [];
        form.querySelectorAll('input[name="pfInterest"]').forEach(function (box) {
            box.checked = picked.indexOf(box.value) >= 0;
        });
    }

    // ---------- 초기 로드 ----------
    if (!window.SkalaAuth) { showGuest(); return; }

    // getMember 는 익명 세션(방명록으로 생긴 신원)을 제외한다.
    // 방명록만 남긴 방문자에게 회원 계정 편집기를 보여주면 안 된다.
    window.SkalaAuth.getMember().then(function (u) {
        if (!u.user) { showGuest(); return; }

        return window.SkalaAuth.getProfile().then(function (res) {
            if (res.error || !res.profile) {
                // 로그인은 했지만 프로필 행이 없는 경우 (트리거 실패 등)
                showGuest();
                status("프로필을 불러오지 못했습니다.", "err");
                return;
            }
            card.hidden = false;
            guest.hidden = true;
            fill(res.profile, u.user.email);
        });
    }).catch(function () {
        showGuest();
    });

    // ---------- 저장 ----------
    if (form) {
        form.addEventListener("submit", function (e) {
            e.preventDefault();

            var name = (nameEl && nameEl.value.trim()) || "";
            if (!name) {
                showToast("⚠️ 이름을 입력해 주세요.");
                return;
            }

            var interests = Array.prototype.map.call(
                form.querySelectorAll('input[name="pfInterest"]:checked'),
                function (b) { return b.value; }
            );

            var patch = {
                name: name,
                birth: (birthEl && birthEl.value) || null,
                gender: (form.querySelector('input[name="pfGender"]:checked') || {}).value || null,
                interests: interests,
                intro: (introEl && introEl.value.trim()) || null
            };

            if (saveBtn) { saveBtn.disabled = true; saveBtn.value = "저장 중…"; }
            status("저장 중입니다…", "");

            window.SkalaAuth.updateProfile(patch).then(function (res) {
                if (saveBtn) { saveBtn.disabled = false; saveBtn.value = "저장"; }
                if (res.error) {
                    status("❌ " + res.error, "err");
                    showToast("⚠️ " + res.error);
                    return;
                }
                status("✓ 저장되었습니다.", "ok");
                showToast("✅ 프로필이 저장되었습니다.");
            });
        });
    }

});
