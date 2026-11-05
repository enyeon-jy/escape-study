import type { ThemeId, ViewId } from "./types";

// 방 하나는 벽 3면(왼쪽·앞·오른쪽). 벽 그림은 테마별 1세트이고, 방마다 단서·아이템·자물쇠만 바뀐다.
// TODO(5단계): 이세계·추리 테마는 벽 그림을 따로 만든다. 지금은 공포 한 세트를 함께 쓴다.
export type WallId = "left" | "front" | "right";

export const WALL_ORDER: WallId[] = ["left", "front", "right"];
export const WALL_LABEL: Record<WallId, string> = { left: "왼쪽 벽", front: "앞 벽", right: "오른쪽 벽" };

// 벽에 바로 놓인 조사할 물건
export const WALL_SPOT_IDS = ["frame", "board", "trash"] as const;
export const SPOT_LABEL: Record<string, string> = { frame: "액자", board: "칠판", trash: "휴지통" };

export const VIEW_LABEL: Record<ViewId, string> = { shelf: "책장", desk: "책상", cabinet: "캐비닛" };
export const VIEW_IDS: ViewId[] = ["shelf", "desk", "cabinet"];

// 클로즈업 화면에서 작은 물건 3칸의 위치(SVG 좌표, 한 칸은 80×70)
export const SLOT_POS: [number, number][] = [
  [45, 95],
  [160, 95],
  [275, 95],
];

export function themeScene(theme: ThemeId) {
  // 지금은 모든 테마가 공포 벽 그림 세트를 쓴다
  void theme;
  return "horror" as const;
}
