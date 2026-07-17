-- ============================================================
-- SKALA-FRONT · Supabase 스키마
-- 실행: Supabase 대시보드 → SQL Editor → 붙여넣고 Run
--
-- 이 사이트는 정적 프론트엔드에서 publishable(anon) 키로 직접 접속한다.
-- 즉 브라우저는 신뢰할 수 없고, 접근 제어는 전적으로 아래 RLS 정책이 담당한다.
-- 정책을 지우거나 비활성화하면 데이터가 전부 공개된다.
-- ============================================================

-- ---------- 1. profiles ----------
-- auth.users 와 1:1. id 가 곧 로그인한 사용자의 uid.
create table if not exists public.profiles (
    id          uuid        primary key references auth.users (id) on delete cascade,
    handle      text        not null,                 -- 회원가입 폼의 '아이디' (4~15자 영문/숫자)
    name        text        not null,                 -- 실명 — 공개 화면에 절대 노출하지 않는다
    nickname    text,                                 -- 공개 표시용 (방명록·랭킹). 실명 대신 이것만 노출
    birth       date,
    gender      text        check (gender in ('male', 'female', 'none')),
    interests   text[]      not null default '{}',    -- frontend / uiux / backend / devops
    route       text,                                 -- 가입 경로
    intro       text        check (char_length(intro) <= 200),
    created_at  timestamptz not null default now(),
    updated_at  timestamptz not null default now()
);

-- 폼의 아이디 규칙(4~15자 영문/숫자)을 DB 에서도 강제한다.
-- 프론트 검증은 우회 가능하므로 여기가 진짜 방어선.
alter table public.profiles
    drop constraint if exists profiles_handle_format;
alter table public.profiles
    add constraint profiles_handle_format check (handle ~ '^[A-Za-z0-9]{4,15}$');

-- 아이디는 대소문자를 구분하지 않는다.
-- handle_available() 이 lower() 로 비교하므로 유니크 인덱스도 lower() 여야
-- "alice" 가 있는데 "Alice" 가 새 계정으로 들어가는 불일치가 생기지 않는다.
create unique index if not exists profiles_handle_lower_key
    on public.profiles (lower(handle));

-- 이미 만들어진 DB 에도 nickname 이 생기도록 (재실행 안전)
alter table public.profiles add column if not exists nickname text;

-- 사이트 주인 표시. 방명록·랭킹에 '주인' 배지로 나간다.
-- 닉네임은 아무나 같은 값을 쓸 수 있으므로(유니크가 아님) 사칭을 완전히 막을 수는 없다.
-- 대신 '진짜 주인'에게만 위조 불가능한 표시를 붙여 구분한다.
-- 이 값은 아래 트리거가 지켜서 사용자가 스스로 켤 수 없다 → SQL Editor 에서만 설정.
alter table public.profiles add column if not exists is_owner boolean not null default false;

alter table public.profiles
    drop constraint if exists profiles_nickname_format;
alter table public.profiles
    add constraint profiles_nickname_format
    check (nickname is null or char_length(trim(nickname)) between 1 and 20);

alter table public.profiles enable row level security;

-- 본인 행만 조회/수정 가능.
drop policy if exists "profiles: 본인 조회" on public.profiles;
create policy "profiles: 본인 조회"
    on public.profiles for select
    using (auth.uid() = id);

drop policy if exists "profiles: 본인 수정" on public.profiles;
create policy "profiles: 본인 수정"
    on public.profiles for update
    using (auth.uid() = id)
    with check (auth.uid() = id);

-- INSERT 정책은 일부러 만들지 않는다.
-- 프로필 행은 아래 트리거(security definer)가 회원가입 시 자동으로 만든다.
-- 이렇게 하면 이메일 인증 대기 중(세션 없음)에도 프로필이 정상 생성된다.


-- ---------- 2. achievements ----------
-- 해금한 업적만 행으로 저장한다 (없으면 미해금).
create table if not exists public.achievements (
    user_id        uuid        not null references auth.users (id) on delete cascade,
    achievement_id text        not null,
    unlocked_at    timestamptz not null default now(),
    primary key (user_id, achievement_id)
);

