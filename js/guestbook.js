/* ============================================================
   guestbook.js — 방명록
   · 익명 로그인(signInAnonymously) 기반 — 이메일·비밀번호 없이 닉네임만
   · 목록은 guestbook_list RPC 로 조회 (닉네임·좋아요 수·내 글 여부를 한 번에)
   · Realtime 구독으로 다른 사람 글이 즉시 반영
   · 좋아요 토글 · 내 글 삭제

   과제용 회원가입(signUp.html)과는 완전히 별개다.
   이미 그 계정으로 로그인해 있으면 그 계정으로 글이 남는다.
   ============================================================ */

(function () {
    "use strict";

    /* 이 스크립트는 <head> 에서 로드되므로 DOM 조회는 DOMContentLoaded 이후에만 한다.
       (지금 조회하면 전부 null 이라 방명록이 조용히 죽는다) */
    var listEl, formEl, nickEl, msgEl, btnEl, statusEl, countEl, charEl;

    var NICK_KEY = "skala-nick";
    var MAX = 300;
    var PAGE = 10;            // 한 번에 보여줄 글 수
    var HARD_CAP = 100;       // RPC 가 한 번에 주는 최대치와 맞춘다
    var busy = false;
    var currentNick = null;   // DB 에 저장된 닉네임 — 바뀌었을 때만 UPDATE 하려고 추적
    var loaded = PAGE;        // 지금 펼쳐 놓은 글 수 (더 보기로 늘어난다)
    var total = 0;            // 서버가 알려준 전체 글 수

    function status(text, kind) { showFormStatus(statusEl, text, kind); }

    /* 에러 문구는 auth.js 의 매퍼 한 곳에서만 만든다 (SkalaAuth.errorText) */
    function friendly(e) { return window.SkalaAuth.errorText(e); }

    /* ---------- 상대 시간 ---------- */
    function timeAgo(iso) {
        var then = new Date(iso).getTime();
        var diff = Math.floor((Date.now() - then) / 1000);
        if (diff < 60) return "방금 전";
        if (diff < 3600) return Math.floor(diff / 60) + "분 전";
        if (diff < 86400) return Math.floor(diff / 3600) + "시간 전";
        if (diff < 604800) return Math.floor(diff / 86400) + "일 전";
        var d = new Date(iso);
        return (d.getMonth() + 1) + "월 " + d.getDate() + "일";
    }

    /* ---------- 목록 그리기 ----------
       메시지·닉네임은 방문자 입력이므로 전부 textContent 로 넣는다 (HTML 주입 방지) */
    function render(rows) {
        listEl.textContent = "";

        // 전체 개수는 서버가 준 total_count 를 쓴다 (지금 보이는 수가 아니라)
        total = rows.length ? Number(rows[0].total_count) || rows.length : 0;
        if (countEl) {
            countEl.textContent = total
                ? (total > rows.length ? rows.length + " / " + total + "개의 글" : total + "개의 글")
                : "";
        }

        if (!rows.length) {
            var empty = document.createElement("p");
            empty.className = "gb-empty";
            empty.textContent = "아직 방명록이 비어 있어요. 첫 글을 남겨 보세요!";
            listEl.appendChild(empty);
            return;
        }

        rows.forEach(function (row) {
            var item = document.createElement("article");
            item.className = "gb-item" + (row.is_mine ? " mine" : "");

            var head = document.createElement("div");
            head.className = "gb-head";

            var who = document.createElement("span");
            who.className = "gb-nick";
            who.textContent = row.nickname;
            head.appendChild(who);

            // 주인 배지 — 닉네임은 누구나 같은 값을 쓸 수 있으므로(유니크 아님)
            // 진짜 주인임을 알리는 위조 불가 표시가 필요하다. is_owner 는 DB 가 지킨다.
            if (row.is_owner) {
                var owner = document.createElement("span");
                owner.className = "gb-badge owner";
                owner.textContent = "주인";
                owner.title = "이 사이트의 주인이 남긴 글입니다";
                head.appendChild(owner);
            }

            if (row.is_mine) {
                var badge = document.createElement("span");
                badge.className = "gb-badge";
                badge.textContent = "내 글";
                head.appendChild(badge);
            }

            var when = document.createElement("time");
            when.className = "gb-time";
            when.dateTime = row.created_at;
            when.textContent = timeAgo(row.created_at);
            head.appendChild(when);

            item.appendChild(head);

            // 긴 글은 좁은 패널을 다 잡아먹으므로 접어 두고, 누르면 펼친다
            var body = document.createElement("p");
            body.className = "gb-body clamp";
            body.textContent = row.message;
            item.appendChild(body);

            // 실제로 잘렸을 때만 '더 보기'를 붙인다 (레이아웃 계산 후 판단)
            requestAnimationFrame(function () {
                if (body.scrollHeight <= body.clientHeight + 1) return;
                var more = document.createElement("button");
                more.type = "button";
                more.className = "gb-more";
                more.textContent = "더 보기";
                more.addEventListener("click", function () {
                    var open = body.classList.toggle("clamp");
                    more.textContent = open ? "더 보기" : "접기";
                });
                body.insertAdjacentElement("afterend", more);
            });

            var foot = document.createElement("div");
            foot.className = "gb-foot";

            var like = document.createElement("button");
            like.type = "button";
            like.className = "gb-like" + (row.liked_by_me ? " on" : "");
            // 하트는 스프라이트의 선 아이콘 — 눌렀을 때만 CSS 로 채운다.
            // (우리가 만든 정적 마크업이므로 innerHTML 로 넣어도 안전)
            like.innerHTML = '<svg class="ico" aria-hidden="true"><use href="#i-heart"/></svg>';
            like.appendChild(document.createTextNode(String(row.like_count)));
            like.setAttribute("aria-pressed", row.liked_by_me ? "true" : "false");
            like.setAttribute("aria-label", "좋아요 " + row.like_count + "개");
            like.addEventListener("click", function () {
                toggleLike(row.id, row.liked_by_me, like);
            });
            foot.appendChild(like);

            if (row.is_mine) {
                var del = document.createElement("button");
                del.type = "button";
                del.className = "gb-del";
                del.textContent = "삭제";
                del.addEventListener("click", function () { removeEntry(row.id); });
                foot.appendChild(del);
            }

            item.appendChild(foot);
            listEl.appendChild(item);
        });

        // 아직 안 보여준 글이 남아 있으면 '더 보기'
        if (total > rows.length) {
            var loadMore = document.createElement("button");
            loadMore.type = "button";
            loadMore.className = "btn btn-ghost gb-loadmore";
            var remain = total - rows.length;
            loadMore.textContent = "이전 글 " + Math.min(remain, PAGE) + "개 더 보기";
            loadMore.addEventListener("click", function () {
                loadMore.disabled = true;
                loadMore.textContent = "불러오는 중…";
                loaded = Math.min(loaded + PAGE, HARD_CAP);
                refresh();
            });
            listEl.appendChild(loadMore);
        } else if (rows.length >= HARD_CAP && total > HARD_CAP) {
            // 한 번에 받을 수 있는 상한에 걸린 경우 — 조용히 감추지 않고 알린다
            var note = document.createElement("p");
            note.className = "gb-empty";
            note.textContent = "최근 " + HARD_CAP + "개만 표시합니다.";
            listEl.appendChild(note);
        }
    }

    /* ---------- 목록 조회 ---------- */
    function refresh() {
        return window.supabaseReady.then(function (sb) {
            // 지금 펼쳐 놓은 만큼 다시 받는다 → 실시간 갱신 후에도 화면이 유지된다
            return sb.rpc("guestbook_list", { page_limit: loaded });
        }).then(function (res) {
            if (res.error) throw res.error;
            render(res.data || []);
        }).catch(function (e) {
            // 방문자에게 DB 내부 메시지를 보여주지 않는다 — 자세한 원인은 콘솔로
            console.error("[guestbook] 목록 조회 실패:", e);
            listEl.textContent = "";
            var p = document.createElement("p");
            p.className = "gb-empty";
            p.textContent = "방명록을 잠시 불러올 수 없어요. 새로고침해 주세요.";
            listEl.appendChild(p);
        });
    }

    /* ---------- 좋아요 토글 ---------- */
    function toggleLike(entryId, liked, btn) {
        btn.disabled = true;
        window.supabaseReady.then(function (sb) {
            return sb.auth.getSession().then(function (s) {
                var session = s.data && s.data.session;
                if (!session) {
                    // 좋아요도 신원이 필요하다 — 닉네임 없이 조용히 익명 계정을 만든다
                    return window.SkalaAuth.signInAnonymously(
                        (localStorage.getItem(NICK_KEY) || "익명")
                    ).then(function (r) {
                        if (r.error) throw window.SkalaAuth.friendlyError(r.error);
                        return sb.auth.getSession();
                    }).then(function (s2) { return s2.data.session; });
                }
                return session;
            }).then(function (session) {
                var uid = session.user.id;
                if (liked) {
                    return sb.from("guestbook_likes").delete()
                        .eq("entry_id", entryId).eq("user_id", uid);
                }
                return sb.from("guestbook_likes")
                    .insert({ entry_id: entryId, user_id: uid });
            });
        }).then(function (res) {
            if (res && res.error) throw res.error;
            // 취소가 아니라 '누른' 경우에만 업적
            if (!liked && window.unlock) window.unlock("liker");
            return refresh();
        }).catch(function (e) {
            console.error("[guestbook] 좋아요 실패:", e);
            showToast("⚠️ " + friendly(e));
        }).then(function () {
            btn.disabled = false;
        });
    }

    /* ---------- 내 글 삭제 ---------- */
    function removeEntry(entryId) {
        skConfirm("이 방명록 글을 삭제할까요?").then(function (ok) {
            if (!ok) return;
            window.supabaseReady.then(function (sb) {
                return sb.from("guestbook").delete().eq("id", entryId);
            }).then(function (res) {
                if (res.error) throw res.error;
                showToast("🗑️ 삭제했습니다.");
                return refresh();
            }).catch(function (e) {
                console.error("[guestbook] 삭제 실패:", e);
                showToast("⚠️ " + friendly(e));
            });
        });
    }

    /* ---------- 글 남기기 ---------- */
    function submit(e) {
        e.preventDefault();
        if (busy) return;

        var nick = (nickEl.value || "").trim();
        var msg = (msgEl.value || "").trim();

        if (!nick) { showToast("⚠️ 닉네임을 입력해 주세요."); nickEl.focus(); return; }
        if (nick.length > 20) { showToast("⚠️ 닉네임은 20자 이하로 해주세요."); nickEl.focus(); return; }
        if (!msg) { showToast("⚠️ 남길 말을 입력해 주세요."); msgEl.focus(); return; }
        if (msg.length > MAX) { showToast("⚠️ " + MAX + "자 이하로 입력해 주세요."); return; }

        busy = true;
        btnEl.disabled = true;
        status("남기는 중…", "");

        localStorage.setItem(NICK_KEY, nick);

        window.supabaseReady.then(function (sb) {
            return sb.auth.getSession().then(function (s) {
                var session = s.data && s.data.session;

                // 세션이 없으면 닉네임과 함께 익명 계정을 만든다 (트리거가 프로필 생성)
                if (!session) {
                    return window.SkalaAuth.signInAnonymously(nick).then(function (r) {
                        if (r.error) throw window.SkalaAuth.friendlyError(r.error);
                        currentNick = nick;   // 트리거가 이 닉네임으로 프로필을 만든다
                        return sb.auth.getSession().then(function (s2) { return s2.data.session; });
                    });
                }

                // 이미 로그인 상태 — 닉네임이 실제로 바뀐 경우에만 반영한다.
                // (매번 부르면 글 하나마다 불필요한 조회+UPDATE 가 붙는다)
                if (nick === currentNick) return session;
                return window.SkalaAuth.setNickname(nick).then(function (r) {
                    // 조용히 넘어가면 예전 닉네임으로 글이 올라간다 → 반드시 실패를 알린다
                    if (r.error) throw window.SkalaAuth.friendlyError(r.error);
                    currentNick = nick;
                    return session;
                });
            }).then(function (session) {
                return sb.from("guestbook").insert({
                    user_id: session.user.id,
                    message: msg
                });
            });
        }).then(function (res) {
            if (res && res.error) throw res.error;
            msgEl.value = "";
            if (charEl) charEl.textContent = "0 / " + MAX + "자";
            status("✓ 남겼습니다. 고마워요!", "ok");
            if (window.unlock) window.unlock("guest");
            return refresh();
        }).catch(function (e) {
            console.error("[guestbook] 작성 실패:", e);
            var m = friendly(e);
            status("❌ " + m, "err");
            showToast("⚠️ " + m);
        }).then(function () {
            busy = false;
            btnEl.disabled = false;
        });
    }

    /* ---------- Realtime ---------- */
    function subscribe(sb) {
        sb.channel("guestbook-live")
            .on("postgres_changes",
                { event: "*", schema: "public", table: "guestbook" }, refresh)
            .on("postgres_changes",
                { event: "*", schema: "public", table: "guestbook_likes" }, refresh)
            .subscribe();
    }

    /* ---------- 초기화 ---------- */
    /* 패널 내용은 여기서 그린다 (뼈대는 dock.js 가 만든다) */
    var VIEW_HTML =
        '<p class="dock-sub">닉네임만 있으면 바로 남길 수 있어요. 회원가입은 필요 없습니다.' +
            '<span class="gb-count" id="gbCount"></span></p>' +
        '<form id="gbForm" class="gb-form">' +
            '<div class="gb-fields">' +
                '<input type="text" id="gbNick" maxlength="20" required placeholder="닉네임"' +
                    ' aria-label="닉네임" autocomplete="nickname">' +
                '<textarea id="gbMsg" rows="3" required aria-label="방명록 메시지"' +
                    ' placeholder="남기고 싶은 말을 적어주세요 (최대 300자)"></textarea>' +
            '</div>' +
            '<div class="gb-actions">' +
                '<span class="char-count" id="gbChars">0 / 300자</span>' +
                '<button type="submit" class="btn btn-primary" id="gbSubmit">남기기</button>' +
            '</div>' +
            '<p class="form-status" id="gbStatus" role="status" aria-live="polite"></p>' +
        '</form>' +
        '<div id="gbList" class="gb-list"><p class="gb-empty">방명록을 불러오는 중…</p></div>';

    // dock.js 가 뼈대를 주입한 뒤에 실행된다 (스크립트 순서에 의존하지 않음)
    window.addEventListener("skala-dock-ready", function () {
        var view = document.getElementById("guestbook");
        if (!view) return;
        view.innerHTML = VIEW_HTML;

        listEl = document.getElementById("gbList");
        formEl = document.getElementById("gbForm");
        nickEl = document.getElementById("gbNick");
        msgEl = document.getElementById("gbMsg");
        btnEl = document.getElementById("gbSubmit");
        statusEl = document.getElementById("gbStatus");
        countEl = document.getElementById("gbCount");
        charEl = document.getElementById("gbChars");

        // 저장된 닉네임 복원
        var saved = localStorage.getItem(NICK_KEY);
        if (saved && nickEl) nickEl.value = saved;

        if (msgEl && charEl) {
            msgEl.addEventListener("input", function () {
                if (msgEl.value.length > MAX) msgEl.value = msgEl.value.slice(0, MAX);
                charEl.textContent = msgEl.value.length + " / " + MAX + "자";
            });
        }

        if (formEl) formEl.addEventListener("submit", submit);

        // 방명록 패널이 처음 열릴 때만 목록을 받고 Realtime 을 연결한다.
        // (패널을 안 여는 방문자에게까지 웹소켓을 열 이유가 없다)
        var started = false;
        window.addEventListener("skala-dock-open", function (e) {
            if (e.detail.view !== "gb" || started) return;
            started = true;

            window.supabaseReady.then(function (sb) {
                refresh();
                subscribe(sb);
                // 로그인 상태면 프로필의 닉네임을 우선 사용
                return window.SkalaAuth.getProfile().then(function (r) {
                    if (r.profile && r.profile.nickname) {
                        currentNick = r.profile.nickname;
                        if (nickEl) nickEl.value = currentNick;
                    }
                });
            }).catch(function () {
                status("Supabase 설정이 필요합니다 — 방명록을 사용할 수 없습니다.", "err");
            });
        });
    });
})();
