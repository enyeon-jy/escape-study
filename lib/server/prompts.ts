import { DIFFICULTY } from "../config";
import type { Concept, Difficulty, GameMode, ThemeId } from "../types";

// AI에게 주는 지시문 (서버에서만 사용). 규칙은 docs/요구사항.md의 "AI에게 지킬 규칙"과 같다.

const THEME_STYLE: Record<ThemeId, string> = {
  horror: "폐교된 학교 실험실. 빨간 조명, 깜빡이는 형광등 분위기. 단서 예: 경고 쪽지, 찢어진 실험 일지. 잔인한 표현 없이 분위기로만 무섭게.",
  isekai: "판타지 세계. 보라·청록 빛, 마법진, 퀘스트 느낌. 단서 예: 봉인된 마법서, NPC의 귓속말.",
  detective: "사건 현장 연구실. 탐정 수첩 느낌. 단서 예: 유출된 기밀 문서, 자백 녹취록, 엿들은 대화.",
};

const WORDING: Record<"direct" | "indirect" | "veryIndirect", string> = {
  direct: "단서에 개념 이름이 직접 나와도 된다. 단, 정답 값 자체는 쓰지 않는다.",
  indirect: "개념 이름 대신 설명으로 돌려 말한다.",
  veryIndirect: "아주 간접적으로, 개념을 알아야만 떠올릴 수 있게 암시한다.",
};

export const SYSTEM_PROMPT = `너는 대학생의 시험공부를 돕는 방탈출 게임의 출제자다. 반드시 JSON 객체 하나만 출력한다. 설명 문장, 마크다운, 코드 블록은 쓰지 않는다.

[꼭 지킬 규칙]
1. 사용자가 준 [강의자료]에 있는 내용만 사용한다. 자료에 없는 사실·숫자·용어를 지어내지 않는다.
2. 정답은 숫자나 짧은 단어(영어 약자 포함)로만 한다. 애매한 답, 문장형 답은 금지한다.
3. 정답은 반드시 강의자료에 나온 값이어야 한다.
4. 등장인물은 가상 인물이나 의인화한 개념만 쓴다. 실제 사람(교수님, 학생, 유명인)과 실제 학교·회사 이름은 단서에 등장시키지 않는다.
5. 긴장감 있고 자극적이어도 되지만 욕설·비하·잔인한 표현은 쓰지 않는다.
6. 모든 글은 한국어로 쓴다. 영어 약자 정답만 영어로 쓴다.`;

export function conceptsPrompt(a: { subject: string; material: string; mode: GameMode }): string {
  const count =
    a.mode === "quick"
      ? "핵심 개념을 3~5개 뽑는다."
      : "자료 양에 맞춰 핵심 개념을 3~20개 뽑는다. 개념 2~3개가 방 1개가 되므로, 자료가 짧으면 3~6개, 길면 많이 뽑는다.";
  return `[과목] ${a.subject || "(미입력)"}

[강의자료]
${a.material}

[할 일]
1. 학생이 외워야 할 핵심 개념을 뽑는다. ${count} 개념은 서로 겹치지 않아야 하고, 정답이 숫자·짧은 단어로 딱 떨어지는 것을 우선한다.
2. 각 개념마다 복습용 빈칸 문제를 1개 이상 만든다. 빈칸은 ____ (밑줄 4개)로 표시하고, 정답은 자료에 나온 값이다.

[출력 JSON 형식]
{
  "concepts": [{ "id": "c1", "name": "개념 이름(80자 이내)" }],
  "review": [
    { "conceptId": "c1", "prompt": "빈칸 ____ 이 들어간 문장", "answer": "정답", "units": ["무시할 단위(없으면 빈 배열)"], "explanation": "자료에 근거한 한 줄 설명" }
  ]
}`;
}

