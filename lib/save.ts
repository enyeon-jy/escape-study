import type { GameData, GameResult, Progress } from "./types";

// 진행 상황·이미 만든 방은 브라우저(localStorage)에만 저장한다. 서버 DB는 쓰지 않는다.
const KEY = "escape-study-save-v3";

export interface Snapshot {
  screen: "escape" | "result" | "review";
  game: GameData;
  result: GameResult | null;
  progress: Progress | null;
}

export function loadSnapshot(): Snapshot | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const s = JSON.parse(raw) as Snapshot;
    if (!s?.game?.rooms || !Array.isArray(s.game.rooms) || s.game.rooms.length === 0 || !s.game.rooms[0].wallSpots) return null;
    return s;
  } catch {
    return null;
  }
}

export function saveSnapshot(s: Snapshot) {
  try {
    localStorage.setItem(KEY, JSON.stringify(s));
  } catch {
    // 저장 공간이 없거나 막혀 있어도 게임은 계속 된다
  }
}

export function clearSnapshot() {
  try {
    localStorage.removeItem(KEY);
  } catch {
    // 무시
  }
}