-- 업적 id 는 js/achievements.js 의 LIST 와 1:1 로 맞춘다.
-- RLS 는 "본인 user_id 인가" 만 보고 id 값은 검사하지 않는다. 이 제약이 없으면
-- (특히 익명 로그인이 켜진 뒤로는) 아무 문자열이나 잔뜩 넣어 랭킹을 조작할 수 있다.
-- → 업적을 추가하면 이 목록도 함께 고쳐야 한다.
alter table public.achievements
    drop constraint if exists achievements_id_valid;
alter table public.achievements
    add constraint achievements_id_valid check (achievement_id in (
        'explorer', 'rookie', 'master', 'matrix', 'konami', 'palette',
        'theme', 'gamer', 'helper', 'ambient', 'weather', 'player', 'guest',
        'liker', 'ranker', 'vlog', 'dj', 'gallery', 'nightowl', 'comeback', 'painter'
    ));

alter table public.achievements enable row level security;

drop policy if exists "achievements: 본인 조회" on public.achievements;
create policy "achievements: 본인 조회"
    on public.achievements for select
    using (auth.uid() = user_id);

drop policy if exists "achievements: 본인 해금" on public.achievements;
create policy "achievements: 본인 해금"
    on public.achievements for insert
    with check (auth.uid() = user_id);

-- 업적은 해금 후 취소할 수 없다 → update/delete 정책 없음.


-- ---------- 2-1. 주인만 쓸 수 있는 닉네임 ----------
-- 닉네임은 유니크가 아니다(방명록에 인사 남기려는 사람이 "이미 쓰는 닉네임"으로
-- 막히면 안 되므로). 대신 주인을 사칭하는 이름만 막는다.
-- 공백·점·밑줄·하이픈을 지우고 비교해 "박 영 서" 같은 우회를 걸러낸다.
create or replace function public.nickname_reserved(nick text)
returns boolean
language sql
immutable
as $$
    select lower(regexp_replace(coalesce(nick, ''), '[\s._-]', '', 'g')) in (
        '박영서', 'parkyoungseo', 'youngseo',
        'admin', 'administrator', '관리자', '운영자', '주인', 'owner'
    );
$$;


-- ---------- 3. 회원가입 시 프로필 자동 생성 ----------
-- signUp() 에 넘긴 options.data 가 raw_user_meta_data 로 들어온다.
--
-- handle 이 없는 경로로도 계정이 만들어질 수 있다 (대시보드에서 Add user,
-- 나중에 붙일 OAuth/매직링크 등). 그때 NOT NULL 로 터지면 트리거가 롤백되어
-- 계정 생성 자체가 실패하므로, uid 기반 임시 아이디를 만들어 준다.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
    meta_handle   text := nullif(trim(new.raw_user_meta_data ->> 'handle'), '');
    meta_nickname text := nullif(trim(new.raw_user_meta_data ->> 'nickname'), '');
begin
    -- 형식(4~15자 영문/숫자)에 안 맞거나 비어 있으면 uid 로 대체 아이디 생성
    if meta_handle is null or meta_handle !~ '^[A-Za-z0-9]{4,15}$' then
        meta_handle := 'u' || substr(replace(new.id::text, '-', ''), 1, 14);
    end if;

    -- 닉네임은 공개 표시용. 없으면 아이디를 쓴다 (실명은 절대 기본값으로 쓰지 않는다).
    -- 주인 사칭 이름으로 가입하려 하면 '막지 않고' 아이디로 대체한다 —
    -- 여기서 예외를 던지면 트리거가 롤백되어 계정 생성 자체가 실패한다.
    if meta_nickname is null
       or char_length(meta_nickname) > 20
       or public.nickname_reserved(meta_nickname) then
        meta_nickname := left(meta_handle, 20);
    end if;

    insert into public.profiles (id, handle, nickname, name, birth, gender, interests, route, intro)
    values (
        new.id,
        meta_handle,
        meta_nickname,
        coalesce(new.raw_user_meta_data ->> 'name', ''),
        nullif(new.raw_user_meta_data ->> 'birth', '')::date,
        nullif(new.raw_user_meta_data ->> 'gender', ''),
        coalesce(
            (select array_agg(value::text)
             from jsonb_array_elements_text(
                 coalesce(new.raw_user_meta_data -> 'interests', '[]'::jsonb)
             ) as value),
            '{}'
        ),
        nullif(new.raw_user_meta_data ->> 'route', ''),
        nullif(new.raw_user_meta_data ->> 'intro', '')
    );
    return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
    after insert on auth.users
    for each row execute function public.handle_new_user();


