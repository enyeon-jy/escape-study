import type { LockType } from "./lock";

export type ThemeId = "horror" | "isekai" | "detective";
export type Difficulty = "easy" | "normal" | "hard";
export type GameMode = "quick" | "full";

export type ClueFormat = "note" | "diary" | "chat" | "document" | "sms" | "recording" | "code"; // code: 컴퓨터 화면에 뜬 코드 (프로그래밍 과목의 코드 자물쇠 방)
export type ViewId = "shelf" | "desk" | "cabinet"; // 클로즈업 화면 (방마다 2~3개)
export type SlotShape = "drawer" | "notebook" | "cup" | "box" | "book" | "monitor";

export interface Concept {
  id: string;
  name: string;
}

// 단서 조각. 가짜 단서(fake)는 그럴듯하지만 답과 상관없다. 화면에서는 진짜/가짜를 구분해 보여 주지 않는다.
export interface Clue {
  id: string;
  kind: "real" | "fake";
  format: ClueFormat;
  title: string;
  lines: string[];
}

// 가방에 들어가는 아이템 (방마다 열쇠 1개 정도)
export interface Item {
  id: string;
  name: string;
  icon: string;
}

// 물건 안에 들어 있는 것: 단서 또는 아이템 (없으면 "아무것도 없다")
export interface Content {
  clueId?: string;
  itemId?: string;
}

// 클로즈업 화면 안의 작은 물건 (서랍, 노트, 컵 등)
export interface Slot {
  id: string;
  label: string;
  shape: SlotShape;
  content: Content | null;
  lockedBy?: string; // 이 아이템으로만 열린다
}

export interface RoomView {
  id: ViewId;
  slots: Slot[]; // 3칸
}

export interface Room {
  id: string;
  name: string;
  situation: string; // 짧은 상황 설명
  story: string; // 이어지는 스토리 한 줄
  wallSpots: Record<string, Content | null>; // 벽에 바로 있는 물건 (frame, board, trash)
  views: RoomView[]; // 클로즈업 화면 2~3개
  items: Item[];
  clues: Clue[];
  lock: {
    type: LockType; // AI가 정답 종류(숫자·영어 약자·순서)에 맞게 정한다
    answer: string; // 정답 (코드가 비교)
    units?: string[];
    hints: string[]; // 앞에서부터 순서대로 보여 줌
    explanation: string; // "왜 그게 답인지" 짧은 설명 (정답 보기에서 보여 줌)
  };
  conceptIds: string[];
  professorLine: string; // 실패했을 때 교수님 대사
  isFinal: boolean; // 탈출구가 있는 마지막 방
  codeLang?: "python" | "javascript"; // 코드 자물쇠 방이면 코드의 언어 (정답은 코드를 실제로 실행해서 정했다)
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
  material: string; // 붙여넣은 자료(최대 8,000자). 다음 방을 만들 때 다시 쓴다
  isSample?: boolean; // 예시 자료로 시작한 게임 (AI를 부르지 않는다)
  codeLang?: "python" | "javascript"; // 프로그래밍 과목이면 코드 자물쇠 방의 언어 (아니면 없음)
  codeRoomIdx?: number; // 코드 자물쇠 방 번호 (방은 하나만)
}

// 방탈출 진행 상황 (브라우저에 저장되어 "이어하기"에 쓰임)
export interface Progress {
  roomIdx: number;
  remaining: number; // 현재 방 남은 시간(초)
  foundClueIds: string[]; // 현재 방에서 찾은 단서
  inspected: string[]; // 현재 방에서 조사한 물건
  bag: string[]; // 가방 속 아이템
  unlocked: string[]; // 열어 둔 잠긴 곳
  hintsShown: number; // 현재 방에서 본 힌트 수
  hintsUsed: number; // 전체 힌트 사용 수
  revealedRooms: string[]; // 정답 보기를 눌렀던 방 id
  wrongRooms: string[]; // 한 번이라도 틀렸던 방 이름
  clearedSec: number[]; // 탈출한 방별 걸린 시간
}

export interface GameResult {
  success: boolean;
  elapsedSec: number; // 방별 시간 합산
  hintsUsed: number;
  wrongLocks: string[];
  revealedCount: number; // 정답 열람 횟수
  revealedConceptIds: string[]; // 정답을 열람한 개념 (복습에서 맨 먼저)
  roomsCleared: number;
  totalRooms: number;
  playedConceptIds: string[]; // 이번 게임에서 다룬 개념 (복습에서 다시 물음)
  failedConcepts?: string[]; // 시간이 끝났을 때 풀던 방의 개념 이름
  professorLine?: string;
}
