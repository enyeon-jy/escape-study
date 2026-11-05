// FactChat(학교 AI, OpenAI 방식) 호출. 서버(API 라우트)에서만 불러 쓴다.
// 키와 모델 ID는 환경변수에서만 읽는다: OPENAI_API_KEY, OPENAI_MODEL (주소는 OPENAI_BASE_URL로 바꿀 수 있다)

const DEFAULT_BASE_URL = "https://factchat-cloud.mindlogic.ai/v1/gateway";
const CALL_TIMEOUT_MS = 25_000;

export class ConfigError extends Error {}

export async function callAI(system: string, user: string): Promise<unknown> {
  const key = process.env.OPENAI_API_KEY;
  const model = process.env.OPENAI_MODEL;
  if (!key) throw new ConfigError("서버에 OPENAI_API_KEY가 설정되지 않았어요.");
  if (!model) throw new ConfigError("서버에 OPENAI_MODEL이 설정되지 않았어요.");
  const base = (process.env.OPENAI_BASE_URL || DEFAULT_BASE_URL).replace(/\/+$/, "");

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), CALL_TIMEOUT_MS);
  try {
    const res = await fetch(`${base}/chat/completions`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
      body: JSON.stringify({
        model,
        temperature: 0.7,
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
      }),
      signal: ctrl.signal,
    });
    if (!res.ok) {
      // 응답 본문은 키가 들어 있을 일이 없지만, 로그에는 앞부분만 남긴다
      const body = (await res.text().catch(() => "")).slice(0, 300);
      console.error(`[ai] HTTP ${res.status} ${base}/chat/completions ${body}`);
      throw new Error(`AI 응답 오류 ${res.status}`);
    }
    const data = (await res.json()) as { choices?: { message?: { content?: string } }[] };
    const text = data.choices?.[0]?.message?.content;
    if (!text) throw new Error("AI 응답이 비어 있음");
    return extractJson(text);
  } finally {
    clearTimeout(timer);
  }
}

// ```json 코드 블록이나 앞뒤 설명이 붙어 와도 JSON 부분만 꺼낸다
export function extractJson(text: string): unknown {
  const t = text.replace(/```(?:json)?/gi, "");
  const a = t.indexOf("{");
  const b = t.lastIndexOf("}");
  if (a < 0 || b <= a) throw new Error("JSON이 없음");
  return JSON.parse(t.slice(a, b + 1));
}
