export type ThemeId = "horror" | "isekai" | "detective";
export type Difficulty = "easy" | "normal" | "hard";
export type GameMode = "quick" | "full";

export type ClueFormat = "note" | "diary" | "chat" | "document" | "sms" | "recording";

export interface Concept {
  id: string;
  name: string;
}

// 단서 조각. 가짜 단서(fake)는 그럴듯하지만 답과 상관없다.
// 화면에서는 진짜/가짜를 구분해 보여 주지 않는다.
export interface Clue {
  id: string;
  kind: "real" | "fake";
  format: ClueFormat;
  title: string;
  lines: string[];
}

export interface Room {
  id: string;
  name: string;
  situation: string; // 짧은 상황 설명
  story: string; // 이어지는 스토리 한 줄
  // 방 장면의 물건 id → 그 물건에서 나오는 단서 id (없으면 "아무것도 없다")
  placements: Record<string, string | null>;
  clues: Clue[];
  lock: {
    kind: "door" | "safe";
    question: string;
    answer: string; // 정답 (코드가 비교)
    units?: string[]; // 무시할 단위
    hints: string[]; // 앞에서부터 순서대로 보여 줌
  };
  conceptIds: string[]; // 이 방에서 다루는 개념
  professorLine: string; // 실패했을 때 교수님 대사
  isFinal: boolean; // 탈출구가 있는 마지막 방
}

export interface ReviewItem {
  conceptId: string;
  prompt: string; // 빈칸 문제 (빈칸은 ____ 로 표시)
  answer: string;
  units?: string[];
  explanation: string;
}

export interface GameData {
  subject: string;
  theme: ThemeId;
  difficulty: Difficulty;
  mode: GameMode;
  surprise: boolean;
  concepts: Concept[];
  roomCount: number;
  rooms: Room[]; // 지금까지 만들어진 방 (뒤쪽 방은 플레이하는 동안 만들어짐)
  review: ReviewItem[];
}

// 방탈출 진행 상황 (브라우저에 저장되어 "이어하기"에 쓰임)
export interface Progress {
  roomIdx: number;
  remaining: number; // 현재 방 남은 시간(초)
  foundClueIds: string[]; // 현재 방에서 찾은 단서
  inspected: string[]; // 현재 방에서 조사한 물건
  hintsShown: number; // 현재 방에서 본 힌트 수
  hintsUsed: number; // 전체 힌트 사용 수
  wrongRooms: string[]; // 한 번이라도 틀렸던 방 이름
  clearedSec: number[]; // 탈출한 방별 걸린 시간
}

export interface GameResult {
  success: boolean;
  elapsedSec: number; // 방별 시간 합산
  hintsUsed: number;
  wrongLocks: string[];
  roomsCleared: number;
  totalRooms: number;
  playedConceptIds: string[]; // 이번 게임에서 다룬 개념 (복습에서 다시 물음)
  failedConcepts?: string[]; // 시간이 끝났을 때 풀던 방의 개념 이름
  professorLine?: string;
}
