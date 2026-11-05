export type ThemeId = "horror" | "isekai" | "detective";

export type ClueFormat = "note" | "diary" | "chat" | "document" | "sms" | "recording";

export interface Room {
  name: string;
  situation: string;
  clue: { format: ClueFormat; title: string; lines: string[] };
  lock: {
    question: string;
    answer: string; // 정답 (코드가 비교)
    units?: string[]; // 무시할 단위 (예: "계층")
    hints: string[];
  };
  concept: string; // 이 방에서 다루는 핵심 개념 이름
  professorLine: string; // 실패했을 때 교수님 대사
}

export interface ReviewItem {
  prompt: string; // 빈칸 문제 (빈칸은 ____ 로 표시)
  answer: string;
  units?: string[];
  explanation: string;
}

export interface GameData {
  subject: string;
  theme: ThemeId;
  timeLimitSec: number;
  rooms: Room[];
  review: ReviewItem[];
}

export interface GameResult {
  success: boolean;
  elapsedSec: number;
  hintsUsed: number;
  wrongLocks: string[]; // 한 번이라도 틀렸던 방 이름
  failedConcept?: string; // 시간이 끝났을 때 풀던 방의 개념
}
