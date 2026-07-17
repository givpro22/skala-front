/* ============================================================
   stats.js — 사이트 현황 위젯
   · 오늘 방문자 수 / 누적 방문자 수 (record_visit RPC)
   · 업적 랭킹 TOP 10 + 내 순위 (achievement_leaderboard RPC)

   두 RPC 모두 security definer 로 집계값만 돌려준다.
   개별 방문 기록이나 남의 실명은 클라이언트로 나오지 않는다.
   ============================================================ */

(function () {
    "use strict";

    var VISIT_KEY = "skala-visitor-key";

    /* ---------- 방문자 식별 키 ----------
       로그인과 무관한 브라우저 단위 임의 UUID. 개인정보가 아니다. */
    function visitorKey() {
        var k = localStorage.getItem(VISIT_KEY);
        if (!k) {
            k = (window.crypto && window.crypto.randomUUID)
                ? window.crypto.randomUUID()
                : "v" + Date.now().toString(36) + Math.random().toString(36).slice(2, 10);
            localStorage.setItem(VISIT_KEY, k);
        }
        return k;
    }

    /* ---------- 오늘 방문자 ---------- */
    function loadVisits() {
        var todayEl = document.getElementById("visitToday");
        var totalEl = document.getElementById("visitTotal");
        if (!todayEl && !totalEl) return;

        window.supabaseReady.then(function (sb) {
            return sb.rpc("record_visit", { key: visitorKey() });
        }).then(function (res) {
            if (res.error) throw res.error;
            var row = (res.data && res.data[0]) || {};
            if (todayEl) countTo(todayEl, Number(row.today_count) || 0);
            if (totalEl) totalEl.textContent = (Number(row.total_count) || 0).toLocaleString("ko-KR");
        }).catch(function () {
            if (todayEl) todayEl.textContent = "–";
            if (totalEl) totalEl.textContent = "–";
        });
    }

    /* 숫자가 올라가는 연출 (사이트의 count-up 통계와 톤을 맞춘다) */
    function countTo(el, target) {
        var start = null, dur = 700;
        function frame(ts) {
            if (!start) start = ts;
            var p = Math.min((ts - start) / dur, 1);
            el.textContent = Math.round(target * p).toLocaleString("ko-KR");
            if (p < 1) requestAnimationFrame(frame);
        }
        requestAnimationFrame(frame);
    }

    /* ---------- 인기 명령어 ----------
       방문자들이 터미널에 많이 친 명령어. 눌러서 바로 실행할 수 있게 해
       "이런 명령어가 있었네" 를 발견하게 만든다. */
    function loadCommands() {
        var listEl = document.getElementById("cmdList");
        if (!listEl) return;

        window.supabaseReady.then(function (sb) {
            return sb.rpc("popular_commands", { top_n: 5 });
        }).then(function (res) {
            if (res.error) throw res.error;
            renderCommands(listEl, res.data || []);
        }).catch(function () {
            listEl.textContent = "";
            var li = document.createElement("li");
            li.className = "lb-empty";
            li.textContent = "아직 집계된 명령어가 없어요.";
            listEl.appendChild(li);
        });
    }

    function renderCommands(listEl, rows) {
        listEl.textContent = "";
        if (!rows.length) {
            var li0 = document.createElement("li");
            li0.className = "lb-empty";
            li0.textContent = "아직 아무도 명령어를 쓰지 않았어요. 첫 번째가 되어 보세요!";
            listEl.appendChild(li0);
            return;
        }

        var max = Math.max.apply(null, rows.map(function (r) { return Number(r.count) || 0; })) || 1;

        rows.forEach(function (row, i) {
            var li = document.createElement("li");
            li.className = "cmd-row";

            var rank = document.createElement("span");
            rank.className = "cmd-rank";
            rank.textContent = (i + 1);
            li.appendChild(rank);

            // 명령어 이름은 DB 화이트리스트를 통과한 값이지만 textContent 로 넣는다
            var name = document.createElement("button");
            name.type = "button";
            name.className = "cmd-name";
            name.textContent = row.command;
            name.title = "터미널에서 " + row.command + " 실행";
            name.addEventListener("click", function () { runCommand(row.command); });
            li.appendChild(name);

            var bar = document.createElement("span");
            bar.className = "cmd-bar";
            var fill = document.createElement("span");
            fill.className = "cmd-fill";
            fill.style.width = Math.round((Number(row.count) / max) * 100) + "%";
            bar.appendChild(fill);
            li.appendChild(bar);

            var cnt = document.createElement("span");
            cnt.className = "cmd-count";
            cnt.textContent = row.count;
            li.appendChild(cnt);

            listEl.appendChild(li);
        });
    }

    /* 터미널은 홈에만 있다 → 다른 페이지면 홈으로 보내면서 실행할 명령을 남긴다 */
    function runCommand(cmd) {
        if (typeof window.runTerminal === "function") {
            window.runTerminal(cmd);
            if (window.closeDock) window.closeDock();
            return;
        }
        try { sessionStorage.setItem("skala-run-cmd", cmd); } catch (e) { /* noop */ }
        location.href = "index.html";
    }

    /* ---------- 업적 랭킹 ---------- */
    function loadLeaderboard() {
        var listEl = document.getElementById("lbList");
        var meEl = document.getElementById("lbMe");
        if (!listEl) return;

        window.supabaseReady.then(function (sb) {
            return Promise.all([
                sb.rpc("achievement_leaderboard", { top_n: 10 }),
                sb.rpc("my_achievement_rank")
            ]);
        }).then(function (results) {
            var board = results[0], mine = results[1];
            if (board.error) throw board.error;

            renderBoard(listEl, board.data || []);

            if (meEl) {
                var row = (!mine.error && mine.data && mine.data[0]) || null;
                if (row) {
                    meEl.textContent = "내 순위: " + row.rank + "위 (" +
                        row.achievement_count + "개 해금)";
                } else {
                    meEl.textContent = "아직 순위가 없어요 — 업적을 해금하면 랭킹에 등장합니다.";
                }
            }
        }).catch(function () {
            // lbList 는 <ol> 이므로 자식은 <li> 여야 한다
            listEl.textContent = "";
            var li = document.createElement("li");
            li.className = "lb-empty";
            li.textContent = "랭킹을 불러오지 못했습니다.";
            listEl.appendChild(li);
        });
    }

    function renderBoard(listEl, rows) {
        listEl.textContent = "";

        if (!rows.length) {
            var li = document.createElement("li");
            li.className = "lb-empty";
            li.textContent = "아직 랭킹이 비어 있어요. 업적을 해금한 첫 사람이 되어 보세요!";
            listEl.appendChild(li);
            return;
        }

        rows.forEach(function (row) {
            var li = document.createElement("li");
            li.className = "lb-row" + (row.is_me ? " me" : "");

            // 메달 이모지 대신 모노스페이스 순위 — 상위 3명만 색으로 구분한다
            var rank = document.createElement("span");
            rank.className = "lb-rank" + (row.rank <= 3 ? " top" : "");
            rank.textContent = row.rank + "위";
            li.appendChild(rank);

            // 닉네임은 사용자 입력 — textContent 로 넣는다
            var nick = document.createElement("span");
            nick.className = "lb-nick";
            nick.textContent = row.nickname;
            li.appendChild(nick);

            // 주인 배지 (닉네임 사칭과 구분하는 위조 불가 표시)
            if (row.is_owner) {
                var own = document.createElement("span");
                own.className = "lb-tag owner";
                own.textContent = "주인";
                own.title = "이 사이트의 주인";
                li.appendChild(own);
            }

            if (row.is_me) {
                var tag = document.createElement("span");
                tag.className = "lb-tag";
                tag.textContent = "나";
                li.appendChild(tag);
            }

            var cnt = document.createElement("span");
            cnt.className = "lb-count";
            cnt.innerHTML = '<svg class="ico" aria-hidden="true"><use href="#i-trophy"/></svg>';
            cnt.appendChild(document.createTextNode(String(row.achievement_count)));
            li.appendChild(cnt);

            listEl.appendChild(li);
        });
    }

    var boardLoaded = false;

    /* 패널 내용 (뼈대는 dock.js 가 만든다) */
    var STAT_HTML =
        '<div class="visit-widget">' +
            '<div class="visit-box"><span class="visit-num" id="visitToday">–</span>' +
                '<span class="visit-label">오늘 방문자</span></div>' +
            '<div class="visit-box"><span class="visit-num small" id="visitTotal">–</span>' +
                '<span class="visit-label">누적 방문자</span></div>' +
        '</div>' +
        '<p class="dock-sub">같은 브라우저로 하루에 여러 번 와도 1명으로 셉니다.</p>' +
        '<h3 class="dock-h3">인기 명령어 TOP 5</h3>' +
        '<p class="dock-sub">방문자들이 터미널에 많이 입력한 명령어예요. 눌러서 실행해보세요.</p>' +
        '<ol class="cmd-list" id="cmdList"><li class="lb-empty">불러오는 중…</li></ol>';

    var RANK_HTML =
        '<p class="dock-sub">업적을 많이 해금한 순서입니다. 공개되는 건 닉네임과 개수뿐이에요.</p>' +
        '<ol class="lb-list" id="lbList"><li class="lb-empty">랭킹을 불러오는 중…</li></ol>' +
        '<p class="lb-me" id="lbMe"></p>' +
        '<button type="button" class="btn btn-ghost lb-refresh" id="lbRefresh">↻ 새로고침</button>';

    window.addEventListener("skala-dock-ready", function () {
        var statView = document.querySelector('[data-view="stat"]');
        var rankView = document.querySelector('[data-view="rank"]');
        if (statView) statView.innerHTML = STAT_HTML;
        if (rankView) rankView.innerHTML = RANK_HTML;

        // 방문 기록은 패널을 열든 말든 남겨야 하므로 즉시 실행한다.
        loadVisits();

        // 현황 탭을 열 때 인기 명령어를 받는다 (매번 새로 — 계속 바뀌는 값이라)
        window.addEventListener("skala-dock-open", function (e) {
            if (e.detail.view === "stat") loadCommands();
        });

        // 랭킹은 패널을 처음 열 때만 조회한다 (안 여는 방문자에게 요청을 낭비하지 않는다)
        window.addEventListener("skala-dock-open", function (e) {
            if (e.detail.view !== "rank") return;
            if (window.unlock) window.unlock("ranker");
            if (boardLoaded) return;
            boardLoaded = true;
            loadLeaderboard();
        });

        var refreshBtn = document.getElementById("lbRefresh");
        if (refreshBtn) refreshBtn.addEventListener("click", loadLeaderboard);
    });

    // 업적을 새로 해금하면 랭킹이 바뀐다 — 단, 이미 본 적 있을 때만 다시 받는다
    window.addEventListener("skala-achievement-unlocked", function () {
        if (boardLoaded) loadLeaderboard();
    });
})();
