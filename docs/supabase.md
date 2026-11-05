# Supabase 연결 안내 (처음부터 끝까지)

게임 데이터와 플레이 결과를 Supabase(무료 요금제)에 저장합니다. 저장은 **우리 서버 함수(`/api/save`)에서만** 하고,
키는 **서버 환경변수에만** 넣습니다. 연결이 안 되어 있거나 실패해도 게임은 지금처럼 그대로 돌아갑니다.

## 무엇이 저장되나요?
| 테이블 | 저장하는 것 |
|---|---|
| `games` | 과목명, 테마, 난이도, 게임 길이, 방 JSON, 예시 자료 여부, 코드 방 언어 |
| `play_logs` | 탈출 성공 여부, 걸린 시간, 힌트 수, 정답 열람 수, 탈출한 방 수, 복습 완료 여부 |

**저장하지 않는 것:** 이름·이메일 같은 개인정보, 강의자료 원문, IP 주소. (서버가 허용한 칸만 골라 담고 나머지는 버립니다.)

## 1단계. 테이블 만들기 (SQL Editor)
1. [supabase.com](https://supabase.com) 에 로그인하고 만들어 둔 프로젝트를 엽니다.
2. 왼쪽 메뉴에서 **SQL Editor** 를 누르고 **New query** 를 누릅니다.
3. 이 저장소의 `supabase/schema.sql` 파일 내용을 **전부 복사해서 붙여넣고** 오른쪽 아래 **Run** 을 누릅니다.
4. `Success. No rows returned` 가 나오면 성공입니다. (여러 번 눌러도 괜찮아요.)
5. 왼쪽 **Table Editor** 에 `games`, `play_logs` 가 보이고, 표 이름 옆에 **RLS enabled** 표시가 있으면 보안 설정까지 된 것입니다.

> RLS(행 수준 보안)가 켜져 있고 공개용 정책이 없어서, 브라우저에서 쓰는 공개 키로는 이 테이블을 읽거나 쓸 수 없습니다.
> 서버가 쓰는 비밀 키만 저장할 수 있습니다.

## 2단계. 환경변수 값 찾기
필요한 환경변수는 **딱 2개**입니다. 둘 다 **서버 전용**이라 이름 앞에 `NEXT_PUBLIC_` 을 붙이면 안 됩니다.

| 환경변수 이름 | 값 | Supabase 웹사이트에서 찾는 곳 |
|---|---|---|
| `SUPABASE_URL` | `https://xxxxxxxx.supabase.co` 모양의 주소 | 프로젝트 화면 왼쪽 아래 **Project Settings**(톱니바퀴) → **Data API**(또는 **API**) 의 **Project URL** |
| `SUPABASE_SERVICE_ROLE_KEY` | 아주 긴 비밀 키 | 같은 Project Settings → **API Keys**. 새 화면이면 **Secret key**(`sb_secret_...` 로 시작, *Reveal* 로 보기), 옛 화면이면 **service_role** 키(`eyJ...` 로 시작) |

주의
- **공개용 키(Publishable / anon)가 아니라 비밀 키(Secret / service_role)** 를 넣어야 합니다.
- 비밀 키는 **GitHub, 채팅, 화면 캡처에 절대 올리지 마세요.** `.env.local` 은 이미 `.gitignore` 에 들어 있어 커밋되지 않습니다.
- 화면 구성은 Supabase 업데이트로 조금 달라질 수 있어요. "Project URL"과 "Secret / service_role 키"를 찾으면 됩니다.

## 3단계. 내 컴퓨터에서 쓰기 (`.env.local`)
1. 프로젝트 폴더(`escape-study`) 맨 위의 `.env.local` 파일을 엽니다. (이미 OpenAI 값이 들어 있을 거예요.)
2. 아래 두 줄을 **추가**합니다. 따옴표 없이, `=` 양쪽에 공백 없이 씁니다.
   ```
   SUPABASE_URL=https://내프로젝트주소.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=여기에_비밀_키
   ```
3. 개발 서버가 켜져 있다면 끄고(`Ctrl+C`) 다시 `npm run dev` 로 켭니다. (환경변수는 서버를 켤 때 읽습니다.)

## 4단계. Vercel에 넣기 (배포 주소에서 쓰려면)
1. [vercel.com](https://vercel.com) → 이 프로젝트를 엽니다.
2. 위쪽 **Settings** → 왼쪽 **Environment Variables** 를 누릅니다.
3. **Key** 에 `SUPABASE_URL`, **Value** 에 주소를 넣고, Environments 는 **Production / Preview / Development 모두 체크**한 뒤 **Save** 를 누릅니다.
4. 같은 방법으로 `SUPABASE_SERVICE_ROLE_KEY` 도 추가합니다. (Sensitive 옵션이 보이면 켜 두면 좋아요.)
5. **환경변수는 새로 배포해야 적용됩니다.** 위쪽 **Deployments** → 맨 위 배포의 **⋯** → **Redeploy** 를 누르세요.

## 5단계. 잘 저장되는지 확인
1. 게임을 한 번 만들고(예시 자료로 해 봐도 됩니다) 끝까지 해 봅니다.
2. Supabase **Table Editor** → `games` 에 방금 게임이, `play_logs` 에 결과가 한 줄 생겼는지 봅니다.
3. 복습까지 끝내면 같은 `play_logs` 줄의 `review_done` 이 `true` 로 바뀝니다.

## 문제가 생기면
- 표에 아무것도 안 생겨요 → 환경변수 이름 철자, 값 앞뒤 공백, **Vercel은 Redeploy 했는지**, 비밀 키(공개 키 아님)인지 확인하세요. 서버 로그(Vercel → Logs)에 `[save]` 로 시작하는 줄에 이유가 남습니다.
- 그래도 게임은 정상적으로 됩니다. 저장은 "보내고 잊기" 방식이라 실패해도 게임을 막지 않아요.
