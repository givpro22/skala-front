/* ============================================================
   terminal.js — 인터랙티브 터미널 (index 전용)
   방문자가 직접 명령어를 입력해 포트폴리오를 탐색할 수 있음
   ============================================================ */

document.addEventListener("DOMContentLoaded", function () {
    var body = document.getElementById("termBody");
    var output = document.getElementById("termOutput");
    var input = document.getElementById("termInput");
    if (!body || !output || !input) return;

    var history = [];
    var hpos = -1;
    var cmdCount = 0;

    function esc(s) {
        return String(s).replace(/[&<>"]/g, function (c) {
            return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
        });
    }

    function scrollDown() { body.scrollTop = body.scrollHeight; }

    function print(html, cls) {
        var line = document.createElement("div");
        line.className = "term-out-line" + (cls ? " " + cls : "");
        line.innerHTML = html;
        output.appendChild(line);
        scrollDown();
    }

    var pages = {
        home: "index.html", index: "index.html",
        profile: "myProfile.html", about: "myProfile.html", 소개: "myProfile.html",
        class: "myClass.html", 시간표: "myClass.html", schedule: "myClass.html",
        holiday: "holiday.html", 휴일: "holiday.html",
        trip: "myTrip.html", 여행: "myTrip.html", album: "myTrip.html",
        signup: "signUp.html", 회원가입: "signUp.html"
    };

    var COMMANDS = {
        help: function () {
            print("사용 가능한 명령어:", "muted");
            var rows = [
                ["about", "자기소개 보기"],
                ["skills", "기술 스택"],
                ["projects", "대표 프로젝트"],
                ["awards", "수상 이력"],
                ["certs", "자격증 · 어학"],
                ["contact", "연락처"],
                ["ls", "페이지 목록"],
                ["goto <page>", "페이지 이동 (예: goto trip)"],
                ["theme", "다크/라이트 전환"],
                ["matrix", "매트릭스 이스터에그"],
                ["neofetch", "개발자 정보 아트"],
                ["cowsay <말>", "소가 말하게 하기"],
                ["rps <가위|바위|보>", "가위바위보 게임"],
                ["joke", "개발자 유머"],
                ["coffee", "커피 한 잔"],
                ["achievements", "업적 목록"],
                ["date", "현재 시각"],
                ["clear", "화면 지우기"]
            ];
            rows.forEach(function (r) {
                print('<span class="t-cmd">' + r[0] + '</span><span class="t-desc">' + r[1] + '</span>');
            });
        },
        about: function () {
            print("박영서 (Park Youngseo) · Full-stack Developer", "accent");
            print("서비스에 주인의식을 갖고 깊게 관여하는 것을 좋아합니다.");
            print("‘만드는 것’을 좋아해 사이드 프로젝트로 꾸준히 만들고 있습니다.");
        },
        skills: function () {
            [["JavaScript / TypeScript", 90], ["React", 88], ["Next.js", 80],
             ["Node.js (Express)", 72], ["Figma", 70]].forEach(function (s) {
                var filled = Math.round(s[1] / 10);
                var bar = "█".repeat(filled) + "░".repeat(10 - filled);
                print('<span class="t-cmd">' + s[0] + '</span><span class="t-bar">' + bar + " " + s[1] + "%</span>");
            });
        },
        projects: function () {
            print("1. 발로뛰어 — 캠퍼스 배달 서비스 (팀장/PM)", "accent");
            print('   <a href="https://github.com/wrd1stProgrammer/BalloRun-App-Service" target="_blank" rel="noopener">github ↗</a>');
            print("2. 휴쉼 — 감정 공유 커뮤니티 (FE)", "accent");
            print('   <a href="https://github.com/kakao-tech-campus-3rd-step3/Team15_FE" target="_blank" rel="noopener">github ↗</a>');
            print("3. 상공회의소 커뮤니티 (FE & BE, 1인 개발)", "accent");
            print('   <a href="https://github.com/givpro22/GJCCI-NEXT" target="_blank" rel="noopener">github ↗</a>');
            print("자세히 보려면 'goto profile'", "muted");
        },
        awards: function () {
            print("2025 SW창업경진대회 최우수상");
            print("2025 카카오테크캠퍼스 아이디어톤 우수상");
            print("2024 AI융합문제발굴 해커톤 장려상");
            print("2021 창업아이템경진대회 입선");
        },
        certs: function () {
            print("2026 빅데이터분석기사 · 토익스피킹 IH");
            print("2025 정보처리기사 · 2023 SQLD · 2021 컴활 1급");
        },
        contact: function () {
            print('email : <a href="mailto:givpro22@daum.net">givpro22@daum.net</a>');
            print('github: <a href="https://github.com/givpro22" target="_blank" rel="noopener">github.com/givpro22</a>');
        },
        ls: function () {
            print("index.html  myProfile.html  myClass.html  holiday.html", "accent");
            print("myTrip.html  signUp.html  signUpResult.html", "accent");
        },
        goto: function (arg) {
            var key = (arg || "").trim().toLowerCase();
            var target = pages[key];
            if (!target) { print("페이지를 찾을 수 없어요: " + esc(arg) + " (ls 로 목록 확인)", "err"); return; }
            print("이동 중... → " + target, "muted");
            setTimeout(function () { location.href = target; }, 400);
        },
        theme: function () { if (typeof toggleTheme === "function") toggleTheme(); if (window.unlock) window.unlock("theme"); print("테마를 전환했어요."); },
        matrix: function () { if (typeof window.runMatrix === "function") window.runMatrix(); print("실행 중... (화면 클릭 시 종료)", "muted"); },
        date: function () { print(new Date().toLocaleString("ko-KR")); },
        echo: function (arg) { print(esc(arg)); },
        whoami: function () { print("guest@skala — 방문객님 환영합니다."); },

        neofetch: function () {
            var art =
                "<span class='t-logo'>██████╗ </span>  <b>guest</b>@<b>skala-front</b>\n" +
                "<span class='t-logo'>██╔══██╗</span>  ──────────────────\n" +
                "<span class='t-logo'>██████╔╝</span>  host  : 박영서 (Park Youngseo)\n" +
                "<span class='t-logo'>██╔═══╝ </span>  role  : Full-stack Developer\n" +
                "<span class='t-logo'>██║     </span>  stack : JS/TS · React · Next.js\n" +
                "<span class='t-logo'>╚═╝     </span>  info  : proj 3 · award 4 · cert 5\n" +
                "<span class='t-logo'>        </span>  editor: VS Code · theme: dark";
            print(art, "pre");
        },
        cowsay: function (arg) {
            var msg = (arg || "").trim() || "Hello, SKALA!";
            var top = " " + "_".repeat(msg.length + 2);
            var bot = " " + "-".repeat(msg.length + 2);
            var cow =
                "        \\   ^__^\n" +
                "         \\  (oo)\\_______\n" +
                "            (__)\\       )\\/\\\n" +
                "                ||----w |\n" +
                "                ||     ||";
            print(esc(top) + "\n< " + esc(msg) + " >\n" + esc(bot) + "\n" + cow, "pre");
        },
        rps: function (arg) {
            if (window.unlock) window.unlock("gamer");
            var map = { "가위": "scissors", "바위": "rock", "보": "paper",
                        rock: "rock", paper: "paper", scissors: "scissors", r: "rock", p: "paper", s: "scissors" };
            var you = map[(arg || "").trim().toLowerCase()];
            if (!you) { print("사용법: rps 가위 | 바위 | 보  (rock | paper | scissors)", "muted"); return; }
            var opts = ["rock", "paper", "scissors"];
            var cpu = opts[Math.floor(Math.random() * 3)];
            var emo = { rock: "✊", paper: "✋", scissors: "✌️" };
            print("You: " + emo[you] + "   CPU: " + emo[cpu]);
            var res;
            if (you === cpu) res = "비겼어요!";
            else if ((you === "rock" && cpu === "scissors") ||
                     (you === "paper" && cpu === "rock") ||
                     (you === "scissors" && cpu === "paper")) res = "이겼어요! 🎉";
            else res = "졌어요... 😢";
            print(res, "accent");
        },
        joke: function () {
            var jokes = [
                "Q: 프로그래머가 어둠을 싫어하는 이유는? A: 버그(bug)가 꼬여서.",
                "0.1 + 0.2 는? → 0.30000000000000004",
                "세상엔 10종류의 사람이 있다. 이진법을 아는 사람과 모르는 사람.",
                "Q: 개발자가 자연을 싫어하는 이유? A: 버그가 너무 많아서."
            ];
            print(jokes[Math.floor(Math.random() * jokes.length)]);
        },
        coffee: function () {
            print("      ( (\n       ) )\n    ........\n    |      |]\n    \\      /\n     `----'    ☕ 커피 한 잔 하고 가세요!", "pre");
        },
        vim: function () {
            print("Vim 실행됨... 나가려면 :q (여긴 진짜 갇히는 곳은 아니니 안심하세요)", "muted");
        },
        history: function () {
            if (!history.length) { print("기록이 없어요.", "muted"); return; }
            history.forEach(function (h, i) { print("  " + (i + 1) + "  " + esc(h)); });
        },
        achievements: function () {
            if (typeof window.getAchievements !== "function") { print("업적 시스템을 불러올 수 없어요.", "err"); return; }
            var list = window.getAchievements();
            var got = list.filter(function (a) { return a.unlocked; }).length;
            print("🏆 업적 " + got + " / " + list.length + " 해금", "accent");
            list.forEach(function (a) {
                var mark = a.unlocked ? a.icon : "🔒";
                print(mark + " <span class='t-cmd'>" + esc(a.title) + "</span><span class='t-desc'>" +
                      (a.unlocked ? esc(a.desc) : "???") + "</span>", a.unlocked ? "" : "muted");
            });
        },
        sudo: function (arg) {
            if (/sandwich/i.test(arg || "")) { print("좋아요. 여기 샌드위치입니다. 🥪  (xkcd #149)", "accent"); return; }
            print("권한이 거부되었습니다. 이 포트폴리오의 주인이 아니시군요.", "err");
        },
        clear: function () { output.innerHTML = ""; }
    };

    function run(raw) {
        var cmd = (raw || "").trim();
        print('<span class="prompt">➜</span> <span class="path">~/skala-front</span> ' + esc(cmd));
        if (!cmd) return;
        history.push(cmd); hpos = history.length;
        if (window.unlock) window.unlock("rookie");
        cmdCount++;
        if (cmdCount >= 15 && window.unlock) window.unlock("master");
        var parts = cmd.split(/\s+/);
        var name = parts[0].toLowerCase();
        var arg = parts.slice(1).join(" ");
        var fn = COMMANDS[name];
        if (fn) fn(arg);
        else print("command not found: " + esc(name) + " — 'help' 를 입력해보세요", "err");
    }

    input.addEventListener("keydown", function (e) {
        if (e.key === "Enter") {
            run(input.value);
            input.value = "";
        } else if (e.key === "ArrowUp") {
            e.preventDefault();
            if (hpos > 0) { hpos--; input.value = history[hpos]; }
        } else if (e.key === "ArrowDown") {
            e.preventDefault();
            if (hpos < history.length - 1) { hpos++; input.value = history[hpos]; }
            else { hpos = history.length; input.value = ""; }
        } else if (e.key === "l" && e.ctrlKey) {
            e.preventDefault(); output.innerHTML = "";
        }
    });

    // 터미널 아무 곳이나 클릭하면 입력창 포커스
    body.addEventListener("click", function (e) {
        if (window.getSelection && String(window.getSelection())) return; // 텍스트 선택 중이면 제외
        if (e.target.tagName !== "A") input.focus();
    });

    // 첫 안내
    print("'help' 를 입력하면 사용법을 볼 수 있어요.", "muted");
});