-- ---------- 4. updated_at 자동 갱신 ----------
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
    new.updated_at = now();
    return new;
end;
$$;

drop trigger if exists profiles_touch_updated_at on public.profiles;
create trigger profiles_touch_updated_at
    before update on public.profiles
    for each row execute function public.touch_updated_at();


-- ---------- 4-1. 프로필 수정 가드 ----------
-- "본인 수정" 정책은 어느 컬럼을 바꾸는지까지는 보지 않는다(RLS 는 행 단위).
-- 그래서 바뀌면 안 되는 컬럼은 트리거로 따로 잠근다.
--
--  · handle   — 그대로 두면 익명 사용자가 'skala01' 같은 아이디를 선점할 수 있다.
--               UI 에도 수정 기능이 없으므로 가입 후 불변.
--  · is_owner — 스스로 켤 수 있으면 배지의 의미가 없다. 그래서 로그인 세션
--               (auth.uid() 이 있는 요청)에서는 변경을 막는다.
--               SQL Editor / service_role 은 auth.uid() 이 null 이라 통과 → 주인만 설정 가능.
create or replace function public.profiles_guard()
returns trigger
language plpgsql
as $$
begin
    if new.handle is distinct from old.handle then
        raise exception 'handle_immutable';
    end if;

    if new.is_owner is distinct from old.is_owner and auth.uid() is not null then
        raise exception 'is_owner_immutable';
    end if;

    -- 주인 사칭 방지: 주인만 쓸 수 있는 이름은 남이 못 쓴다.
    -- (가입 시점에는 막지 않고 대체한다 — handle_new_user 참고.
    --  여기서 막는 것은 '사용자가 직접 닉네임을 바꾸는' 경우다)
    if new.nickname is distinct from old.nickname
       and not new.is_owner
       and public.nickname_reserved(new.nickname) then
        raise exception 'nickname_reserved';
    end if;

    return new;
end;
$$;

-- 예전 이름의 트리거·함수는 정리한다 (재실행 안전)
drop trigger if exists profiles_guard_handle_trg on public.profiles;
drop function if exists public.profiles_guard_handle();

drop trigger if exists profiles_guard_trg on public.profiles;
create trigger profiles_guard_trg
    before update on public.profiles
    for each row execute function public.profiles_guard();


-- ---------- 5. 아이디(handle) 중복 확인용 RPC ----------
-- 회원가입 전에는 로그인 세션이 없어 profiles 를 조회할 수 없다.
-- 중복 여부(boolean)만 돌려주는 함수를 두어 프로필 내용은 노출하지 않는다.
create or replace function public.handle_available(check_handle text)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
    select not exists (
        select 1 from public.profiles where lower(handle) = lower(check_handle)
    );
$$;

grant execute on function public.handle_available(text) to anon, authenticated;


-- ============================================================
-- 방명록 · 방문자 수 · 업적 랭킹
--
-- 방명록은 '익명 로그인'(signInAnonymously)을 쓴다.
-- 익명이라도 진짜 auth.uid() 가 생기므로, "본인 글만 수정/삭제" 를
-- RLS 로 강제할 수 있다. 대시보드에서 반드시 켜야 한다:
--   Authentication → Sign In / Providers → Anonymous sign-ins → 활성화
-- ============================================================

-- ---------- 6. guestbook ----------
create table if not exists public.guestbook (
    id         uuid        primary key default gen_random_uuid(),
    user_id    uuid        not null references auth.users (id) on delete cascade,
    message    text        not null,
    created_at timestamptz not null default now()
);

