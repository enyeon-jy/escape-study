"use client";

import type { KeyboardEvent, ReactNode } from "react";
import { SCENE_OBJECTS } from "@/lib/scenes";
import type { ThemeId } from "@/lib/types";

interface Props {
  theme: ThemeId;
  lockKind: "door" | "safe";
  lockOpened: boolean;
  inspected: string[];
  onObject: (id: string) => void;
  onLock: () => void;
}

interface HotspotProps {
  label: string;
  done: boolean;
  mark: [number, number];
  onPress: () => void;
  children: ReactNode;
}

// 컴포넌트 바깥에 둬야 타이머가 갱신될 때마다 화면 요소가 새로 만들어지지 않는다.
function Hotspot({ label, done, mark, onPress, children }: HotspotProps) {
  const key = (e: KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onPress();
    }
  };
  return (
    <g className={`hotspot ${done ? "done" : ""}`} role="button" tabIndex={0} onClick={onPress} onKeyDown={key} aria-label={`${label}${done ? " (조사함)" : ""}`}>
      <title>{label}</title>
      {children}
      {done && (
        <g transform={`translate(${mark[0]} ${mark[1]})`} className="check">
          <circle r="7" fill="#1f7a3d" stroke="#d9ffe6" strokeWidth="1" />
          <path d="M-3.5 0 L-1 3 L4 -3" stroke="#fff" strokeWidth="1.8" fill="none" />
        </g>
      )}
    </g>
  );
}

