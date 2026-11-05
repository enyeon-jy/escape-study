import { AI_ERROR_MESSAGE, AI_RETRY_COUNT } from "./config";

// 실패하면 정해진 횟수(1번)만 다시 시도하고, 그래도 안 되면 안내 문구와 함께 끝낸다. 무한 재시도 없음.
export async function withRetry<T>(fn: () => Promise<T>, label = "작업"): Promise<T> {
  for (let i = 0; i <= AI_RETRY_COUNT; i++) {
    try {
      return await fn();
    } catch (e) {
      // 왜 실패했는지 서버 로그에 남긴다 (키는 이 메시지에 들어가지 않는다)
      console.error(`[retry:${label}] ${i + 1}/${AI_RETRY_COUNT + 1}번째 시도 실패: ${e instanceof Error ? e.message : String(e)}`);
    }
  }
  throw new Error(AI_ERROR_MESSAGE);
}