alter table public.guestbook
    drop constraint if exists guestbook_message_len;
alter table public.guestbook
    add constraint guestbook_message_len
    check (char_length(trim(message)) between 1 and 300);

-- 목록을 최신순으로 자주 읽는다
create index if not exists guestbook_created_at_idx
    on public.guestbook (created_at desc);

alter table public.guestbook enable row level security;

-- 방명록은 누구나 읽을 수 있다 (비로그인 방문자 포함).
-- 이 정책은 Realtime 구독에도 필요하다 — SELECT 권한이 없으면 변경 이벤트가 오지 않는다.
drop policy if exists "guestbook: 공개 읽기" on public.guestbook;
create policy "guestbook: 공개 읽기"
    on public.guestbook for select
    using (true);

drop policy if exists "guestbook: 본인 작성" on public.guestbook;
create policy "guestbook: 본인 작성"
    on public.guestbook for insert
    with check (auth.uid() = user_id);

drop policy if exists "guestbook: 본인 삭제" on public.guestbook;
create policy "guestbook: 본인 삭제"
    on public.guestbook for delete
    using (auth.uid() = user_id);

-- 남긴 글을 나중에 고칠 수는 없다 (update 정책 없음) — 방명록의 성격상 삭제만 허용.

-- 도배 방지: 같은 사용자는 30초에 한 번만 남길 수 있다.
-- RLS 는 "본인 글인가" 만 보고 횟수는 보지 않으므로, 익명 로그인을 반복하며
-- 글을 쏟아붓는 스크립트를 막으려면 여기서 막아야 한다.
-- (프론트의 busy 플래그는 브라우저에만 있어 우회된다)
create or replace function public.guestbook_rate_limit()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
    last_at timestamptz;
begin
    select max(created_at) into last_at
    from public.guestbook where user_id = new.user_id;

    if last_at is not null and now() - last_at < interval '30 seconds' then
        -- UI 문구는 클라이언트가 만든다. 여기선 식별 가능한 토큰만 던진다.
        raise exception 'guestbook_rate_limit';
    end if;
    return new;
end;
$$;

drop trigger if exists guestbook_rate_limit_trg on public.guestbook;
create trigger guestbook_rate_limit_trg
    before insert on public.guestbook
    for each row execute function public.guestbook_rate_limit();


-- ---------- 7. guestbook_likes ----------
create table if not exists public.guestbook_likes (
    entry_id uuid not null references public.guestbook (id) on delete cascade,
    user_id  uuid not null references auth.users (id) on delete cascade,
    primary key (entry_id, user_id)   -- 1인 1회를 PK 로 강제
);

alter table public.guestbook_likes enable row level security;

drop policy if exists "likes: 공개 읽기" on public.guestbook_likes;
create policy "likes: 공개 읽기"
    on public.guestbook_likes for select
    using (true);

drop policy if exists "likes: 본인 추가" on public.guestbook_likes;
create policy "likes: 본인 추가"
    on public.guestbook_likes for insert
    with check (auth.uid() = user_id);

drop policy if exists "likes: 본인 취소" on public.guestbook_likes;
create policy "likes: 본인 취소"
    on public.guestbook_likes for delete
    using (auth.uid() = user_id);


-- ---------- 8. 방명록 목록 RPC ----------
-- profiles 는 본인 행만 조회 가능하므로, 남의 닉네임을 붙이려면
-- security definer 함수가 필요하다.
-- 반환하는 프로필 정보는 nickname 뿐 — 실명(name)·이메일·생년월일은 나가지 않는다.
-- ⚠ 반환 컬럼에 total_count 를 추가했다. create or replace 는 반환 타입 변경을
-- 허용하지 않으므로(cannot change return type of existing function),
-- 이미 배포된 예전 버전을 먼저 지워야 재실행이 성공한다.
drop function if exists public.guestbook_list(int);

