import { DIFFICULTY } from "./config";
import type { ClueSrc } from "./layout";
import { LOCK_TYPES, type LockType } from "./lock";
import type { ClueFormat, Concept, Difficulty, ReviewItem } from "./types";

// AI가 준 JSON을 코드로 검사한다. 형식이 틀렸거나 규칙을 어기면 Error를 던지고,
// 호출한 쪽(서버 API)이 딱 1번만 다시 요청한다. 정답 확인과 마찬가지로 검사도 AI가 아니라 코드가 한다.

const FORMATS: ClueFormat[] = ["note", "diary", "chat", "document", "sms", "recording"];

export const MAX_CONCEPTS = 20;

export const isObj = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null && !Array.isArray(v);

export function str(v: unknown, field: string, max: number, min = 1): string {
  if (typeof v !== "string") throw new Error(`${field}: 글자가 아님`);
  const t = v.trim();
  if (t.length < min || t.length > max) throw new Error(`${field}: 길이 ${t.length} (허용 ${min}~${max})`);
  return t;
}

export function strList(v: unknown, field: string, maxItems: number, maxLen: number, minItems = 0): string[] {
  if (!Array.isArray(v)) throw new Error(`${field}: 목록이 아님`);
  if (v.length < minItems || v.length > maxItems) throw new Error(`${field}: 개수 ${v.length}`);
  return v.map((x, i) => str(x, `${field}[${i}]`, maxLen));
}

// 비교용으로 공백·구두점을 지우고 소문자로 만든다
export const squash = (s: string) => s.normalize("NFKC").toLowerCase().replace(/[\s.,!?'"`~\-_()[\]{}:;/\\]/g, "");

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
  // 문제 하나가 규칙을 어기면 그 문제만 버린다 (전체를 다시 요청하면 학교 크레딧이 낭비된다)
  const dropped: string[] = [];
  const review: ReviewItem[] = [];
  json.review.forEach((r, i) => {
    try {
      if (!isObj(r)) throw new Error("객체가 아님");
      const conceptId = str(r.conceptId, "conceptId", 20);
      if (!ids.has(conceptId)) throw new Error("없는 개념 id");
      const prompt = str(r.prompt, "prompt", 200);
      if (!prompt.includes("____")) throw new Error("빈칸(____)이 없음");
      const answer = str(r.answer, "answer", 24);
      if (!inMaterial(answer, material)) throw new Error(`정답이 자료에 없음 (${answer})`);
      review.push({
        conceptId,
        prompt,
        answer,
        units: r.units === undefined ? [] : strList(r.units, "units", 5, 10),
        explanation: str(r.explanation, "explanation", 200),
      });
    } catch (e) {
      dropped.push(`review[${i}]: ${e instanceof Error ? e.message : e}`);
    }
  });
  if (dropped.length) console.error(`[검사] 복습 문제 ${dropped.length}개 제외: ${dropped.join(" / ")}`);
  // 복습 문제가 없는 개념은 게임에서 뺀다
  const kept = concepts.filter((c) => review.some((r) => r.conceptId === c.id));
  if (kept.length < 3) throw new Error(`쓸 수 있는 개념이 ${kept.length}개뿐임 (최소 3개). 제외 사유: ${dropped.join(" / ") || "복습 문제 없음"}`);
  return { concepts: kept, review };
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
  recap?: string;
  ending?: string;
  real: ClueSrc[];
  fake: ClueSrc[];
}

export function clues(v: unknown, field: string, min: number, max: number): ClueSrc[] {
  if (!Array.isArray(v)) throw new Error(`${field}: 목록이 아님`);
  if (v.length < min || v.length > max) throw new Error(`${field}: 개수 ${v.length} (허용 ${min}~${max})`);
  return v.map((c, i) => {
    if (!isObj(c)) throw new Error(`${field}[${i}]`);
    const format = c.format as ClueFormat;
    if (!FORMATS.includes(format)) throw new Error(`${field}[${i}].format 잘못됨`);
    return { format, title: str(c.title, `${field}[${i}].title`, 30), lines: strList(c.lines, `${field}[${i}].lines`, 5, 160, 1) };
  });
}

// 탈출 후 정리 한 줄(recap)과 결말(ending)은 없거나 길이가 안 맞아도 방을 버리지 않는다 (기본 문장으로 대체)
export function optionalStory(json: Record<string, unknown>): { recap?: string; ending?: string } {
  const pick = (v: unknown, max: number, min: number) => (typeof v === "string" && v.trim().length >= min && v.trim().length <= max ? v.trim() : undefined);
  return { recap: pick(json.recap, 140, 6), ending: pick(json.ending, 220, 6) };
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

  // 자료에 없는 내용을 지어내지 않았는지: 문제의 근거를 자료에서 글자 그대로 베껴 와야 한다.
  // (정답이 "개수 세기"나 "두 수 이어 붙이기"처럼 계산된 값일 수 있어서, 정답 값 자체가 아니라 근거 문장을 확인한다)
  const quotes = strList(lock.sourceQuotes, "lock.sourceQuotes", 3, 160, 1);
  const missing = quotes.filter((q) => squash(q).length < 6 || !squash(material).includes(squash(q)));
  if (missing.length) throw new Error(`근거 문장이 자료에 그대로 없음: "${missing[0].slice(0, 40)}"`);

  const hints = strList(lock.hints, "lock.hints", 4, 160, Math.max(1, cfg.hintsPerRoom));
  const real = clues(json.realClues, "realClues", cfg.realClues[0], cfg.realClues[1]);
  const fake = clues(json.fakeClues ?? [], "fakeClues", cfg.fakeClues, cfg.fakeClues);

  // 진짜 단서에 정답이 그대로 쓰여 있으면 안 된다 (개념을 알아야 답으로 이어져야 함)
  const text = real.map((c) => c.lines.join(" ")).join(" ");
  const a = answer.toLowerCase();
  const literal = /^\d+$/.test(a) ? new RegExp(`(^|[^0-9])${a}([^0-9]|$)`).test(text) : text.toLowerCase().includes(a);
  if (lockType !== "direction" && literal) throw new Error(`단서에 정답(${answer})이 그대로 쓰여 있음`);

  return {
    name: str(json.name, "name", 30),
    situation: str(json.situation, "situation", 160),
    story: str(json.story, "story", 200),
    lockType,
    question: str(lock.question, "lock.question", 120),
    answer: lockType === "direction" || lockType === "dial-alpha" ? answer.toUpperCase() : answer,
    units: lock.units === undefined ? [] : strList(lock.units, "lock.units", 6, 10),
    hints,
    explanation: str(lock.explanation, "lock.explanation", 260),
    professorLine: str(json.professorLine, "professorLine", 100),
    ...optionalStory(json),
    real,
    fake,
  };
}
