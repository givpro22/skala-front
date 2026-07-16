/* ============================================================
   result.js — 회원가입 결과 페이지
   · GET 방식으로 전송된 URL 쿼리 파라미터를 읽어
     사용자가 실제 입력한 값을 요약 테이블로 표시
   · 축하 컨페티 애니메이션
   ============================================================ */

document.addEventListener("DOMContentLoaded", function () {

    var params = new URLSearchParams(location.search);

    // ---------- 입력값 요약 ----------
    var tbody = document.getElementById("summaryBody");
    if (tbody) {
        var interestLabels = {
            frontend: "웹 프론트엔드",
            uiux: "UI/UX 디자인",
            backend: "백엔드 & DB",
            devops: "클라우드 & 인프라"
        };
        var genderLabels = { male: "남성", female: "여성", none: "선택안함" };
        var routeLabels = { search: "검색", friend: "지인 추천", sns: "SNS" };

        var email = params.get("userEmail");
        var domain = params.get("emailDomainInput") || params.get("emailDomain");
        var fullEmail = email ? (email + (domain ? "@" + domain : "")) : "";

        var interests = params.getAll("interest").map(function (v) {
            return '<span class="badge">' + (interestLabels[v] || v) + "</span>";
        }).join(" ");

        var rows = [
            ["👤 아이디", params.get("userId")],
            ["📧 이메일", fullEmail],
            ["🏷️ 이름", params.get("userName")],
            ["🎂 생년월일", params.get("userBirth")],
            ["⚧ 성별", genderLabels[params.get("gender")] || params.get("gender")],
            ["💡 관심 분야", interests],
            ["🔗 가입 경로", routeLabels[params.get("route")] || params.get("route")],
            ["✍️ 자기소개", params.get("intro")]
        ];

        var hasData = false;
        rows.forEach(function (row) {
            var value = row[1];
            if (value === null || value === undefined || value === "") return;
            hasData = true;
            var tr = document.createElement("tr");
            var th = document.createElement("th");
            th.textContent = row[0];
            var td = document.createElement("td");
            td.innerHTML = value;
            tr.appendChild(th);
            tr.appendChild(td);
            tbody.appendChild(tr);
        });

        // 이름이 있으면 인사말 개인화
        var name = params.get("userName");
        var greetName = document.getElementById("greetName");
        if (greetName && name) {
            greetName.textContent = name + "님, ";
        }

        // 직접 접근(데이터 없음) 시 안내
        var summaryWrap = document.getElementById("summaryWrap");
        if (!hasData && summaryWrap) {
            summaryWrap.innerHTML =
                '<p>회원가입 폼에서 제출하면 이곳에 입력하신 정보가 요약되어 표시됩니다.</p>';
        }
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
