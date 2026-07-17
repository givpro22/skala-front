/* ============================================================
   auth.js — Supabase 인증 · 프로필 헬퍼
   · window.SkalaAuth 로 노출 (클래식 스크립트에서 바로 사용)
   · 모든 함수는 프라미스를 돌려주며, 실패 시 { error } 형태로 반환한다
     (throw 하지 않으므로 호출부에서 if (res.error) 로 처리)

   사용 전제: supabaseConfig.js → supabaseClient.js 순으로 로드되어 있을 것.
   ============================================================ */

(function () {
    "use strict";

    /* Supabase 클라이언트를 얻는다. 설정이 없으면 명확한 에러로 실패. */
    function client() {
        return window.supabaseReady;
    }

    /* Supabase·Postgres 가 돌려주는 에러를 사용자용 한국어로 바꾼다.
       인증/프로필/방명록의 모든 에러가 여기 한 곳을 거친다 —
       화면에는 이 결과만 내보내고, 원문은 호출부가 콘솔에 남긴다. */
    function toKorean(error) {
        // 이미 이 매퍼를 거친 에러가 다시 들어오면 그대로 돌려준다.
        // (메시지에 한글이 있는지로 판단하면 안 된다 — 사용자 입력이 섞인
        //  Postgres 에러도 한글을 포함할 수 있고, 그건 노출하면 안 되는 원문이다)
        if (error && error.isFriendly) return error.message;

        var m = (error && error.message) || "";
        if (/already registered|already been registered/i.test(m)) {
            return "이미 가입된 이메일입니다. 로그인해 주세요.";
        }
        if (/Invalid login credentials/i.test(m)) {
            return "이메일 또는 비밀번호가 올바르지 않습니다.";
        }
        if (/Email not confirmed/i.test(m)) {
            return "이메일 인증이 완료되지 않았습니다. 받은 편지함을 확인해 주세요.";
        }
        if (/Password should be at least/i.test(m)) {
            return "비밀번호는 8자 이상이어야 합니다.";
        }
        if (/profiles_handle_key|profiles_handle_lower_key|duplicate key/i.test(m)) {
            return "이미 사용 중인 아이디입니다.";
        }
        // 프로필 생성 트리거가 실패하면 GoTrue 는 원인을 감춘 이 문구만 돌려준다.
        // 실제로는 아이디 중복(동시 가입 경합)이 대부분이다.
        if (/Database error saving new user/i.test(m)) {
            return "가입 처리에 실패했습니다. 아이디가 방금 다른 분에게 선점되었을 수 있으니 다른 아이디로 시도해 주세요.";
        }
        // 이메일 인증이 켜져 있으면 가입마다 메일을 보내는데,
        // Supabase 기본 SMTP 는 시간당 한도가 매우 낮다(무료 플랜 2건).
        // 원인이 '요청 과다'가 아니라 '메일 발송 한도'라 따로 안내한다.
        if (/email rate limit/i.test(m)) {
            return "이메일 발송 한도에 걸렸습니다. Supabase 대시보드에서 이메일 인증(Confirm email)을 끄면 메일 없이 바로 가입됩니다.";
        }
        if (/rate limit|too many/i.test(m)) {
            return "요청이 너무 잦습니다. 잠시 후 다시 시도해 주세요.";
        }
        if (/[Aa]nonymous sign-ins are disabled|anonymous_provider_disabled/i.test(m)) {
            return "익명 로그인이 꺼져 있습니다. Supabase 대시보드 → Authentication → Sign In / Providers 에서 Anonymous sign-ins 를 켜 주세요.";
        }
        if (/Failed to fetch|NetworkError/i.test(m)) {
            return "네트워크 연결을 확인해 주세요.";
        }

        /* --- 방명록 --- */
        if (/guestbook_rate_limit/i.test(m)) {
            return "조금 전에 남기셨어요. 30초 후에 다시 시도해 주세요.";
        }
        if (/guestbook_message_len/i.test(m)) {
            return "메시지는 1~300자로 입력해 주세요.";
        }
        if (/profiles_nickname_format/i.test(m)) {
            return "닉네임은 1~20자로 입력해 주세요.";
        }
        if (/nickname_reserved/i.test(m)) {
            return "그 닉네임은 사이트 주인만 쓸 수 있어요. 다른 닉네임을 골라 주세요.";
        }
        if (/handle_immutable|is_owner_immutable/i.test(m)) {
            return "변경할 수 없는 항목입니다.";
        }
        if (/row-level security|permission denied|JWT/i.test(m)) {
            return "권한이 없어요. 새로고침 후 다시 시도해 주세요.";
        }
        if (/Could not find the function|schema cache|relation .* does not exist/i.test(m)) {
            return "서버 준비가 아직 안 됐어요. (DB 스키마 미적용)";
        }

        // 원문(제약 이름·스키마 경로 등)을 화면에 그대로 노출하지 않는다.
        // 다만 원인을 잃으면 디버깅이 불가능하므로 콘솔에는 남긴다.
        if (m) console.warn("[auth] 매핑되지 않은 오류:", m, error);
        return "요청을 처리하지 못했어요. 잠시 후 다시 시도해 주세요.";
    }

    /* ---------- 아이디 중복 확인 ----------
       로그인 전에도 쓸 수 있도록 RPC(handle_available)를 사용한다. */
    function isHandleAvailable(handle) {
        return client().then(function (sb) {
            return sb.rpc("handle_available", { check_handle: handle });
        }).then(function (res) {
            if (res.error) return { error: toKorean(res.error) };
            return { available: res.data === true };
        }).catch(function (e) {
            return { error: toKorean(e) };
        });
    }

    /* ---------- 회원가입 ----------
       profile 의 각 필드는 user_metadata 로 넘어가고,
       DB 트리거(handle_new_user)가 이를 읽어 profiles 행을 만든다. */
    function signUp(email, password, profile) {
        return client().then(function (sb) {
            return sb.auth.signUp({
                email: email,
                password: password,
                options: {
                    data: {
                        handle: profile.handle,
                        name: profile.name,
                        birth: profile.birth || "",
                        gender: profile.gender || "",
                        interests: profile.interests || [],
                        route: profile.route || "",
                        intro: profile.intro || ""
                    },
                    emailRedirectTo: new URL("./signUpResult.html", location.href).href
                }
            });
        }).then(function (res) {
            if (res.error) return { error: toKorean(res.error) };
            return {
                user: res.data.user,
                // 이메일 인증이 켜져 있으면 session 이 null 이다 → 안내 문구가 달라진다
                needsEmailConfirm: !res.data.session
            };
        }).catch(function (e) {
            return { error: toKorean(e) };
        });
    }

    /* ---------- 로그인 ---------- */
    function signIn(email, password) {
        return client().then(function (sb) {
            return sb.auth.signInWithPassword({ email: email, password: password });
        }).then(function (res) {
            if (res.error) return { error: toKorean(res.error) };
            return { user: res.data.user, session: res.data.session };
        }).catch(function (e) {
            return { error: toKorean(e) };
        });
    }

    /* ---------- 익명 로그인 (방명록용) ----------
       이메일·비밀번호 없이 auth.uid() 를 발급받는다.
       닉네임은 user_metadata 로 넘겨 DB 트리거가 프로필에 심는다. */
    function signInAnonymously(nickname) {
        return client().then(function (sb) {
            return sb.auth.signInAnonymously({
                options: { data: { nickname: nickname } }
            });
        }).then(function (res) {
            if (res.error) return { error: toKorean(res.error) };
            return { user: res.data.user };
        }).catch(function (e) {
            return { error: toKorean(e) };
        });
    }

    /* ---------- 세션 (네트워크 왕복 없음) ---------- */
    function getSession() {
        return client().then(function (sb) {
            return sb.auth.getSession();
        }).then(function (res) {
            return { session: (res.data && res.data.session) || null };
        }).catch(function () {
            return { session: null };
        });
    }

    /* ---------- 공개 표시용 닉네임 변경 ---------- */
    function setNickname(nickname) {
        return updateProfile({ nickname: nickname });
    }

    /* ---------- 칭호 변경 (achievement id, 없으면 null) ----------
       가짜 칭호는 공개 표시 RPC 가 걸러내므로 여기선 그냥 저장만 한다. */
    function setTitle(id) {
        return updateProfile({ title: id || null });
    }

    /* ---------- 로그아웃 ---------- */
    function signOut() {
        return client().then(function (sb) {
            return sb.auth.signOut();
        }).then(function (res) {
            if (res && res.error) return { error: toKorean(res.error) };
            return {};
        }).catch(function (e) {
            return { error: toKorean(e) };
        });
    }

    /* ---------- 현재 세션 / 사용자 ----------
       방명록이 발급하는 익명 세션도 엄연한 user 다. 그래서 "로그인했는가" 를
       user 존재 여부로 판단하면 방명록만 남긴 방문자까지 회원으로 취급된다.
       회원 전용 화면은 반드시 isMember 로 판단할 것. */
    function getUser() {
        return client().then(function (sb) {
            return sb.auth.getUser();
        }).then(function (res) {
            if (res.error) return { user: null };
            return { user: res.data.user };
        }).catch(function () {
            return { user: null };
        });
    }

    /* 익명 세션 여부 (방명록으로 생긴 임시 신원인지) */
    function isAnonymous(user) {
        return !!(user && user.is_anonymous);
    }

    /* 과제 회원가입으로 만들어진 '진짜' 계정으로 로그인했는지 */
    function getMember() {
        return getUser().then(function (res) {
            if (!res.user || isAnonymous(res.user)) return { user: null };
            return { user: res.user };
        });
    }

    /* ---------- 내 프로필 조회 ---------- */
    function getProfile() {
        return client().then(function (sb) {
            return sb.from("profiles").select("*").maybeSingle();
        }).then(function (res) {
            if (res.error) return { error: toKorean(res.error) };
            return { profile: res.data };
        }).catch(function (e) {
            return { error: toKorean(e) };
        });
    }

    /* ---------- 내 프로필 수정 ----------
       RLS 가 본인 행만 허용하므로 별도 id 조건 없이 update 해도 안전하다. */
    function updateProfile(patch) {
        return client().then(function (sb) {
            return sb.auth.getUser().then(function (u) {
                if (!u.data || !u.data.user) {
                    return { error: { message: "로그인이 필요합니다." } };
                }
                return sb.from("profiles")
                    .update(patch)
                    .eq("id", u.data.user.id)
                    .select()
                    .maybeSingle();
            });
        }).then(function (res) {
            if (res.error) return { error: toKorean(res.error) };
            return { profile: res.data };
        }).catch(function (e) {
            return { error: toKorean(e) };
        });
    }

    /* ---------- 로그인 상태 변화 구독 ----------
       cb(user) — 로그아웃 시 null */
    function onAuthChange(cb) {
        client().then(function (sb) {
            sb.auth.onAuthStateChange(function (_event, session) {
                cb(session ? session.user : null);
            });
        }).catch(function () { /* 설정 전이면 무시 */ });
    }

    /* 이미 한국어로 만든 문구를 Error 로 감쌀 때 쓴다.
       이 표시가 있으면 toKorean 이 다시 변환하지 않는다. */
    function friendlyError(text) {
        var e = new Error(text);
        e.isFriendly = true;
        return e;
    }

    window.SkalaAuth = {
        errorText: toKorean,   // 에러 → 한국어 문구 (방명록 등 다른 모듈도 이걸 쓴다)
        friendlyError: friendlyError,
        isHandleAvailable: isHandleAvailable,
        signUp: signUp,
        signIn: signIn,
        signInAnonymously: signInAnonymously,
        signOut: signOut,
        getUser: getUser,
        getMember: getMember,
        isAnonymous: isAnonymous,
        getSession: getSession,
        getProfile: getProfile,
        updateProfile: updateProfile,
        setNickname: setNickname,
        setTitle: setTitle,
        onAuthChange: onAuthChange
    };
})();