export function roomPrompt(a: {
  subject: string;
  material: string;
  theme: ThemeId;
  difficulty: Difficulty;
  index: number;
  roomCount: number;
  roomConcepts: Concept[];
  prevStory?: string;
}): string {
  const cfg = DIFFICULTY[a.difficulty];
  const realN = cfg.realClues[0] === cfg.realClues[1] ? `${cfg.realClues[0]}개` : `${cfg.realClues[0]}~${cfg.realClues[1]}개`;
  const isFinal = a.index === a.roomCount - 1;
  const isFirst = a.index === 0;
  return `[과목] ${a.subject || "(미입력)"}

[강의자료]
${a.material}

[테마] ${THEME_STYLE[a.theme]}
[세계관] 시험 전날 밤 도서관에서 잠들었다 깨어 보니 시험범위 속에 갇혔다. 아침 9시 시험 전에 탈출해야 한다. (테마에 맞게 말투만 바꾼다)

[이 방] ${a.index + 1}번째 방 / 전체 ${a.roomCount}개${isFinal ? " (최종 방: 탈출구가 있는 마지막 방으로 연출한다)" : ""}${isFirst ? " (첫 방: 튜토리얼처럼 쉽고 친절하게)" : ""}
${a.prevStory ? `[이전 방 스토리] ${a.prevStory}\n이 방은 이 이야기를 자연스럽게 이어 간다.` : ""}
[이 방에서 다룰 개념]
${a.roomConcepts.map((c) => `- (${c.id}) ${c.name}`).join("\n")}

[할 일] 위 개념들을 활용해 자물쇠 문제 하나를 만든다. 학생은 방 안의 단서 조각들을 모아 조합해서 답을 알아낸다.
- 진짜 단서 ${realN}: 이 단서들을 합쳐야만 답이 나온다. 단서 하나만으로는 답이 나오면 안 된다. 정답 값 자체를 단서에 그대로 쓰지 않는다. 강의자료의 개념을 알아야 숫자나 단어로 이어지게 만든다.
- 가짜 단서 ${cfg.fakeClues}개: 그럴듯하지만 답과 상관없는 소품(시간표, 점검표 등)이다. 자료에 없는 사실을 지어내지 않는다.
- 개념을 말하는 방식: ${WORDING[cfg.wording]}
- 단서 형식(format)은 note(쪽지), diary(일기장), chat(대화), document(문서), sms(문자), recording(녹음 받아쓰기) 중에서 단서마다 다르게 고른다.
- 자물쇠 종류(lock.type)는 정답 종류에 맞게 정한다.
  · 정답이 숫자 1~4자리 → "dial-number"
  · 정답이 숫자 2~6자리 → "keypad"
  · 정답이 영어 약자(알파벳 1~6글자, 대문자) → "dial-alpha"
  · 자료에 순서·절차가 있어 방향 순서로 낼 수 있을 때만 → "direction" (answer는 U/D/L/R 3~6글자. 진짜 단서가 각 단계의 방향을 알려 줘야 한다) 되도록 쓰지 않는다.
- 힌트(hints)는 ${Math.max(cfg.hintsPerRoom, 1)}개 이상, 뒤로 갈수록 구체적으로. 마지막 힌트도 정답 값은 직접 말하지 않는다.
- explanation: "왜 그게 답인지"를 자료에 근거해 1~2문장으로 설명한다 (학생이 정답을 열람했을 때 보여 준다).
- professorLine: 탈출에 실패했을 때 나오는 한 줄 대사. 이 방의 개념과 연결한다. 예: "자네, 아직도 ○○을 모르나?" 실제 인물은 아니고 만화 속 캐릭터의 말투다.
- 글자 수: name 24자, situation 140자, story 160자, 단서 줄 140자 이내.

[출력 JSON 형식]
{
  "name": "방 이름",
  "situation": "짧은 상황 설명. 앞 벽의 출구 문에 자물쇠가 달려 있다는 내용을 포함",
  "story": "이어지는 스토리 한 줄 (예: '${a.index + 1} / ...')",
  "lock": {
    "type": "dial-number | keypad | dial-alpha | direction",
    "question": "자물쇠가 요구하는 것을 알려 주는 한 문장 (정답을 포함하지 않는다)",
    "answer": "정답(숫자 또는 짧은 단어, 단위 없이)",
    "units": ["무시할 단위(없으면 빈 배열)"],
    "hints": ["힌트1", "힌트2", "힌트3"],
    "explanation": "왜 그게 답인지 설명"
  },
  "professorLine": "탈출 실패 시 대사",
  "realClues": [{ "format": "note", "title": "단서 제목", "lines": ["한 줄", "한 줄"] }],
  "fakeClues": [{ "format": "document", "title": "단서 제목", "lines": ["한 줄"] }]
}`;
}