-- 글이 쌓이면 처음부터 다 내려주지 않고 page_limit 만큼만 준다.
-- total_count 를 같이 실어 보내 "더 보기" 를 언제 감출지 판단한다.
--
-- offset 방식을 쓰지 않는 이유: Realtime 으로 목록이 갱신될 때마다
-- "지금 펼쳐 놓은 만큼" 을 다시 받아야 하는데, offset 으로 이어붙이면
-- 중간에 글이 추가/삭제될 때 경계가 어긋난다. 그냥 limit 을 늘려 다시 받는 편이
-- 항상 일관되고, 이 규모(최대 100건)에서는 비용도 무시할 만하다.
create or replace function public.guestbook_list(page_limit int default 10)
returns table (
    id          uuid,
    nickname    text,
    message     text,
    created_at  timestamptz,
    like_count  bigint,
    liked_by_me boolean,
    is_mine     boolean,
    is_owner    boolean,
    total_count bigint
)
language sql
security definer
set search_path = public
stable
as $$
    select
        g.id,
        coalesce(p.nickname, '익명'),
        g.message,
        g.created_at,
        (select count(*) from public.guestbook_likes l where l.entry_id = g.id),
        exists (
            select 1 from public.guestbook_likes l
            where l.entry_id = g.id and l.user_id = auth.uid()
        ),
        -- auth.uid() 가 NULL(비로그인)이면 비교 결과가 NULL 이므로 false 로 확정한다
        coalesce(g.user_id = auth.uid(), false),
        -- 사이트 주인이 쓴 글인지 (닉네임 사칭과 구분하는 위조 불가 표시)
        coalesce(p.is_owner, false),
        -- limit 이 걸리기 전의 전체 개수 (창 함수는 limit 보다 먼저 계산된다)
        count(*) over ()
    from public.guestbook g
    left join public.profiles p on p.id = g.user_id
    order by g.created_at desc
    limit least(greatest(page_limit, 1), 100);
$$;

grant execute on function public.guestbook_list(int) to anon, authenticated;


-- ---------- 9. 방문자 수 ----------
-- 날짜 + 방문자키로 중복을 제거한다. 방문자키는 브라우저 localStorage 의 UUID.
create table if not exists public.daily_visits (
    visit_date  date not null default current_date,
    visitor_key text not null,
    primary key (visit_date, visitor_key)
);

alter table public.daily_visits
    drop constraint if exists daily_visits_key_len;
alter table public.daily_visits
    add constraint daily_visits_key_len
    check (char_length(visitor_key) between 8 and 64);

alter table public.daily_visits enable row level security;
-- 정책을 하나도 만들지 않는다 → 클라이언트는 이 테이블에 직접 접근 불가.
-- 아래 RPC(security definer)를 통해서만 기록하고, 집계 숫자만 받아 간다.
-- (개별 방문 기록이 공개되면 누가 언제 왔는지가 드러난다)

create or replace function public.record_visit(key text)
returns table (today_count bigint, total_count bigint)
language plpgsql
security definer
set search_path = public
as $$
begin
    insert into public.daily_visits (visit_date, visitor_key)
    values (current_date, key)
    on conflict (visit_date, visitor_key) do nothing;

    return query
    select
        (select count(*) from public.daily_visits where visit_date = current_date),
        (select count(distinct visitor_key) from public.daily_visits);
end;
$$;

grant execute on function public.record_visit(text) to anon, authenticated;


-- ---------- 10. 업적 랭킹 ----------
-- achievements 는 본인 행만 조회 가능하므로 랭킹도 security definer 로 집계한다.
-- 닉네임과 개수만 나간다 — 실명은 노출되지 않는다.
-- ⚠ 반환 컬럼에 is_owner 를 추가했다 → create or replace 로는 안 되고 먼저 지워야 한다
drop function if exists public.achievement_leaderboard(int);

create or replace function public.achievement_leaderboard(top_n int default 10)
returns table (
    rank              bigint,
    nickname          text,
    achievement_count bigint,
    is_me             boolean,
    is_owner          boolean
)
language sql
security definer
set search_path = public
stable
as $$
    select
        rank() over (order by count(a.achievement_id) desc),
        coalesce(p.nickname, '익명'),
        count(a.achievement_id),
        coalesce(p.id = auth.uid(), false),
        coalesce(p.is_owner, false)
    from public.achievements a
    join public.profiles p on p.id = a.user_id
    group by p.id, p.nickname, p.is_owner
    -- 동점이면 먼저 달성한 사람이 위로
    order by count(a.achievement_id) desc, min(a.unlocked_at) asc
    limit least(greatest(top_n, 1), 50);
