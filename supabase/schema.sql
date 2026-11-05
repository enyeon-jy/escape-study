-- 시험범위에 갇혔다: Supabase 테이블 만들기
-- 사용법: Supabase 웹사이트 > 왼쪽 메뉴 SQL Editor > New query 에 이 파일 내용을 붙여넣고 Run 을 누른다.
-- 여러 번 실행해도 괜찮다 (이미 있으면 건너뜀).
--
-- 저장하는 것: 게임(과목명·테마·난이도·방 JSON), 플레이 결과(성공 여부·시간·힌트·정답 열람·복습 완료)
-- 저장하지 않는 것: 이름·이메일 등 개인정보, 강의자료 원문, IP 주소

-- 1) 게임: 만들어진 게임 한 판
create table if not exists public.games (
  id          uuid primary key,
  subject     text        not null,               -- 과목 이름 (최대 60자)
  theme       text        not null check (theme in ('horror', 'isekai', 'detective')),
  difficulty  text        not null check (difficulty in ('easy', 'normal', 'hard')),
  mode        text        not null check (mode in ('quick', 'full')),
  room_count  int         not null check (room_count between 1 and 8),
  rooms       jsonb       not null,               -- 지금까지 만들어진 방 JSON (강의자료 원문은 들어 있지 않다)
  is_sample   boolean     not null default false, -- "예시 자료로 해 보기"로 만든 게임인지
  code_lang   text,                               -- 코드 자물쇠 방의 언어 (없으면 비어 있음)
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- 2) 플레이 기록: 게임을 한 번 끝낸 결과
create table if not exists public.play_logs (
  id              uuid primary key,
  game_id         uuid        not null,           -- games.id (게임 저장이 실패해도 기록은 남도록 외래키는 걸지 않았다)
  success         boolean     not null,           -- 탈출 성공 여부
  elapsed_sec     int         not null,           -- 걸린 시간(초)
  hints_used      int         not null,           -- 힌트 사용 수
  revealed_count  int         not null,           -- 정답 열람 수
  rooms_cleared   int         not null,           -- 탈출한 방 수
  total_rooms     int         not null,
  review_done     boolean     not null default false, -- 복습을 끝까지 했는지
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists play_logs_game_id_idx on public.play_logs (game_id);

-- 3) 보안: RLS(행 수준 보안)를 켠다.
--    정책(policy)을 하나도 만들지 않으므로 브라우저용 공개 키(anon)로는 읽기·쓰기가 전부 막힌다.
--    우리 서버 함수가 쓰는 service_role(Secret) 키만 RLS를 건너뛰고 저장할 수 있다.
alter table public.games     enable row level security;
alter table public.play_logs enable row level security;

revoke all on public.games     from anon, authenticated;
revoke all on public.play_logs from anon, authenticated;
