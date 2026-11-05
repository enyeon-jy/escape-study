import { AI_ERROR_MESSAGE, AI_RETRY_COUNT } from "./config";

// 실패하면 정해진 횟수(1번)만 다시 시도하고, 그래도 안 되면 안내 문구와 함께 끝낸다. 무한 재시도 없음.
export async function withRetry<T>(fn: () => Promise<T>): Promise<T> {
  for (let i = 0; i <= AI_RETRY_COUNT; i++) {
    try {
      return await fn();
    } catch {
      // 다음 시도로 넘어간다
    }
  }
  throw new Error(AI_ERROR_MESSAGE);
}
