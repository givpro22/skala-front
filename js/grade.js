/* ============================================================
   grade.js — [과제] 성적 계산기 (JavaScript 기초)
   · 과목 배열을 for 반복문으로 순회하며 점수 입력받기
   · 총점 / 평균 계산, 평균 60점 이상이면 합격
   · 입력/출력은 사이트 테마에 맞춘 모달(skPrompt/skAlert) 사용
     (모달 모듈이 없으면 기본 prompt/alert 로 대체)
   ============================================================ */

async function startGrade() {
    var TITLE = "📊 성적 계산기";
    var ask = window.skPrompt || function (m) { return Promise.resolve(window.prompt(m)); };
    var say = window.skAlert || function (m) { return Promise.resolve(window.alert(m)); };

    var subjects = ["HTML", "CSS", "JavaScript"];   // 채점할 과목 목록
    var total = 0;                                   // 총점 누적 변수
    var scores = [];                                 // 과목별 점수 저장

    // for 반복문으로 과목마다 점수를 입력받는다
    for (var i = 0; i < subjects.length; i++) {
        var input = await ask(subjects[i] + " 점수를 입력하세요. (0 ~ 100)",
                              { title: TITLE, placeholder: "0 ~ 100" });
        var score = Number(input);

        // 잘못된 입력은 0점 처리
        if (input === null || Number.isNaN(score) || score < 0 || score > 100) {
            score = 0;
        }
        scores.push(score);
        total += score;
    }

    var average = total / subjects.length;

    // 결과 문자열 구성
    var report = "===== 성적표 =====\n";
    for (var j = 0; j < subjects.length; j++) {
        report += subjects[j] + " : " + scores[j] + "점\n";
    }
    report += "------------------\n";
    report += "총점 : " + total + "점\n";
    report += "평균 : " + average.toFixed(1) + "점\n";
    report += "결과 : " + (average >= 60 ? "합격 🎉" : "불합격 😢");

    await say(report, { title: TITLE });
}