$$;

grant execute on function public.achievement_leaderboard(int) to anon, authenticated;

-- 내 순위 (TOP 10 밖일 수 있으므로 따로 조회)
--
-- ⚠ 모집단이 achievement_leaderboard 와 반드시 같아야 한다.
-- 여기서 profiles 조인을 빠뜨리면, 프로필 행이 없는 계정(예: 트리거를 만들기 전에
-- 생성된 익명 계정)까지 세어 랭킹판보다 순위가 밀린다.
-- 실제로 목록엔 "3위"인데 아래엔 "내 순위: 4위"로 어긋나는 버그가 있었다.
create or replace function public.my_achievement_rank()
returns table (rank bigint, achievement_count bigint)
language sql
security definer
set search_path = public
stable
as $$
    with ranked as (
        select
            a.user_id,
            rank() over (order by count(a.achievement_id) desc) as r,
            count(a.achievement_id) as c
        from public.achievements a
        join public.profiles p on p.id = a.user_id   -- 랭킹판과 동일한 모집단
        group by a.user_id
    )
    select r, c from ranked where user_id = auth.uid();
$$;

grant execute on function public.my_achievement_rank() to anon, authenticated;


-- ---------- 11. 인기 명령어 ----------
-- 방문자가 터미널에 입력한 '명령어 이름'만 집계한다.
-- 인자(echo 뒤에 쓴 말 등)는 절대 저장하지 않는다 — 무엇을 쳤는지가 아니라
-- 어떤 기능이 인기 있는지만 알면 되고, 입력 내용은 개인정보가 될 수 있다.
create table if not exists public.command_stats (
    command    text        primary key,
    count      bigint      not null default 0,
    updated_at timestamptz not null default now()
);

-- 알려진 명령어만 허용한다. 없으면 아무 문자열이나 넣어 목록을 더럽힐 수 있다.
-- → js/terminal.js 의 COMMANDS 와 함께 관리한다.
alter table public.command_stats
    drop constraint if exists command_stats_known;
alter table public.command_stats
    add constraint command_stats_known check (command in (
        'about', 'achievements', 'awards', 'bag', 'certs', 'clear', 'coffee',
        'contact', 'cowsay', 'date', 'echo', 'goto', 'grade', 'guestbook',
        'help', 'history', 'joke', 'ls', 'matrix', 'neofetch', 'projects',
        'ranking', 'rps', 'skills', 'sudo', 'theme', 'updown', 'vim',
        'visitors', 'weather', 'whoami'
    ));

alter table public.command_stats enable row level security;

-- 목록은 누구나 읽을 수 있다. 쓰기는 아래 RPC 로만 (직접 UPDATE 로 조작 금지)
drop policy if exists "commands: 공개 읽기" on public.command_stats;
create policy "commands: 공개 읽기"
    on public.command_stats for select
    using (true);

