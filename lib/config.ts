import type { Difficulty } from "./types";

// ─── 조절하기 쉬운 설정값 모음 ───────────────────────────────────────────

// 난이도별 설정 (docs/요구사항.md의 난이도 표)
export const DIFFICULTY: Record<
  Difficulty,
  {
    label: string;
    desc: string;
    realClues: [number, number]; // 진짜 단서 개수 [최소, 최대]
    fakeClues: number; // 가짜 단서 개수
    wording: "direct" | "indirect" | "veryIndirect"; // 개념을 말하는 방식 (AI 프롬프트에서 사용)
    roomSec: number; // 방당 제한 시간(초)
    hintsPerRoom: number; // 방당 힌트 횟수
  }
> = {
  easy: {
    label: "쉬움",
    desc: "단서 2개 · 방당 10분 · 힌트 3번",
    realClues: [2, 2],
    fakeClues: 0,
    wording: "direct",
    roomSec: 10 * 60,
    hintsPerRoom: 3,
  },
  normal: {
    label: "보통",
    desc: "단서 3개 + 가짜 1개 · 방당 7분 · 힌트 2번",
    realClues: [3, 3],
    fakeClues: 1,
    wording: "indirect",
    roomSec: 7 * 60,
    hintsPerRoom: 2,
  },
  hard: {
    label: "어려움",
    desc: "단서 3~4개 + 가짜 2개 · 방당 5분 · 힌트 1번",
    realClues: [3, 4],
    fakeClues: 2,
    wording: "veryIndirect",
    roomSec: 5 * 60,
    hintsPerRoom: 1,
  },
};

// 게임 길이(방 개수) 기준
export const ROOMS = {
  quickRooms: 3, // "빠른 탈출"의 방 개수
  conceptsPerRoom: 2.5, // "전체 범위 탈출": 개념 2~3개당 방 1개
  minRooms: 3,
  maxRooms: 8,
};

// AI와 학교 크레딧 관련 제한
export const MATERIAL_MAX_CHARS = 8000; // 붙여넣는 자료의 최대 글자 수
export const AI_RETRY_COUNT = 1; // 실패하면 딱 1번만 다시 시도
export const AI_ERROR_MESSAGE = "방을 만들지 못했어요. 잠시 후 다시 시도해 주세요.";

// 방 장면에서 클릭할 수 있는 물건 수 (장면 그림에 맞춰져 있음)
export const SCENE_OBJECT_COUNT = 6;

// 세계관 소개 (첫 방 시작 전에 보여 준다). 테마에 맞게 말투만 바뀐다.
export const STORY_INTRO: Record<"horror" | "isekai" | "detective", string> = {
  horror: "시험 전날 밤, 도서관에서 깜빡 잠들었다. 눈을 떠 보니 불 꺼진 폐교, 시험범위 속에 갇혀 있다. 아침 9시 시험 전에 탈출해야 한다.",
  isekai: "시험 전날 밤, 도서관에서 잠들었다 깨어 보니 낯선 마법 세계다. 시험범위의 봉인을 풀어야 돌아갈 수 있다. 아침 9시 시험 전에!",
  detective: "시험 전날 밤, 도서관에서 잠들었다 깨어 보니 사건 현장 연구실이다. 시험범위 속 단서를 모아 탈출해야 한다. 아침 9시 시험 전에!",
};
