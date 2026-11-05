import { DIFFICULTY } from "./config";
import type { ClueSrc } from "./layout";
import { LOCK_TYPES, type LockType } from "./lock";
import type { ClueFormat, Concept, Difficulty, ReviewItem } from "./types";

// AI가 준 JSON을 코드로 검사한다. 형식이 틀렸거나 규칙을 어기면 Error를 던지고,
// 호출한 쪽(서버 API)이 딱 1번만 다시 요청한다. 정답 확인과 마찬가지로 검사도 AI가 아니라 코드가 한다.

const FORMATS: ClueFormat[] = ["note", "diary", "chat", "document", "sms", "recording"];

export const MAX_CONCEPTS = 20;

const isObj = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null && !Array.isArray(v);

function str(v: unknown, field: string, max: number, min = 1): string {
  if (typeof v !== "string") throw new Error(`${field}: 글자가 아님`);
  const t = v.trim();
  if (t.length < min || t.length > max) throw new Error(`${field}: 길이 ${t.length} (허용 ${min}~${max})`);
  return t;
}

function strList(v: unknown, field: string, maxItems: number, maxLen: number, minItems = 0): string[] {
  if (!Array.isArray(v)) throw new Error(`${field}: 목록이 아님`);
  if (v.length < minItems || v.length > maxItems) throw new Error(`${field}: 개수 ${v.length}`);
  return v.map((x, i) => str(x, `${field}[${i}]`, maxLen));
}

