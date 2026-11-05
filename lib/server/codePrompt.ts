import type { CodeLang } from "../code/safe";
import { DIFFICULTY } from "../config";
import type { Concept, Difficulty, ThemeId } from "../types";

// 프로그래밍 과목의 "코드 자물쇠" 방 지시문 (서버에서만 사용). 규칙은 SYSTEM_PROMPT와 함께 적용된다.
// 정답은 AI가 아니라 브라우저가 코드를 실행해서 정하므로, AI에게는 코드가 짧고 결과가 하나로 딱 떨어지게 만들라고만 한다.

const THEME_STYLE: Record<ThemeId, string> = {
  horror: "폐교된 학교 실험실. 빨간 조명, 깜빡이는 형광등 분위기. 잔인한 표현 없이 분위기로만 무섭게.",
  isekai: "판타지 세계. 보라·청록 빛, 마법진, 퀘스트 느낌. 모니터는 마법 수정 화면이다.",
  detective: "사건 현장 사무실. 탐정 수첩 느낌. 모니터는 사무실 컴퓨터다.",
};

const LANG_NAME: Record<CodeLang, string> = { python: "파이썬", javascript: "자바스크립트" };
const LANG_PRINT: Record<CodeLang, string> = { python: "print(...)", javascript: "console.log(...)" };

export function codeRoomPrompt(a: {
  subject: string;
  material: string;
  theme: ThemeId;
  difficulty: Difficulty;
  lang: CodeLang;
  index: number;
  roomCount: number;
  roomConcepts: Concept[];
  prevStory?: string;
}): string {
  const cfg = DIFFICULTY[a.difficulty];
  const realMin = Math.max(1, cfg.realClues[0] - 1);
  const realMax = Math.max(1, cfg.realClues[1] - 1);
  const realN = realMin === realMax ? `${realMin}개` : `${realMin}~${realMax}개`;
  const isFinal = a.index === a.roomCount - 1;
  const prev = a.prevStory ? `[이전 방 스토리] ${a.prevStory}\n이 방은 이 이야기를 자연스럽게 이어 간다.\n` : "";
  return `[과목] ${a.subject || "(미입력)"}

[강의자료]
${a.material}

[테마] ${THEME_STYLE[a.theme]}
[세계관] 시험 전날 밤 도서관에서 잠들었다 깨어 보니 시험범위 속에 갇혔다. 아침 9시 시험 전에 탈출해야 한다. (테마에 맞게 말투만 바꾼다)

[이 방] ${a.index + 1}번째 방 / 전체 ${a.roomCount}개${isFinal ? " (최종 방)" : ""}. 이 방은 "코드 자물쇠 방"이다.
${prev}[이 방에서 다룰 개념]
${a.roomConcepts.map((c) => `- (${c.id}) ${c.name}`).join("\n")}

[할 일] 방 안의 컴퓨터 모니터에 ${LANG_NAME[a.lang]} 코드가 떠 있다. 학생은 코드를 읽고 실행 결과를 예측해서 출구 자물쇠를 연다. 코드 한 개와 주변 단서를 만든다.
- 이 방의 정답은 코드 실행 결과라서 자료에 그대로 없어도 된다. 대신 코드에 쓰는 문법·개념은 자료에 있어야 한다.
- 코드(code.source): ${LANG_NAME[a.lang]} 코드 5~10줄, 한 줄 60자 이내, 들여쓰기는 공백만 쓴다. JSON 문자열 안에서 줄바꿈은 \\n 으로 쓴다.
- 코드는 강의자료에 나온 문법·개념(변수, 반복문, 조건문, 함수 등)만 사용한다. 자료에 없는 문법이나 함수는 쓰지 않는다.
- 코드는 항상 같은 결과를 내고 바로 끝나야 한다. 입력 받기, 파일, 네트워크, 시간, 무작위, 가져오기(import) 등은 쓰지 않는다.
- 코드의 맨 마지막 줄에서 ${LANG_PRINT[a.lang]}으로 딱 한 값을 출력한다. 출력값은 0 이상 9999 이하의 정수 하나(또는 영어 대문자 1~6글자)여야 한다. 그 값이 자물쇠 정답이다.
- 코드 안에 정답 숫자가 그대로 나오지 않게 한다 (손으로 따라가며 계산해야 나오는 값).
- 난이도 ${cfg.label}에 맞게 반복·조건 횟수를 조절한다 (쉬움: 한두 번 반복, 어려움: 조건과 누적이 섞임).
- 코드 말고 방에 놓이는 진짜 단서 ${realN}: 코드를 어디에 쓰는지 알려 주는 쪽지·문서(예: "금고 번호는 모니터 프로그램이 마지막으로 출력하는 값이다")이다. 정답 값은 쓰지 않는다.
- 가짜 단서 ${cfg.fakeClues}개: 그럴듯하지만 답과 상관없는 소품이다.
- 단서 형식(format)은 note, diary, chat, document, sms, recording 중에서 고른다 (code는 쓰지 않는다).
- 힌트(hints)는 ${Math.max(cfg.hintsPerRoom, 1)}개 이상, 뒤로 갈수록 구체적으로. 정답 값은 직접 말하지 않는다 (예: "반복문이 몇 번 도는지 세어 봐").
- explanation: 코드를 한 줄씩 따라가며 왜 그 값이 나오는지 1~2문장.
- professorLine: 실패했을 때 나오는 한 줄 대사. 이 방의 개념과 연결한다.
- 간결하게 쓴다: 단서 하나는 1~3줄, 한 줄은 50자 이내, 힌트 하나는 60자 이내, situation 80자 이내, story 80자 이내.
- sourceQuotes: 코드에 쓴 문법·개념의 근거가 되는 강의자료 문장을 **글자 그대로** 베낀 조각 1~3개(각 10~80자).

[출력 JSON 형식]
{
  "name": "방 이름",
  "situation": "짧은 상황 설명. 모니터에 코드가 떠 있고 앞 벽의 출구 문에 자물쇠가 달려 있다는 내용 포함",
  "story": "이어지는 스토리 한 줄",
  "code": { "lang": "${a.lang}", "source": "코드(줄바꿈은 \\n)" },
  "lock": {
    "question": "코드를 실행하면 마지막에 출력되는 값을 묻는 한 문장 (정답을 포함하지 않는다)",
    "answer": "당신이 계산한 출력값 (참고용. 실제 정답은 코드를 실행해서 정한다)",
    "hints": ["힌트1", "힌트2", "힌트3"],
    "explanation": "왜 그 값이 나오는지 설명",
    "sourceQuotes": ["강의자료에서 글자 그대로 베낀 근거 조각"]
  },
  "professorLine": "탈출 실패 시 대사",
  "realClues": [{ "format": "note", "title": "단서 제목", "lines": ["한 줄"] }],
  "fakeClues": [{ "format": "document", "title": "단서 제목", "lines": ["한 줄"] }]
}`;
}
