import { checkSource, normalizeSource, type CodeLang } from "./code/safe";
import { DIFFICULTY } from "./config";
import type { ClueSrc } from "./layout";
import type { Difficulty } from "./types";
import { clues, isObj, squash, str, strList } from "./validate";

// 프로그래밍 과목의 "코드 자물쇠" 방: AI 응답 검사.
// AI는 코드와 주변 단서만 만든다. 정답(claimedAnswer)은 믿지 않고, 브라우저가 코드를 실제로 실행해서 정한다.
export interface CodeRoomPayload {
  name: string;
  situation: string;
  story: string;
  professorLine: string;
  lang: CodeLang;
  source: string; // 모니터에 뜨는 코드 (5~10줄)
  question: string;
  claimedAnswer: string; // AI가 말한 값 (실행 결과와 비교용일 뿐)
  hints: string[];
  explanation: string;
  real: ClueSrc[]; // 코드 말고 방에 놓일 진짜 단서 (난이도의 진짜 단서 수 - 1개)
  fake: ClueSrc[];
}

// 단서 글에 정답이 그대로 쓰여 있는지 (코드 방은 실행 결과로 정답이 정해진 뒤에 확인한다)
export function cluesSayAnswer(real: ClueSrc[], answer: string): boolean {
  const text = real.map((c) => c.lines.join(" ")).join(" ");
  const a = answer.trim().toLowerCase();
  if (!a) return false;
  return /^\d+$/.test(a) ? new RegExp(`(^|[^0-9])${a}([^0-9]|$)`).test(text) : text.toLowerCase().includes(a);
}

export function validateCodeRoom(json: unknown, difficulty: Difficulty, material: string, lang: CodeLang): CodeRoomPayload {
  if (!isObj(json)) throw new Error("최상위가 객체가 아님");
  const cfg = DIFFICULTY[difficulty];
  const code = json.code;
  const lock = json.lock;
  if (!isObj(code)) throw new Error("code가 없음");
  if (!isObj(lock)) throw new Error("lock이 없음");
  if (code.lang !== lang) throw new Error(`code.lang이 ${lang}이 아님`);
  const bad = checkSource(lang, code.source);
  if (bad) throw new Error(`코드 검사 탈락: ${bad}`);

  // 코드에 쓰인 개념도 자료에 근거가 있어야 한다
  const quotes = strList(lock.sourceQuotes, "lock.sourceQuotes", 3, 160, 1);
  const missing = quotes.filter((q) => squash(q).length < 6 || !squash(material).includes(squash(q)));
  if (missing.length) throw new Error(`근거 문장이 자료에 그대로 없음: "${missing[0].slice(0, 40)}"`);

  const hints = strList(lock.hints, "lock.hints", 4, 160, Math.max(1, cfg.hintsPerRoom));
  const real = clues(json.realClues, "realClues", Math.max(1, cfg.realClues[0] - 1), Math.max(1, cfg.realClues[1] - 1));
  const fake = clues(json.fakeClues ?? [], "fakeClues", cfg.fakeClues, cfg.fakeClues);

  return {
    name: str(json.name, "name", 30),
    situation: str(json.situation, "situation", 160),
    story: str(json.story, "story", 200),
    professorLine: str(json.professorLine, "professorLine", 100),
    lang,
    source: normalizeSource(code.source as string),
    question: str(lock.question, "lock.question", 120),
    claimedAnswer: str(lock.answer, "lock.answer", 12),
    hints,
    explanation: str(lock.explanation, "lock.explanation", 260),
    real,
    fake,
  };
}