// 비교용으로 공백·구두점을 지우고 소문자로 만든다
const squash = (s: string) => s.normalize("NFKC").toLowerCase().replace(/[\s.,!?'"`~\-_()[\]{}:;/\\]/g, "");

// 자료에 실제로 있는 값인지 (자료에 없는 정답을 지어내는 것을 막는 안전장치)
export function inMaterial(answer: string, material: string): boolean {
  const a = squash(answer);
  return a.length > 0 && squash(material).includes(a);
}

// ── 1) 핵심 개념 + 복습 문제 ──────────────────────────────────────────

export function validateConcepts(json: unknown, material: string): { concepts: Concept[]; review: ReviewItem[] } {
  if (!isObj(json)) throw new Error("최상위가 객체가 아님");
  if (!Array.isArray(json.concepts) || json.concepts.length < 3 || json.concepts.length > MAX_CONCEPTS) {
    throw new Error("concepts 개수가 3~20개가 아님");
  }
  const concepts: Concept[] = json.concepts.map((c, i) => {
    if (!isObj(c)) throw new Error(`concepts[${i}]`);
    return { id: str(c.id, `concepts[${i}].id`, 20), name: str(c.name, `concepts[${i}].name`, 80) };
  });
  const ids = new Set(concepts.map((c) => c.id));
  if (ids.size !== concepts.length) throw new Error("개념 id가 겹침");

  if (!Array.isArray(json.review)) throw new Error("review가 목록이 아님");
  const review: ReviewItem[] = json.review.map((r, i) => {
    if (!isObj(r)) throw new Error(`review[${i}]`);
    const conceptId = str(r.conceptId, `review[${i}].conceptId`, 20);
    if (!ids.has(conceptId)) throw new Error(`review[${i}]: 없는 개념 id`);
    const prompt = str(r.prompt, `review[${i}].prompt`, 200);
    if (!prompt.includes("____")) throw new Error(`review[${i}]: 빈칸(____)이 없음`);
    const answer = str(r.answer, `review[${i}].answer`, 24);
    if (!inMaterial(answer, material)) throw new Error(`review[${i}]: 정답이 자료에 없음 (${answer})`);
    return {
      conceptId,
      prompt,
      answer,
      units: r.units === undefined ? [] : strList(r.units, `review[${i}].units`, 5, 10),
      explanation: str(r.explanation, `review[${i}].explanation`, 200),
    };
  });
  for (const c of concepts) {
    if (!review.some((r) => r.conceptId === c.id)) throw new Error(`개념 ${c.id}의 복습 문제가 없음`);
  }
  return { concepts, review };
}

// ── 2) 방 하나 ────────────────────────────────────────────────────────

// 정답 종류와 자물쇠 종류가 맞는지 (숫자 정답에 알파벳 자물쇠 등을 막는다)
export function answerFitsLock(type: LockType, answer: string): boolean {
  switch (type) {
    case "dial-number":
      return /^\d{1,4}$/.test(answer);
    case "keypad":
      return /^\d{2,6}$/.test(answer);
    case "dial-alpha":
      return /^[A-Za-z]{1,6}$/.test(answer);
    case "direction":
      return /^[UDLR]{3,6}$/i.test(answer);
  }
}

export interface RoomPayload {
  name: string;
  situation: string;
  story: string;
  lockType: LockType;
  question: string;
  answer: string;
  units: string[];
  hints: string[];
  explanation: string;
  professorLine: string;
  real: ClueSrc[];
  fake: ClueSrc[];
}

function clues(v: unknown, field: string, min: number, max: number): ClueSrc[] {
  if (!Array.isArray(v)) throw new Error(`${field}: 목록이 아님`);
  if (v.length < min || v.length > max) throw new Error(`${field}: 개수 ${v.length} (허용 ${min}~${max})`);
  return v.map((c, i) => {
    if (!isObj(c)) throw new Error(`${field}[${i}]`);
    const format = c.format as ClueFormat;
    if (!FORMATS.includes(format)) throw new Error(`${field}[${i}].format 잘못됨`);
    return { format, title: str(c.title, `${field}[${i}].title`, 30), lines: strList(c.lines, `${field}[${i}].lines`, 4, 140, 1) };
  });
}

export function validateRoom(json: unknown, difficulty: Difficulty, material: string): RoomPayload {
  if (!isObj(json)) throw new Error("최상위가 객체가 아님");
  const cfg = DIFFICULTY[difficulty];
  const lock = json.lock;
  if (!isObj(lock)) throw new Error("lock이 없음");

  const lockType = lock.type as LockType;
  if (!LOCK_TYPES.includes(lockType)) throw new Error("lock.type 잘못됨");
  const answer = str(lock.answer, "lock.answer", 12);
  if (!answerFitsLock(lockType, answer)) throw new Error(`정답(${answer})이 자물쇠 종류(${lockType})와 맞지 않음`);
  if (lockType !== "direction" && !inMaterial(answer, material)) throw new Error(`정답이 자료에 없음 (${answer})`);

  const hints = strList(lock.hints, "lock.hints", 4, 120, Math.max(1, cfg.hintsPerRoom));
  const real = clues(json.realClues, "realClues", cfg.realClues[0], cfg.realClues[1]);
  const fake = clues(json.fakeClues ?? [], "fakeClues", cfg.fakeClues, cfg.fakeClues);

  // 진짜 단서에 정답이 그대로 쓰여 있으면 안 된다 (개념을 알아야 답으로 이어져야 함)
  const text = real.map((c) => c.lines.join(" ")).join(" ");
  const a = answer.toLowerCase();
  const literal = /^\d+$/.test(a) ? new RegExp(`(^|[^0-9])${a}([^0-9]|$)`).test(text) : text.toLowerCase().includes(a);
  if (lockType !== "direction" && literal) throw new Error(`단서에 정답(${answer})이 그대로 쓰여 있음`);

  return {
    name: str(json.name, "name", 24),
    situation: str(json.situation, "situation", 140),
    story: str(json.story, "story", 160),
    lockType,
    question: str(lock.question, "lock.question", 100),
    answer: lockType === "direction" || lockType === "dial-alpha" ? answer.toUpperCase() : answer,
    units: lock.units === undefined ? [] : strList(lock.units, "lock.units", 6, 10),
    hints,
    explanation: str(lock.explanation, "lock.explanation", 220),
    professorLine: str(json.professorLine, "professorLine", 90),
    real,
    fake,
  };
}
