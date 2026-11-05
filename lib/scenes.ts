import type { ThemeId } from "./types";

export interface SceneObject {
  id: string;
  label: string;
}

// 테마별 방 장면의 물건 목록. 방 그림은 테마마다 1장이고, 방마다 어떤 물건에 단서를 넣을지만 바뀐다.
// TODO(5단계): 이세계·추리 테마는 물건 종류와 그림을 따로 만든다. 지금은 공포 장면을 함께 쓴다.
const HORROR: SceneObject[] = [
  { id: "desk", label: "책상 서랍" },
  { id: "shelf", label: "책장" },
  { id: "frame", label: "액자" },
  { id: "trash", label: "휴지통" },
  { id: "board", label: "칠판" },
  { id: "computer", label: "컴퓨터" },
];

export const SCENE_OBJECTS: Record<ThemeId, SceneObject[]> = {
  horror: HORROR,
  isekai: HORROR,
  detective: HORROR,
};
