import type { ComponentType } from "react";
import type { ThemeId } from "@/lib/types";
import type { ShapeProps, WallProps, ZoomArtProps } from "./common";
import horror from "./horror";
import detective from "./detective";
import isekai from "./isekai";

// 테마마다 벽 그림, 클로즈업 배경, 작은 물건 그림을 따로 가진다.
export interface ThemeArt {
  Wall: ComponentType<WallProps>;
  ZoomArt: ComponentType<ZoomArtProps>;
  SlotArt: ComponentType<ShapeProps>;
}

const ART: Record<ThemeId, ThemeArt> = {
  horror,
  detective,
  isekai,
};

export const themeArt = (t: ThemeId): ThemeArt => ART[t];
