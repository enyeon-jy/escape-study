// 저장할 내용을 서버에서 다시 검사해 "허용한 칸만" 골라 담는다. 개인정보와 강의자료 원문이 들어갈 자리가 아예 없다.
// (클라이언트가 보낸 값은 믿지 않는다: 형식·길이·크기를 제한하고, 목록에 없는 칸은 버린다.)
import type { Difficulty, GameMode, ThemeId } from "./types";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const THEMES: ThemeId[] = ["horror", "isekai", "detective"];
const DIFFS: Difficulty[] = ["easy", "normal", "hard"];
const MODES: GameMode[] = ["quick", "full"];
export const MAX_ROOMS_JSON = 250_000; // 방 JSON 최대 크기(글자 수)

const isObj = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null && !Array.isArray(v);
const int = (v: unknown, min: number, max: number) => (typeof v === "number" && Number.isFinite(v) ? Math.min(max, Math.max(min, Math.round(v))) : null);

export interface GameRow {
  id: string;
  subject: string;
  theme: ThemeId;
  difficulty: Difficulty;
  mode: GameMode;
  room_count: number;
  rooms: unknown[];
  is_sample: boolean;
  code_lang: string | null;
  updated_at: string;
}

export interface LogRow {
  id: string;
  game_id: string;
  success: boolean;
  elapsed_sec: number;
  hints_used: number;
  revealed_count: number;
  rooms_cleared: number;
  total_rooms: number;
  review_done: boolean;
  updated_at: string;
}

export function checkGame(body: unknown): GameRow {
  if (!isObj(body)) throw new Error("형식 오류");
  const { id, subject, theme, difficulty, mode, roomCount, rooms, isSample, codeLang } = body;
  if (typeof id !== "string" || !UUID.test(id)) throw new Error("id 형식 오류");
  if (typeof subject !== "string") throw new Error("subject 형식 오류");
  if (!THEMES.includes(theme as ThemeId) || !DIFFS.includes(difficulty as Difficulty) || !MODES.includes(mode as GameMode)) throw new Error("설정값 오류");
  const count = int(roomCount, 1, 8);
  if (count === null) throw new Error("roomCount 오류");
  if (!Array.isArray(rooms) || rooms.length < 1 || rooms.length > 8 || !rooms.every(isObj)) throw new Error("rooms 형식 오류");
  if (JSON.stringify(rooms).length > MAX_ROOMS_JSON) throw new Error("rooms가 너무 큼");
  return {
    id,
    subject: subject.trim().slice(0, 60),
    theme: theme as ThemeId,
    difficulty: difficulty as Difficulty,
    mode: mode as GameMode,
    room_count: count,
    rooms,
    is_sample: isSample === true,
    code_lang: codeLang === "python" || codeLang === "javascript" ? codeLang : null,
    updated_at: new Date().toISOString(),
  };
}

export function checkLog(body: unknown): LogRow {
  if (!isObj(body)) throw new Error("형식 오류");
  const { id, gameId, success, elapsedSec, hintsUsed, revealedCount, roomsCleared, totalRooms, reviewDone } = body;
  if (typeof id !== "string" || !UUID.test(id) || typeof gameId !== "string" || !UUID.test(gameId)) throw new Error("id 형식 오류");
  const e = int(elapsedSec, 0, 86_400);
  const h = int(hintsUsed, 0, 999);
  const r = int(revealedCount, 0, 99);
  const c = int(roomsCleared, 0, 8);
  const t = int(totalRooms, 1, 8);
  if (e === null || h === null || r === null || c === null || t === null || typeof success !== "boolean") throw new Error("숫자/불리언 오류");
  return { id, game_id: gameId, success, elapsed_sec: e, hints_used: h, revealed_count: r, rooms_cleared: c, total_rooms: t, review_done: reviewDone === true, updated_at: new Date().toISOString() };
}
