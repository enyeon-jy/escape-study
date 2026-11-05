import { MATERIAL_MAX_CHARS } from "./config";
import { limitMaterial } from "./rooms";
import { withRetry } from "./retry";
import { sampleCreateGame, sampleCreateRoom } from "./sample";
import type { Difficulty, GameData, GameMode, Room, ThemeId } from "./types";

// 게임과 방을 만드는 창구. 4단계에서 이 두 함수 안을 FactChat(AI) 호출로 바꾼다.
// 지금은 AI 없이 예시 데이터를 돌려주지만, 호출 방식(첫 방만 먼저 · 나머지는 나중에 · 1번 재시도)은 그대로 쓴다.

export interface CreateGameOptions {
  subject: string;
  material: string;
  theme: ThemeId;
  difficulty: Difficulty;
  mode: GameMode;
  surprise: boolean;
}

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

export async function createGame(o: CreateGameOptions): Promise<GameData> {
  const material = limitMaterial(o.material, MATERIAL_MAX_CHARS); // AI에는 잘린 자료만 보낸다
  void material; // TODO(4단계): AI에 자료를 보내 핵심 개념과 첫 방을 만든다
  return withRetry(async () => {
    await wait(1200); // 로딩 연출
    return sampleCreateGame(o);
  });
}

export async function createRoom(game: GameData, index: number): Promise<Room> {
  return withRetry(async () => {
    await wait(300);
    return sampleCreateRoom(game, index);
  });
}
