-- 임원 근력왕을 찾아라 (7월 특별 이벤트) 스키마
-- Supabase SQL Editor에서 실행하세요.

create table if not exists voters (
  id uuid primary key default gen_random_uuid(),
  company text not null,
  department text not null,
  name text not null,
  created_at timestamptz not null default now(),
  unique (company, department, name)
);

create table if not exists candidates (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  title text,                 -- 직책 (예: 대표이사, CFO)
  photo_url text,
  display_order int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists votes (
  id uuid primary key default gen_random_uuid(),
  voter_id uuid not null references voters(id) on delete cascade unique,
  candidate_id uuid not null references candidates(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists votes_candidate_id_idx on votes(candidate_id);

alter table voters enable row level security;
alter table candidates enable row level security;
alter table votes enable row level security;

-- voters: 직원이 로그인 시 anon key로 자신의 레코드를 조회/생성
drop policy if exists "voters_select" on voters;
drop policy if exists "voters_insert" on voters;
create policy "voters_select" on voters for select using (true);
create policy "voters_insert" on voters for insert with check (true);

-- candidates: 공개 조회는 활성 후보만 허용. 등록/수정/삭제는 서버(관리자 비밀번호 확인 후
-- service role key)에서만 수행하므로 anon 쓰기 정책은 만들지 않습니다(기본적으로 차단됨).
drop policy if exists "candidates_select_active" on candidates;
create policy "candidates_select_active" on candidates for select using (is_active = true);

-- votes: 누구나 조회 가능(참여 인원 집계용), 본인 투표 등록/변경은 anon key로 허용. 삭제 정책은 없음.
drop policy if exists "votes_select" on votes;
drop policy if exists "votes_insert" on votes;
drop policy if exists "votes_update" on votes;
create policy "votes_select" on votes for select using (true);
create policy "votes_insert" on votes for insert with check (true);
create policy "votes_update" on votes for update using (true) with check (true);

-- 참여 현황 실시간 카운트를 위해 realtime publication에 추가
alter publication supabase_realtime add table votes;
