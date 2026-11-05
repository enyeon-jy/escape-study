// FactChat(학교 AI, OpenAI 방식) 호출. 서버(API 라우트)에서만 불러 쓴다.
// 키와 모델 ID는 환경변수에서만 읽는다: OPENAI_API_KEY, OPENAI_MODEL (주소는 OPENAI_BASE_URL로 바꿀 수 있다)

const DEFAULT_BASE_URL = "https://factchat-cloud.mindlogic.ai/v1/gateway";
const CALL_TIMEOUT_MS = Number(process.env.AI_TIMEOUT_MS) || 40_000;

export class ConfigError extends Error {}

// deadline(마감 시각)이 있으면 남은 시간만큼만 기다린다 (Vercel 서버 함수 제한 60초 안에서 재시도까지 끝내기 위해)
export async function callAI(system: string, user: string, deadline?: number): Promise<unknown> {
  const key = process.env.OPENAI_API_KEY;
  const model = process.env.OPENAI_MODEL;
  if (!key) throw new ConfigError("서버에 OPENAI_API_KEY가 설정되지 않았어요.");
  if (!model) throw new ConfigError("서버에 OPENAI_MODEL이 설정되지 않았어요.");
  const base = (process.env.OPENAI_BASE_URL || DEFAULT_BASE_URL).replace(/\/+$/, "");

  const started = Date.now();
  const budget = Math.min(CALL_TIMEOUT_MS, deadline ? deadline - started : CALL_TIMEOUT_MS);
  if (budget < 6000) throw new Error("남은 시간이 부족해 AI를 부르지 않음");
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), budget);
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
      const body = (await res.text().catch(() => "")).slice(0, 300).split(key).join("[KEY]");
      console.error(`[ai] HTTP ${res.status} ${base}/chat/completions ${body}`);
      throw new Error(`AI 응답 오류 ${res.status}`);
    }
    const data = (await res.json()) as { choices?: { message?: { content?: string } }[]; usage?: { completion_tokens?: number } };
    console.log(`[ai] 응답 ${Date.now() - started}ms, 출력 토큰 ${data.usage?.completion_tokens ?? "?"}`);
    const text = data.choices?.[0]?.message?.content;
    if (!text) throw new Error("AI 응답이 비어 있음");
    try {
      return extractJson(text);
    } catch (e) {
      console.error(`[ai] JSON 해석 실패 (${e instanceof Error ? e.message : e}). 응답 앞부분: ${text.slice(0, 500)}`);
      throw new Error("AI 응답을 JSON으로 읽지 못함");
    }
  } catch (e) {
    if (e instanceof Error && e.name === "AbortError") throw new Error(`AI 응답 시간 초과 (${Math.round(budget / 1000)}초)`);
    throw e;
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
