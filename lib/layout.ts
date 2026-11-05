import { DIFFICULTY } from "./config";
import type { LockType } from "./lock";
import { WALL_SPOT_IDS } from "./scenes";
import { spaceIndex } from "./worlds";
import type { Clue, ClueFormat, Content, Difficulty, Item, Room, RoomView, Slot, SlotShape, ViewId } from "./types";

// 방의 "내용"(AI나 예시 데이터가 만든 것)을 받아서, 물건 배치(벽·클로즈업·열쇠·잠긴 칸)는 코드가 정한다.
// 배치를 코드가 하면 단서가 빠지거나 겹치는 일이 없고, AI가 줄 JSON도 짧아진다.

export interface ClueSrc {
  title: string;
  format: ClueFormat;
  lines: string[];
}

export interface RoomSpec {
  id: string;
  name: string;
  situation: string;
  story: string;
  lockType: LockType;
  question: string;
  answer: string;
  units: string[];
  hints: string[];
  explanation: string;
  conceptIds: string[];
  professorLine: string;
  recap?: string;
  ending?: string;
  real: ClueSrc[];
  fake: ClueSrc[];
  views: ViewId[]; // 클로즈업 화면 (2~3개)
  lockedSlot?: string; // 열쇠로 여는 칸 (첫 방은 없음)
  codeLang?: "python" | "javascript"; // 코드 자물쇠 방이면 real 단서 중 format "code" 하나가 모니터에 놓인다
}

// 클로즈업 화면 안 작은 물건 3칸의 종류
const SLOT_KINDS: Record<ViewId, { label: string; shape: SlotShape }[]> = {
  shelf: [
    { label: "낡은 책", shape: "book" },
    { label: "상자", shape: "box" },
    { label: "컵", shape: "cup" },
  ],
  desk: [
    { label: "서랍", shape: "drawer" },
    { label: "노트", shape: "notebook" },
    { label: "컵", shape: "cup" },
  ],
  cabinet: [
    { label: "상자", shape: "box" },
    { label: "서류철", shape: "notebook" },
    { label: "서랍", shape: "drawer" },
  ],
};

// 방 번호에 따라 클로즈업 구성과 잠긴 칸을 돌려 가며 정한다. 첫 방(0번)은 튜토리얼이라 열쇠가 없다.
export function pickViews(index: number): { views: ViewId[]; lockedSlot?: string } {
  if (index === 0) return { views: ["shelf", "desk"] };
  const k = index % 3;
  if (k === 1) return { views: ["shelf", "desk", "cabinet"], lockedSlot: "desk-0" };
  if (k === 2) return { views: ["desk", "cabinet"], lockedSlot: "cabinet-0" };
  return { views: ["shelf", "cabinet"], lockedSlot: "cabinet-0" };
}

export function layoutRoom(spec: RoomSpec, difficulty: Difficulty, index: number, roomCount: number): Room {
  const cfg = DIFFICULTY[difficulty];
  const allReal: Clue[] = spec.real.slice(0, cfg.realClues[1]).map((c, i) => ({ id: `${spec.id}-r${i}`, kind: "real", ...c }));
  // 코드 단서는 모니터 물건에 따로 놓는다 (나머지 단서와 열쇠는 기존 방식대로 배치)
  const codeClue = allReal.find((c) => c.format === "code");
  const real = allReal.filter((c) => c !== codeClue);
  const fake: Clue[] = spec.fake.slice(0, cfg.fakeClues).map((c, i) => ({ id: `${spec.id}-f${i}`, kind: "fake", ...c }));

  // 첫 방은 열쇠가 없고, 이후 방은 열쇠 1개로 잠긴 칸 하나를 연다
  const hasKey = index > 0 && !!spec.lockedSlot && real.length >= (codeClue ? 1 : 2);
  const key: Item = { id: `${spec.id}-key`, name: "열쇠", icon: "🗝️" };

  // 잠긴 칸에는 진짜 단서 하나(마지막 것)를 넣는다
  const lockedClue = hasKey ? real[real.length - 1] : null;
  const openReal = hasKey ? real.slice(0, -1) : real;

  // 나머지(진짜·가짜 단서와 열쇠)를 섞는다
  const contents: Content[] = [];
  if (hasKey) contents.push({ itemId: key.id });
  const a = [...openReal];
  const b = [...fake];
  while (a.length || b.length) {
    if (a.length) contents.push({ clueId: a.shift()!.id });
    if (b.length) contents.push({ clueId: b.shift()!.id });
  }

  const views: RoomView[] = spec.views.map((vid) => ({
    id: vid,
    slots: SLOT_KINDS[vid].map<Slot>((k, i) => {
      const id = `${vid}-${i}`;
      const locked = hasKey && id === spec.lockedSlot;
      return {
        id,
        label: k.label,
        shape: k.shape,
        content: locked && lockedClue ? { clueId: lockedClue.id } : null,
        lockedBy: locked ? key.id : undefined,
      };
    }),
  }));

  // 코드 방: 책상(없으면 첫 클로즈업)의 두 번째 칸이 컴퓨터 모니터가 되어 코드 화면이 뜬다
  let monitorId: string | null = null;
  if (codeClue) {
    const mv = views.find((v) => v.id === "desk") ?? views[0];
    const ms = mv.slots[1];
    ms.shape = "monitor";
    ms.label = "모니터";
    ms.content = { clueId: codeClue.id };
    monitorId = ms.id;
  }

  // 열쇠 없이 열려 있는 물건들에 나눠 담는다 (방마다 시작 위치를 돌려서 배치가 달라진다)
  const containers: string[] = [...WALL_SPOT_IDS, ...views.flatMap((v) => v.slots.filter((s) => !s.lockedBy && s.id !== monitorId).map((s) => s.id))];
  const n = containers.length;
  const rot = (index * 2) % n;
  const ordered = [...containers.slice(rot), ...containers.slice(0, rot)];

  const wallSpots: Record<string, Content | null> = {};
  WALL_SPOT_IDS.forEach((id) => (wallSpots[id] = null));
  contents.forEach((c, j) => {
    const target = ordered[Math.floor((j * n) / contents.length)]; // 서로 다른 물건에 들어간다
    if (target in wallSpots) wallSpots[target] = c;
    else views.forEach((v) => v.slots.forEach((s) => s.id === target && (s.content = c)));
  });

  return {
    id: spec.id,
    name: spec.name,
    situation: spec.situation,
    story: spec.story,
    wallSpots,
    views,
    items: hasKey ? [key] : [],
    clues: [...(codeClue ? [codeClue] : []), ...openReal, ...fake, ...(lockedClue ? [lockedClue] : [])],
    lock: { type: spec.lockType, answer: spec.answer, units: spec.units, hints: spec.hints, explanation: spec.explanation },
    conceptIds: spec.conceptIds,
    professorLine: spec.professorLine,
    isFinal: index === roomCount - 1,
    space: spaceIndex(index),
    ...(spec.recap ? { recap: spec.recap } : {}),
    ...(spec.ending && index === roomCount - 1 ? { ending: spec.ending } : {}),
    ...(spec.codeLang ? { codeLang: spec.codeLang } : {}),
  };
}
