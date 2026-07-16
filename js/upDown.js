/* ============================================================
   upDown.js — [과제] Up-Down 숫자 맞추기 게임 (JavaScript 기초)
   · Math.random 으로 1~50 비밀 숫자 생성
   · while 반복문으로 정답을 맞출 때까지 계속 입력받음
   · 큰 값 → "Down!", 작은 값 → "Up!", 정답 → 시도 횟수 안내
   · 입력/출력은 사이트 테마에 맞춘 모달(skPrompt/skAlert) 사용
     (모달 모듈이 없으면 기본 prompt/alert 로 대체)
   ============================================================ */

async function startUpDown() {
    var TITLE = "🎯 Up-Down 게임";
    // 테마 모달이 있으면 사용하고, 없으면 브라우저 기본 창으로 대체
    var ask = window.skPrompt || function (m) { return Promise.resolve(window.prompt(m)); };
    var say = window.skAlert || function (m) { return Promise.resolve(window.alert(m)); };

    // 컴퓨터가 1부터 50 사이의 무작위 숫자 하나를 생성
    var computerNum = Math.floor(Math.random() * 50) + 1;
    var tries = 0;

    // 사용자가 맞출 때까지 반복해서 기회를 준다 (while 반복문)
    while (true) {
        var input = await ask("1부터 50 사이의 숫자 중 컴퓨터가 생각한 숫자는 무엇일까요?",
                              { title: TITLE, placeholder: "1 ~ 50" });

        // 취소 시 게임 종료
        if (input === null) {
            await say("게임을 종료합니다. 정답은 " + computerNum + " 였어요!", { title: TITLE });
            return;
        }

        var guess = Number(input);
        if (!Number.isInteger(guess) || guess < 1 || guess > 50) {
            await say("1부터 50 사이의 정수를 입력해 주세요!", { title: TITLE });
            continue;
        }

        tries++;

        if (guess > computerNum) {
            await say("Down! ⬇️  더 작은 숫자예요.", { title: TITLE });
        } else if (guess < computerNum) {
            await say("Up! ⬆️  더 큰 숫자예요.", { title: TITLE });
        } else {
            await say("🎉 축하합니다!\n" + tries + "번 만에 정답 " + computerNum + " 을(를) 맞추셨습니다.",
                      { title: TITLE });
            break;
        }
    }
}
