import { AI_ERROR_MESSAGE, MATERIAL_MAX_CHARS } from "./config";
import { computeRoomCount, limitMaterial } from "./rooms";
import { SAMPLE_MATERIAL, sampleCreateGame, sampleCreateRoom } from "./sample";
import type { Concept, Difficulty, GameData, GameMode, ReviewItem, Room, ThemeId } from "./types";

// 게임과 방을 만드는 창구. 실제 AI 호출은 서버(/api/generate)가 하고, 여기서는 그 API만 부른다.
// 다시 시도(1번)와 형식 검사는 서버가 하므로 여기서는 재시도하지 않는다 (호출이 두 배로 늘지 않게).
// "예시 자료로 해 보기"의 예시 글을 그대로 쓰면 AI를 부르지 않고 예시 방을 쓴다 (학교 크레딧 절약).

export interface CreateGameOptions {
  subject: string;
  material: string;
  theme: ThemeId;
  difficulty: Difficulty;
  mode: GameMode;
  surprise: boolean;
}

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function post<T>(payload: Record<string, unknown>): Promise<T> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 58_000);
  try {
    const res = await fetch("/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: ctrl.signal,
    });
    const data = (await res.json().catch(() => null)) as (T & { error?: string }) | null;
    if (!res.ok || !data) throw new Error(data?.error ?? AI_ERROR_MESSAGE);
    return data;
  } catch (e) {
    if (e instanceof Error && e.name !== "AbortError" && e.message !== "Failed to fetch") throw e;
    throw new Error(AI_ERROR_MESSAGE);
  } finally {
    clearTimeout(timer);
  }
}

export async function createGame(o: CreateGameOptions): Promise<GameData> {
  const material = limitMaterial(o.material, MATERIAL_MAX_CHARS); // AI에는 잘린 자료만 보낸다

  if (material.trim() === SAMPLE_MATERIAL.trim()) {
    await wait(1000); // 로딩 연출
    return sampleCreateGame(o);
  }

  const { concepts, review } = await post<{ concepts: Concept[]; review: ReviewItem[] }>({
    kind: "concepts",
    subject: o.subject,
    material,
    mode: o.mode,
  });

  const game: GameData = {
    subject: o.subject.trim() || "내 강의자료",
    theme: o.theme,
    difficulty: o.difficulty,
    mode: o.mode,
    surprise: o.surprise,
    concepts,
    roomCount: computeRoomCount(concepts.length, o.mode),
    rooms: [],
    review,
    material,
  };
  game.rooms = [await createRoom(game, 0)]; // 첫 방만 먼저 만든다. 나머지는 플레이하는 동안 미리 만든다
  return game;
}

export async function createRoom(game: GameData, index: number): Promise<Room> {
  if (game.isSample) {
    await wait(300);
    return sampleCreateRoom(game, index);
  }
  const { room } = await post<{ room: Room }>({
    kind: "room",
    subject: game.subject,
    material: game.material,
    theme: game.theme,
    difficulty: game.difficulty,
    index,
    roomCount: game.roomCount,
    concepts: game.concepts,
    prevStory: game.rooms[index - 1]?.story,
  });
  return room;
}
