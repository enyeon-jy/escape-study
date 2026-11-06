"use client";

import type { KeyboardEvent, ReactNode } from "react";
import type { WallId } from "@/lib/scenes";
import type { SlotShape, ThemeId, ViewId } from "@/lib/types";

// 세 테마의 벽 그림이 같은 모양으로 받는 값. 게임 구조는 같고 그림만 다르다.
export interface WallProps {
  theme: ThemeId;
  wall: WallId; // 이 벽
  space: number; // 방의 공간 번호 (0~3, 방 순서대로 돌아감)
  views: ViewId[]; // 이 방에서 클로즈업할 수 있는 물건
  inspected: string[];
  doorOpened: boolean;
  onSpot: (id: string) => void; // 벽에 놓인 작은 물건 (frame, board, trash)
  onZoom: (view: ViewId) => void;
  onDoor: () => void;
}

export interface ZoomArtProps {
  view: ViewId;
}

export interface ShapeProps {
  shape: SlotShape;
}

interface HotspotProps {
  label: string;
  done?: boolean;
  mark?: [number, number];
  onPress: () => void;
  children: ReactNode;
}

function onKey(press: () => void) {
  return (e: KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      press();
    }
  };
}

// 컴포넌트 바깥에 둬야 타이머가 갱신될 때마다 화면 요소가 새로 만들어지지 않는다.
export function Hotspot({ label, done, mark, onPress, children }: HotspotProps) {
  return (
    <g className={`hotspot ${done ? "done" : ""}`} role="button" tabIndex={0} onClick={onPress} onKeyDown={onKey(onPress)} aria-label={`${label}${done ? " (조사함)" : ""}`}>
      <title>{label}</title>
      {children}
      {done && mark && <Check x={mark[0]} y={mark[1]} />}
    </g>
  );
}

export function Check({ x, y, r = 7 }: { x: number; y: number; r?: number }) {
  return (
    <g transform={`translate(${x} ${y})`} className="check">
      <circle r={r} fill="#1f7a3d" stroke="#d9ffe6" strokeWidth="1" />
      <path d="M-3.5 0 L-1 3 L4 -3" stroke="#fff" strokeWidth="1.8" fill="none" />
    </g>
  );
}

export function DoorSpot({ label, opened, onPress, children }: { label: string; opened: boolean; onPress: () => void; children: ReactNode }) {
  return (
    <g className={`hotspot door-spot ${opened ? "opened" : ""}`} role="button" tabIndex={0} onClick={onPress} onKeyDown={onKey(onPress)} aria-label={label}>
      <title>{label}</title>
      {/* 눈에 안 보이는 넓은 클릭 영역: 모바일에서 손가락으로 쉽게 누르도록 문보다 크게 잡는다 */}
      <rect className="door-hit" x="274" y="26" width="122" height="192" fill="transparent" />
      {children}
      {opened && <rect className="door-cue" x="286" y="46" width="98" height="166" rx="6" fill="none" strokeWidth="3" pointerEvents="none" />}
    </g>
  );
}
