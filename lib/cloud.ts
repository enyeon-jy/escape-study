import type { GameData, GameResult } from "./types";

// Supabase 저장 요청을 서버(/api/save)로 보낸다. 키는 서버에만 있고, 여기서는 저장할 내용만 보낸다.
// 실패해도 게임은 계속되어야 하므로 절대 에러를 던지지 않고, 기다리지도 않는다 (보내고 잊기).
// 보내지 않는 것: 강의자료 원문(game.material), 이름·이메일 등 개인정보.

export function newId(): string {
  try {
    if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  } catch {
    // 아래 대체 방법 사용
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
  });
}

function send(payload: Record<string, unknown>) {
  try {
    void fetch("/api/save", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      keepalive: true,
    }).catch(() => {});
  } catch {
    // 저장이 안 돼도 게임에는 영향이 없다
  }
}

export function saveGame(game: GameData) {
  if (!game.id) return;
  send({
    kind: "game",
    id: game.id,
    subject: game.subject,
    theme: game.theme,
    difficulty: game.difficulty,
    mode: game.mode,
    roomCount: game.roomCount,
    rooms: game.rooms, // 방 JSON (material은 포함하지 않는다)
    isSample: game.isSample === true,
    codeLang: game.codeLang,
  });
}

export function saveLog(logId: string, game: GameData, r: GameResult, reviewDone: boolean) {
  if (!game.id) return;
  send({
    kind: "log",
    id: logId,
    gameId: game.id,
    success: r.success,
    elapsedSec: r.elapsedSec,
    hintsUsed: r.hintsUsed,
    revealedCount: r.revealedCount,
    roomsCleared: r.roomsCleared,
    totalRooms: r.totalRooms,
    reviewDone,
  });
}
