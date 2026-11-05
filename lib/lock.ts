// 자물쇠 종류와 정답 확인. 정답 확인은 AI가 아니라 코드가 한다.
//
// AI가 방을 만들 때 JSON의 lock.type 으로 종류를 같이 정한다:
//  - dial-number : 숫자 다이얼 (정답이 숫자. 바퀴 3~4개, 정답이 짧으면 앞을 0으로 채움: 7 → 007)
//  - dial-alpha  : 알파벳 다이얼 (정답이 영어 약자. 바퀴 수 = 글자 수)
//  - keypad      : 키패드 도어락 (정답이 숫자열)
//  - direction   : 방향 자물쇠 (정답이 순서. "UDLR" = ↑ ↓ ← →)
export type LockType = "dial-number" | "dial-alpha" | "keypad" | "direction";

export interface LockLike {
  type: LockType;
  answer: string;
}

export const LOCK_TYPES: LockType[] = ["dial-number", "dial-alpha", "keypad", "direction"];

export const DIRECTION_SYMBOL: Record<string, string> = { U: "↑", D: "↓", L: "←", R: "→" };

export const LOCK_NAME: Record<LockType, string> = {
  "dial-number": "숫자 다이얼 자물쇠",
  "dial-alpha": "알파벳 다이얼 자물쇠",
  keypad: "키패드 도어락",
  direction: "방향 자물쇠",
};

// AI가 "7계층" 같이 지저분하게 줘도 자물쇠에 맞게 정리한다.
export function cleanAnswer(type: LockType, answer: string): string {
  switch (type) {
    case "dial-number":
    case "keypad":
      return answer.replace(/\D/g, "");
    case "dial-alpha":
      return answer.toUpperCase().replace(/[^A-Z]/g, "");
    case "direction":
      return answer.toUpperCase().replace(/[^UDLR]/g, "");
  }
}

// 다이얼 바퀴 수
export function dialWheels(lock: LockLike): number {
  const a = cleanAnswer(lock.type, lock.answer);
  return lock.type === "dial-number" ? Math.max(3, a.length) : Math.max(1, a.length);
}

export function checkLock(lock: LockLike, input: string): boolean {
  const a = cleanAnswer(lock.type, lock.answer);
  if (!a) return false;
  switch (lock.type) {
    case "dial-number":
      return input === a.padStart(dialWheels(lock), "0");
    case "dial-alpha":
      return input.toUpperCase() === a;
    case "keypad":
    case "direction":
      return input === a;
  }
}