create or replace function public.log_command(cmd text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
    -- 알 수 없는 명령어는 조용히 무시한다 (제약 위반으로 터뜨리지 않는다).
    -- 터미널에서 오타를 쳤다고 화면에 에러가 뜨면 안 되기 때문.
    insert into public.command_stats (command, count)
    values (cmd, 1)
    on conflict (command) do update
        set count = public.command_stats.count + 1,
            updated_at = now();
exception
    when check_violation then return;
end;
$$;

grant execute on function public.log_command(text) to anon, authenticated;

create or replace function public.popular_commands(top_n int default 5)
returns table (command text, count bigint)
language sql
security definer
set search_path = public
stable
as $$
    select c.command, c.count
    from public.command_stats c
    where c.count > 0
    order by c.count desc, c.command asc
    limit least(greatest(top_n, 1), 20);
$$;

grant execute on function public.popular_commands(int) to anon, authenticated;


-- ---------- 12. 함께 그리기 (공동 픽셀 캔버스) ----------
-- 32×32 격자를 모든 방문자가 공유한다. 남이 칠한 칸도 덮어쓸 수 있다(r/place 방식).
create table if not exists public.canvas_pixels (
    x          smallint    not null check (x between 0 and 31),
    y          smallint    not null check (y between 0 and 31),
    color      smallint    not null check (color between 0 and 9),  -- 팔레트 인덱스
    user_id    uuid        not null references auth.users (id) on delete cascade,
    updated_at timestamptz not null default now(),
    primary key (x, y)
);

alter table public.canvas_pixels enable row level security;

drop policy if exists "canvas: 공개 읽기" on public.canvas_pixels;
create policy "canvas: 공개 읽기"
    on public.canvas_pixels for select
    using (true);

-- 칠하려면 신원이 필요하다(익명 로그인 포함). user_id 는 반드시 본인이어야 한다.
drop policy if exists "canvas: 칠하기" on public.canvas_pixels;
create policy "canvas: 칠하기"
    on public.canvas_pixels for insert
    with check (auth.uid() = user_id);

-- 남의 칸도 덮어쓸 수 있다(using true) — 다만 덮어쓴 뒤 주인은 나여야 한다.
drop policy if exists "canvas: 덮어쓰기" on public.canvas_pixels;
create policy "canvas: 덮어쓰기"
    on public.canvas_pixels for update
    using (true)
    with check (auth.uid() = user_id);

-- 연타/스크립트 도배 방지: 한 사람당 2초에 한 칸.
create or replace function public.canvas_rate_limit()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
    last_at timestamptz;
begin
    select max(updated_at) into last_at
    from public.canvas_pixels where user_id = new.user_id;

    if last_at is not null and now() - last_at < interval '2 seconds' then
        raise exception 'canvas_rate_limit';
    end if;
    new.updated_at := now();
    return new;
end;
$$;

drop trigger if exists canvas_rate_limit_ins on public.canvas_pixels;
create trigger canvas_rate_limit_ins
    before insert on public.canvas_pixels
    for each row execute function public.canvas_rate_limit();

drop trigger if exists canvas_rate_limit_upd on public.canvas_pixels;
create trigger canvas_rate_limit_upd
    before update on public.canvas_pixels
    for each row execute function public.canvas_rate_limit();


-- ---------- 13. 주인 계정 지정 ----------
-- 아래 이메일로 가입한 계정에 '주인' 배지를 붙인다.
-- (사용자 세션에서는 트리거가 막으므로 여기 SQL Editor 에서만 설정된다)
--
-- handle 이 아니라 email 로 찾는 이유: handle 은 가입 폼의 '아이디'(4~15자 영문/숫자)라
-- 이메일을 넣으면 형식이 맞지 않아 0건이 매칭되고, 오류도 없이 조용히 지나간다.
-- 스키마를 다시 실행해도 주인 지정이 유지된다.
update public.profiles p
   set is_owner = true
  from auth.users u
 where u.id = p.id
   and lower(u.email) = lower('givpro22@daum.net');

-- 확인:  select handle, nickname, is_owner from public.profiles where is_owner;


-- ---------- 14. Realtime ----------
-- 방명록과 좋아요 변경을 구독할 수 있게 publication 에 추가한다.
-- (RLS 는 그대로 적용되므로 SELECT 정책이 허용하는 행만 전달된다)
do $$
begin
    if not exists (
        select 1 from pg_publication_tables
        where pubname = 'supabase_realtime' and tablename = 'guestbook'
    ) then
        alter publication supabase_realtime add table public.guestbook;
    end if;

    if not exists (
        select 1 from pg_publication_tables
        where pubname = 'supabase_realtime' and tablename = 'guestbook_likes'
    ) then
        alter publication supabase_realtime add table public.guestbook_likes;
    end if;

    if not exists (
        select 1 from pg_publication_tables
        where pubname = 'supabase_realtime' and tablename = 'canvas_pixels'
    ) then
        alter publication supabase_realtime add table public.canvas_pixels;
    end if;
end;
$$;
