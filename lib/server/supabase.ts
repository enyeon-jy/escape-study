// Supabase 저장 (서버에서만 사용). 키는 서버 환경변수에서만 읽고, 화면 코드에는 절대 쓰지 않는다.
//   SUPABASE_URL                  예: https://xxxx.supabase.co
//   SUPABASE_SERVICE_ROLE_KEY     프로젝트 설정 > API 의 service_role(또는 Secret) 키. 서버 전용!
// 별도 라이브러리 없이 Supabase의 REST 주소를 fetch로 부른다. 테이블은 RLS가 켜져 있어 이 서버 키로만 쓸 수 있다.

const TIMEOUT_MS = 8_000;

export class NotConfigured extends Error {}

function config() {
  const url = process.env.SUPABASE_URL?.trim().replace(/\/+$/, "");
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!url || !key) throw new NotConfigured("SUPABASE_URL 또는 SUPABASE_SERVICE_ROLE_KEY가 설정되지 않음");
  return { url, key };
}

// 같은 id가 이미 있으면 덮어쓴다(upsert). 성공하면 true.
export async function upsert(table: "games" | "play_logs", row: object): Promise<void> {
  const { url, key } = config();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    apikey: key,
    Prefer: "resolution=merge-duplicates,return=minimal",
  };
  // 예전 방식의 키(eyJ...로 시작하는 JWT)는 Authorization에도 함께 보낸다. 새 방식(sb_secret_...)은 apikey만 보낸다.
  if (key.startsWith("eyJ")) headers.Authorization = `Bearer ${key}`;

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(`${url}/rest/v1/${table}?on_conflict=id`, { method: "POST", headers, body: JSON.stringify(row), signal: ctrl.signal });
    if (!res.ok) {
      const body = (await res.text().catch(() => "")).slice(0, 300).split(key).join("[KEY]");
      throw new Error(`Supabase ${table} 저장 실패 HTTP ${res.status} ${body}`);
    }
  } finally {
    clearTimeout(timer);
  }
}
