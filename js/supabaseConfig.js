/* ============================================================
   supabaseConfig.js — Supabase 접속 설정
   · 클래식 스크립트로 가장 먼저 로드되어 window.SUPABASE_CONFIG 를 정의한다.
   · supabaseClient.js(모듈)가 늦게 실행되므로, 클래식 스크립트들이
     기다릴 수 있도록 window.supabaseReady 프라미스를 여기서 미리 만든다.

   ⚠️ 여기에는 publishable(anon) 키만 넣는다.
      이 키는 브라우저에 공개되는 것이 정상이며, 실제 접근 제어는
      DB 테이블의 RLS 정책이 담당한다 (docs/supabase-schema.sql 참고).
      secret key 는 절대 이 파일에 넣지 말 것 — RLS 를 전부 우회한다.
   ============================================================ */

window.SUPABASE_CONFIG = {
    url: "https://bmrwuvjujlufwnowammk.supabase.co",
    // Supabase 대시보드 → Project Settings → API Keys → publishable key
    publishableKey: "sb_publishable_VAUOdEAkte4Dda9TdBwK3g_vZmvDxV1"
};

/* supabaseClient.js 가 클라이언트를 만들면 resolve 된다.
   사용법:  window.supabaseReady.then(function (sb) { ... }); */
window.supabaseReady = new Promise(function (resolve, reject) {
    window.__supabaseResolve = resolve;
    window.__supabaseReject = reject;
});

/* 키를 아직 안 넣었으면 조용히 죽지 않고 명확히 알려준다.
   빈 문자열·공백도 반드시 걸러야 한다 — 그대로 createClient 에 넘기면
   "supabaseKey is required" 로 모듈이 죽고 supabaseReady 가 영원히 안 끝난다. */
(function () {
    var cfg = window.SUPABASE_CONFIG;
    var key = (cfg && typeof cfg.publishableKey === "string")
        ? cfg.publishableKey.trim() : "";
    var url = (cfg && typeof cfg.url === "string") ? cfg.url.trim() : "";

    window.SUPABASE_CONFIGURED =
        /^https:\/\/.+\.supabase\.co$/.test(url) &&
        key.length > 0 &&
        key.indexOf("PASTE_") !== 0;
})();
