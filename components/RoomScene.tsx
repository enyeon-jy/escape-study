"use client";

import { WALL_ORDER } from "@/lib/scenes";
import { themeArt } from "./themes";
import type { WallProps } from "./themes/common";

// 벽 3장을 나란히 놓고 옆으로 밀어서 "고개를 돌리는" 전환을 만든다. 벽 그림은 테마마다 따로 있다.
export default function RoomScene(props: WallProps) {
  const idx = WALL_ORDER.indexOf(props.wall);
  const { Wall } = themeArt(props.theme);
  return (
    <div className="walls-viewport">
      <div className="walls-track" style={{ transform: `translateX(-${idx * 100}%)` }}>
        {WALL_ORDER.map((w) => (
          <div className="wall-cell" key={w} aria-hidden={w !== props.wall}>
            <Wall {...props} wall={w} />
          </div>
        ))}
      </div>
    </div>
  );
}
