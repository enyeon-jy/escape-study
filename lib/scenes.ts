import type { ViewId } from "./types";

// 방 하나는 벽 3면(왼쪽·앞·오른쪽). 벽 그림은 테마마다 따로 있다 (components/themes/).
// 여기에는 위치와 id만 두고, 화면에 보이는 이름은 lib/themes.ts에서 테마별로 정한다.
export type WallId = "left" | "front" | "right";

export const WALL_ORDER: WallId[] = ["left", "front", "right"];

// 벽에 바로 놓인 조사할 물건
export const WALL_SPOT_IDS = ["frame", "board", "trash"] as const;

export const VIEW_IDS: ViewId[] = ["shelf", "desk", "cabinet"];

// 클로즈업 화면에서 작은 물건 3칸의 위치(SVG 좌표, 한 칸은 80×70)
export const SLOT_POS: [number, number][] = [
  [45, 95],
  [160, 95],
  [275, 95],
];
