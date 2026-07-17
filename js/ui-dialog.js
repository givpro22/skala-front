/* ============================================================
   ui-dialog.js — 사이트 테마에 맞춘 커스텀 입력/알림 모달
   · 브라우저 기본 prompt()/alert() 은 스타일을 입힐 수 없어(초록 버튼 등)
     IDE 다크 테마에 맞춘 커스텀 다이얼로그로 대체
   · window.skPrompt(msg, opts)  → Promise<string|null>  (취소 시 null, prompt 와 동일)
   · window.skAlert(msg, opts)   → Promise<void>
   · window.skConfirm(msg, opts) → Promise<boolean>      (confirm 과 동일)
   · Enter = 확인, Esc = 취소, 오버레이 클릭 = 취소
   ============================================================ */

(function () {
    "use strict";

    function esc(s) {
        return String(s).replace(/[&<>"]/g, function (c) {
            return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
        });
    }

    // 공통 모달 생성기 (type: "prompt" | "alert" | "confirm")
    function open(type, message, opts) {
        opts = opts || {};
        return new Promise(function (resolve) {
            var titles = { prompt: "입력", confirm: "확인", alert: "알림" };
            var title = opts.title || titles[type];
            var confirmText = opts.confirmText || "확인";
            // 되돌릴 수 있어야 하는 유형에만 취소 버튼을 붙인다
            var hasCancel = (type === "prompt" || type === "confirm");

            var ov = document.createElement("div");
            ov.className = "sk-dialog-ov";
            ov.innerHTML =
                '<div class="sk-dialog" role="dialog" aria-modal="true" aria-label="' + esc(title) + '">' +
                    '<div class="sk-dialog-bar">' +
                        '<span class="sk-dot r"></span><span class="sk-dot y"></span><span class="sk-dot g"></span>' +
                        '<span class="sk-dialog-title">' + esc(title) + '</span>' +
                    '</div>' +
                    '<div class="sk-dialog-body">' +
                        '<p class="sk-dialog-msg">' + esc(message) + '</p>' +
                        (type === "prompt"
                            ? '<input class="sk-dialog-input" type="text" autocomplete="off" spellcheck="false" ' +
                              'placeholder="' + esc(opts.placeholder || "여기에 입력...") + '">'
                            : '') +
                    '</div>' +
                    '<div class="sk-dialog-foot">' +
                        (hasCancel ? '<button class="btn btn-ghost sk-cancel">취소</button>' : '') +
                        '<button class="btn btn-primary sk-ok">' + esc(confirmText) + '</button>' +
                    '</div>' +
                '</div>';
            document.body.appendChild(ov);

            var input = ov.querySelector(".sk-dialog-input");
            var okBtn = ov.querySelector(".sk-ok");
            var cancelBtn = ov.querySelector(".sk-cancel");

            function cleanup() {
                document.removeEventListener("keydown", onKey);
                ov.classList.remove("show");
                setTimeout(function () { if (ov.parentNode) ov.remove(); }, 200);
            }
            // 각 유형의 반환 계약: prompt → 입력값/null, confirm → true/false, alert → undefined
            function confirm() {
                var val = input ? input.value : null;
                cleanup();
                if (type === "prompt") resolve(val);
                else if (type === "confirm") resolve(true);
                else resolve(undefined);
            }
            function cancel() {
                cleanup();
                if (type === "prompt") resolve(null);
                else if (type === "confirm") resolve(false);
                else resolve(undefined);
            }
            function onKey(e) {
                if (e.key === "Enter") { e.preventDefault(); confirm(); }
                else if (e.key === "Escape") { e.preventDefault(); cancel(); }
            }

            okBtn.addEventListener("click", confirm);
            if (cancelBtn) cancelBtn.addEventListener("click", cancel);
            ov.addEventListener("mousedown", function (e) { if (e.target === ov) cancel(); });
            document.addEventListener("keydown", onKey);

            requestAnimationFrame(function () {
                ov.classList.add("show");
                if (input) input.focus(); else okBtn.focus();
            });
        });
    }

    window.skPrompt = function (message, opts) { return open("prompt", message, opts); };
    window.skAlert = function (message, opts) { return open("alert", message, opts); };
    window.skConfirm = function (message, opts) { return open("confirm", message, opts); };
})();
