/* ============================================================
   bag.js — [과제] 내 가방 보기 (JavaScript 기초)
   · 배열 안에 물건 정보를 객체({ name, count })로 저장
   · for 반복문으로 순회하며 목록 문자열을 만들어 출력
   · 출력은 사이트 테마에 맞춘 모달(skAlert) 사용
     (모달 모듈이 없으면 기본 alert 로 대체)
   ============================================================ */

async function showMyBag() {
    var TITLE = "🎒 내 가방";
    var say = window.skAlert || function (m) { return Promise.resolve(window.alert(m)); };

    // 가방 속 물건들 (객체 배열)
    var myBag = [
        { name: "노트북", count: 1 },
        { name: "충전기", count: 1 },
        { name: "이어폰", count: 1 },
        { name: "볼펜", count: 3 },
        { name: "노트", count: 2 }
    ];

    var totalCount = 0;
    var result = "🎒 내 가방 속 물건\n==================\n";

    // for 반복문으로 각 물건의 이름과 개수를 출력
    for (var i = 0; i < myBag.length; i++) {
        result += (i + 1) + ". " + myBag[i].name + " — " + myBag[i].count + "개\n";
        totalCount += myBag[i].count;
    }

    result += "==================\n";
    result += "물건 종류: " + myBag.length + "가지 / 총 " + totalCount + "개";

    await say(result, { title: TITLE });
}