// 방 장면 1장 (SVG). 테마별로 1장이고, 방마다 단서가 들어 있는 물건만 바뀐다.
// TODO(2단계): 공포 테마 그림을 더 다듬고 조명 깜빡임 등 연출을 추가한다.
export default function RoomScene({ theme, lockKind, lockOpened, inspected, onObject, onLock }: Props) {
  const labels = Object.fromEntries(SCENE_OBJECTS[theme].map((o) => [o.id, o.label]));

  const hs = (id: string, mark: [number, number]) => ({
    label: labels[id],
    done: inspected.includes(id),
    mark,
    onPress: () => onObject(id),
  });

  const lockKey = (e: KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onLock();
    }
  };

  return (
    <svg className={`scene scene-${theme}`} viewBox="0 0 400 250" role="group" aria-label="방 안 장면">
      <defs>
        <linearGradient id="wall" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#2b1417" />
          <stop offset="1" stopColor="#170b0d" />
        </linearGradient>
        <linearGradient id="beam" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffb0a0" stopOpacity="0.35" />
          <stop offset="1" stopColor="#ffb0a0" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* 벽과 바닥 */}
      <rect x="0" y="0" width="400" height="250" fill="url(#wall)" />
      <rect x="0" y="205" width="400" height="45" fill="#0e0708" />
      <path d="M0 205 H400" stroke="#3a1e22" strokeWidth="2" />
      {/* 깜빡이는 형광등 빛 */}
      <rect className="flicker" x="120" y="0" width="160" height="14" rx="3" fill="#ffe3dc" />
      <polygon className="flicker" points="130,14 270,14 330,200 70,200" fill="url(#beam)" />

      {/* 책장 */}
      <Hotspot {...hs("shelf", [78, 52])}>
        <rect x="12" y="55" width="70" height="150" rx="3" fill="#3d2a1f" stroke="#6b4a36" />
        {[78, 108, 138, 168].map((y) => (
          <rect key={y} x="17" y={y} width="60" height="3" fill="#6b4a36" />
        ))}
        {[
          [20, 58, 8, 20, "#7a2b2b"],
          [30, 62, 7, 16, "#2b4a7a"],
          [40, 56, 9, 22, "#5a5a2b"],
          [24, 88, 9, 20, "#2b6a5a"],
          [36, 90, 7, 18, "#7a5a2b"],
          [50, 86, 10, 22, "#5a2b6a"],
          [22, 118, 10, 20, "#6a2b4a"],
          [60, 120, 8, 18, "#2b5a7a"],
          [28, 148, 9, 20, "#7a2b2b"],
          [44, 150, 8, 18, "#4a6a2b"],
        ].map(([x, y, w, h, c], i) => (
          <rect key={i} x={x as number} y={y as number} width={w as number} height={h as number} fill={c as string} />
        ))}
      </Hotspot>

      {/* 칠판 */}
      <Hotspot {...hs("board", [250, 28])}>
        <rect x="100" y="28" width="150" height="70" rx="3" fill="#1c3a30" stroke="#6b4a36" strokeWidth="4" />
        <path d="M112 50 H170 M112 64 H190 M112 78 H150" stroke="#cfe8dc" strokeWidth="1.5" strokeDasharray="6 3" opacity="0.6" />
        <rect x="200" y="86" width="30" height="5" fill="#d9d2c0" />
      </Hotspot>

      {/* 액자 */}
      <Hotspot {...hs("frame", [312, 33])}>
        <rect x="270" y="35" width="42" height="54" fill="#2a1d15" stroke="#8a6a3a" strokeWidth="3" />
        <rect x="277" y="42" width="28" height="40" fill="#3a3340" />
        <circle cx="291" cy="58" r="7" fill="#5a5060" />
        <path d="M279 80 q12 -16 24 0" fill="#5a5060" />
      </Hotspot>

      {/* 책상과 서랍 */}
      <Hotspot {...hs("desk", [245, 158])}>
        <rect x="95" y="160" width="150" height="10" fill="#5a3e2a" stroke="#7a5a3a" />
        <rect x="100" y="170" width="140" height="38" fill="#47301f" stroke="#6b4a36" />
        <rect x="108" y="176" width="58" height="26" fill="#3b2819" stroke="#6b4a36" />
        <rect x="174" y="176" width="58" height="26" fill="#3b2819" stroke="#6b4a36" />
        <circle cx="137" cy="189" r="3" fill="#caa86a" />
        <circle cx="203" cy="189" r="3" fill="#caa86a" />
      </Hotspot>

      {/* 컴퓨터 */}
      <Hotspot {...hs("computer", [180, 112])}>
        <rect x="125" y="118" width="55" height="38" rx="3" fill="#15171c" stroke="#40444f" strokeWidth="2" />
        <rect className="screen-glow" x="130" y="123" width="45" height="26" fill="#1c3a4a" />
        <rect x="148" y="156" width="10" height="4" fill="#40444f" />
      </Hotspot>

      {/* 휴지통 */}
      <Hotspot {...hs("trash", [304, 180])}>
        <path d="M268 188 H302 L298 226 H272 Z" fill="#3a3d44" stroke="#5a5e66" strokeWidth="2" />
        <path d="M265 188 H305" stroke="#5a5e66" strokeWidth="3" />
        <path d="M278 196 V220 M285 196 V220 M292 196 V220" stroke="#25272c" strokeWidth="1.5" />
      </Hotspot>

      {/* 자물쇠: 문 또는 금고 */}
      <g
        className={`hotspot lock-spot ${lockOpened ? "opened" : ""}`}
        role="button"
        tabIndex={0}
        onClick={onLock}
        onKeyDown={lockKey}
        aria-label={lockKind === "door" ? "잠긴 문" : "잠긴 금고"}
      >
        <title>{lockKind === "door" ? "잠긴 문" : "잠긴 금고"}</title>
        {lockKind === "door" ? (
          <>
            <rect x="328" y="62" width="62" height="150" fill="#0a0506" stroke="#6b4a36" strokeWidth="3" />
            {lockOpened && <rect x="331" y="65" width="56" height="144" fill="#fff6cf" className="exit-light" />}
            <g className="door-panel">
              <rect x="331" y="65" width="56" height="144" fill="#4a3022" stroke="#2b1a10" />
              <rect x="338" y="75" width="42" height="50" fill="#3d281b" />
              <rect x="338" y="135" width="42" height="60" fill="#3d281b" />
              <circle cx="342" cy="140" r="3" fill="#caa86a" />
            </g>
            {!lockOpened && (
              <g>
                <rect x="352" y="143" width="14" height="12" rx="2" fill="#c9a24a" stroke="#6b5420" />
                <path d="M355 143 v-6 a4 4 0 0 1 8 0 v6" fill="none" stroke="#c9a24a" strokeWidth="2.5" />
              </g>
            )}
          </>
        ) : (
          <>
            <rect x="334" y="112" width="52" height="58" rx="4" fill="#3b4048" stroke="#6a717c" strokeWidth="3" />
            {lockOpened && <rect x="338" y="116" width="44" height="50" fill="#fff6cf" className="exit-light" />}
            <g className="safe-door">
              <rect x="338" y="116" width="44" height="50" rx="2" fill="#4b525c" stroke="#2c3037" />
              <circle cx="360" cy="141" r="10" fill="#2c3037" stroke="#8d95a1" strokeWidth="2" />
              <path d="M360 133 V149 M352 141 H368" stroke="#8d95a1" strokeWidth="2" />
            </g>
            {!lockOpened && <circle cx="376" cy="124" r="2.5" fill="#d33" className="blink-dot" />}
          </>
        )}
      </g>
    </svg>
  );
}
