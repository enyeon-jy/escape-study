import { ROOMS } from "./config";
import type { Concept, GameMode } from "./types";

// 게임 길이: 빠른 탈출은 고정, 전체 범위 탈출은 개념 수에 맞춰 자동 계산
export function computeRoomCount(conceptCount: number, mode: GameMode): number {
  if (mode === "quick") return ROOMS.quickRooms;
  const byConcepts = Math.round(conceptCount / ROOMS.conceptsPerRoom);
  return Math.min(ROOMS.maxRooms, Math.max(ROOMS.minRooms, byConcepts));
}

export function limitMaterial(text: string, max: number): string {
  return text.length > max ? text.slice(0, max) : text;
}

// 개념을 방마다 고르게 나눈다 (방 하나에 개념 2~3개)
export function conceptsForRoom(concepts: Concept[], index: number, roomCount: number): Concept[] {
  const from = Math.floor((index * concepts.length) / roomCount);
  const to = Math.floor(((index + 1) * concepts.length) / roomCount);
  const slice = concepts.slice(from, Math.max(to, from + 1));
  return slice.length ? slice : [concepts[concepts.length - 1]];
}
