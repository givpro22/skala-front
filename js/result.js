/* ============================================================
   result.js — 회원가입 결과 페이지
   · 가입 직후 signup.js 가 sessionStorage 에 남긴 요약을 표시한다.
     (이메일 인증이 켜져 있으면 아직 세션이 없어 DB 조회가 불가하므로)
   · 로그인 상태로 이 페이지에 오면 Supabase profiles 에서 최신 값을 읽는다.
   · 축하 컨페티 애니메이션
   ============================================================ */

document.addEventListener("DOMContentLoaded", function () {

    var interestLabels = {
        frontend: "웹 프론트엔드",
        uiux: "UI/UX 디자인",
        backend: "백엔드 & DB",
        devops: "클라우드 & 인프라"
    };
    var genderLabels = { male: "남성", female: "여성", none: "선택안함" };
    var routeLabels = { search: "검색", friend: "지인 추천", sns: "SNS" };

    var tbody = document.getElementById("summaryBody");
    var summaryWrap = document.getElementById("summaryWrap");

    /* 가입 직후 남긴 요약 */
    function readStashed() {
        try {
            var raw = sessionStorage.getItem("skala-signup-summary");
            return raw ? JSON.parse(raw) : null;
        } catch (e) { return null; }
    }

    /* 로그인 상태면 DB 의 프로필을 요약 형태로 */
    function readFromDb() {
        if (!window.SkalaAuth) return Promise.resolve(null);
        // 익명 세션(방명록)은 가입 결과와 무관하다 → 회원만 조회
        return window.SkalaAuth.getMember().then(function (u) {
            if (!u.user) return null;
            return window.SkalaAuth.getProfile().then(function (res) {
                if (res.error || !res.profile) return null;
                var p = res.profile;
                return {
                    handle: p.handle,
                    email: u.user.email,
                    name: p.name,
                    birth: p.birth || "",
                    gender: p.gender || "",
                    interests: p.interests || [],
                    route: p.route || "",
                    intro: p.intro || "",
                    needsEmailConfirm: false
                };
            });
        }).catch(function () { return null; });
    }

    function render(data) {
        if (!tbody) return;

        if (!data) {
            if (summaryWrap) {
                summaryWrap.innerHTML =
                    '<p>회원가입 폼에서 제출하면 이곳에 입력하신 정보가 요약되어 표시됩니다.</p>';
            }
            return;
        }

        var rows = [
            ["👤 아이디", data.handle],
            ["📧 이메일", data.email],
            ["🏷️ 이름", data.name],
            ["🎂 생년월일", data.birth],
            ["⚧ 성별", genderLabels[data.gender] || data.gender],
            ["🔗 가입 경로", routeLabels[data.route] || data.route],
            ["✍️ 자기소개", data.intro]
        ];

        rows.forEach(function (row) {
            var value = row[1];
            if (value === null || value === undefined || value === "") return;
            var tr = document.createElement("tr");
            var th = document.createElement("th");
            th.textContent = row[0];
            var td = document.createElement("td");
            // 사용자 입력이므로 textContent 로 넣는다 (HTML 주입 방지)
            td.textContent = value;
            tr.appendChild(th);
            tr.appendChild(td);
            tbody.appendChild(tr);
        });

        // 관심 분야는 배지로 — 라벨은 우리가 정한 값만 쓰므로 요소로 만들어 붙인다
        if (data.interests && data.interests.length) {
            var tr2 = document.createElement("tr");
            var th2 = document.createElement("th");
            th2.textContent = "💡 관심 분야";
            var td2 = document.createElement("td");
            data.interests.forEach(function (v) {
                var span = document.createElement("span");
                span.className = "badge";
                span.textContent = interestLabels[v] || v;
                td2.appendChild(span);
                td2.appendChild(document.createTextNode(" "));
            });
            tr2.appendChild(th2);
            tr2.appendChild(td2);
            tbody.appendChild(tr2);
        }

        // 인사말 개인화
        var greetName = document.getElementById("greetName");
        if (greetName && data.name) {
            greetName.textContent = data.name + "님, ";
        }

        // 이메일 인증이 필요한 경우 안내
        if (data.needsEmailConfirm && summaryWrap) {
            var notice = document.createElement("p");
            notice.className = "form-status";
            notice.textContent =
                "📧 " + data.email + " 으로 인증 메일을 보냈습니다. " +
                "메일의 링크를 눌러야 로그인할 수 있습니다.";
            summaryWrap.insertBefore(notice, summaryWrap.firstChild);
        }
    }

    // 가입 직후 요약이 있으면 그것을 먼저 쓰고, 없으면 DB 를 조회한다.
    var stashed = readStashed();
    if (stashed) {
        render(stashed);
        // 새로고침 시 계속 남지 않도록 소비 후 제거
        try { sessionStorage.removeItem("skala-signup-summary"); } catch (e) { /* noop */ }
    } else {
        readFromDb().then(render);
    }

    // ---------- 컨페티 ----------
    launchConfetti();
});

function launchConfetti() {
    var colors = ["#2980b9", "#2ecc71", "#f1c40f", "#e74c3c", "#9b59b6", "#1abc9c"];
    var count = 90;
    for (var i = 0; i < count; i++) {
        var piece = document.createElement("div");
        piece.className = "confetti";
        // Math.random 대신 결정적 분포 사용 (index 기반)
        var leftPct = (i * 37) % 100;
        var delay = (i % 12) * 0.15;
        var duration = 2.4 + (i % 7) * 0.35;
        piece.style.left = leftPct + "%";
        piece.style.background = colors[i % colors.length];
        piece.style.animationDelay = delay + "s";
        piece.style.animationDuration = duration + "s";
        if (i % 2 === 0) piece.style.borderRadius = "50%";
        document.body.appendChild(piece);
        (function (node, total) {
            setTimeout(function () { node.remove(); }, total * 1000 + 500);
        })(piece, duration + delay);
    }
}
