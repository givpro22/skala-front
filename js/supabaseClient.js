/* ============================================================
   supabaseClient.js — Supabase 클라이언트 생성 (ESM 모듈)
   · esm.sh CDN 에서 supabase-js v2 를 직접 import (빌드 단계 없음)
   · 생성된 클라이언트를 window.sb 로 노출하고,
     supabaseConfig.js 가 만들어 둔 window.supabaseReady 를 resolve 한다.
   · 다른 클래식 스크립트는 window.supabaseReady 를 await 해서 쓰면 된다.

   반드시 supabaseConfig.js 다음에 <script type="module"> 로 로드할 것.
   ============================================================ */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.58.0";

var cfg = window.SUPABASE_CONFIG;

if (!window.SUPABASE_CONFIGURED) {
    var msg =
        "[supabase] publishableKey 가 설정되지 않았습니다. " +
        "js/supabaseConfig.js 에 Supabase 대시보드의 publishable 키를 넣어 주세요.";
    console.error(msg);
    if (window.__supabaseReject) window.__supabaseReject(new Error(msg));
} else {
    // createClient 가 예상 밖으로 던지더라도 supabaseReady 는 반드시 settle 시킨다.
    // (settle 되지 않으면 이 프라미스를 await 하는 모든 화면이 영원히 멈춘다)
    try {
        const sb = createClient(cfg.url, cfg.publishableKey, {
            auth: {
                // 새로고침·페이지 이동 후에도 로그인 유지 (localStorage 세션)
                persistSession: true,
                autoRefreshToken: true,
                // 이 사이트는 여러 .html 페이지를 오가는 MPA 라 URL 세션 감지가 필요
                detectSessionInUrl: true,
                storageKey: "skala-auth"
            }
        });

        window.sb = sb;
        window.__supabaseResolve(sb);
    } catch (e) {
        console.error("[supabase] 클라이언트 생성 실패:", e);
        window.__supabaseReject(e);
    }
}
