"use client";

import type { KeyboardEvent, ReactNode } from "react";
import { SPOT_LABEL, VIEW_LABEL, WALL_LABEL, WALL_ORDER, type WallId } from "@/lib/scenes";
import type { ViewId } from "@/lib/types";

interface Props {
  wall: WallId; // 지금 보고 있는 벽
  views: ViewId[]; // 이 방에서 클로즈업할 수 있는 물건
  inspected: string[];
  doorOpened: boolean;
  onSpot: (id: string) => void; // 벽에 놓인 작은 물건 (액자, 칠판, 휴지통)
  onZoom: (view: ViewId) => void;
  onDoor: () => void;
}

interface HotspotProps {
  label: string;
  done?: boolean;
  mark?: [number, number];
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
      {done && mark && (
        <g transform={`translate(${mark[0]} ${mark[1]})`} className="check">
          <circle r="7" fill="#1f7a3d" stroke="#d9ffe6" strokeWidth="1" />
          <path d="M-3.5 0 L-1 3 L4 -3" stroke="#fff" strokeWidth="1.8" fill="none" />
        </g>
      )}
    </g>
  );
}

// 벽 한 면. 공포 테마 그림 한 세트이고, 방마다 바뀌는 건 물건 속 내용뿐이다.
function Wall({ wall, views, inspected, doorOpened, onSpot, onZoom, onDoor }: Props) {
  const zoom = (v: ViewId) => (views.includes(v) ? onZoom(v) : onSpot(`dead-${v}`));
  const done = (id: string) => inspected.includes(id);

  return (
    <svg className="wall-svg" viewBox="0 0 400 250" role="group" aria-label={WALL_LABEL[wall]}>
      <defs>
        <linearGradient id={`wallbg-${wall}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#2b1417" />
          <stop offset="1" stopColor="#150a0c" />
        </linearGradient>
        <linearGradient id={`beam-${wall}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffb0a0" stopOpacity="0.3" />
          <stop offset="1" stopColor="#ffb0a0" stopOpacity="0" />
        </linearGradient>
        <radialGradient id={`red-${wall}`} cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#ff2a2a" stopOpacity="0.45" />
          <stop offset="1" stopColor="#ff2a2a" stopOpacity="0" />
        </radialGradient>
      </defs>

      <rect width="400" height="250" fill={`url(#wallbg-${wall})`} />
      <rect y="205" width="400" height="45" fill="#0e0708" />
      <path d="M0 205 H400" stroke="#3a1e22" strokeWidth="2" />
      {/* 천장 형광등과 약한 빛 */}
      <rect className="flicker" x="130" y="0" width="140" height="12" rx="3" fill="#ffe3dc" />
      <polygon className="flicker" points="140,12 260,12 320,205 80,205" fill={`url(#beam-${wall})`} />
      {/* 비상등 붉은 조명 */}
      <circle className="redglow" cx={wall === "left" ? 40 : 360} cy="22" r="60" fill={`url(#red-${wall})`} />
      <circle cx={wall === "left" ? 40 : 360} cy="22" r="5" fill="#ff3a3a" />

      {wall === "left" && (
        <>
          {/* 책장 → 클로즈업 */}
          <Hotspot label={VIEW_LABEL.shelf} onPress={() => zoom("shelf")}>
            <rect x="40" y="45" width="140" height="160" rx="3" fill="#3d2a1f" stroke="#6b4a36" strokeWidth="2" />
            {[85, 125, 165].map((y) => (
              <rect key={y} x="46" y={y} width="128" height="4" fill="#6b4a36" />
            ))}
            {[
              [52, 55, 12, 30, "#7a2b2b"], [68, 60, 10, 25, "#2b4a7a"], [82, 52, 14, 33, "#5a5a2b"], [102, 58, 10, 27, "#2b6a5a"],
              [56, 95, 12, 30, "#7a5a2b"], [74, 98, 10, 27, "#5a2b6a"], [118, 92, 14, 33, "#6a2b4a"],
              [60, 135, 12, 30, "#2b5a7a"], [96, 138, 10, 27, "#7a2b2b"], [130, 134, 14, 31, "#4a6a2b"],
            ].map(([x, y, w, h, c], i) => (
              <rect key={i} x={x as number} y={y as number} width={w as number} height={h as number} fill={c as string} />
            ))}
          </Hotspot>
          {/* 액자 */}
          <Hotspot label={SPOT_LABEL.frame} done={done("frame")} mark={[300, 58]} onPress={() => onSpot("frame")}>
            <rect x="230" y="60" width="64" height="80" fill="#2a1d15" stroke="#8a6a3a" strokeWidth="4" />
            <rect x="240" y="70" width="44" height="60" fill="#3a3340" />
            <circle cx="262" cy="94" r="10" fill="#5a5060" />
            <path d="M246 126 q16 -26 32 0" fill="#5a5060" />
          </Hotspot>
        </>
      )}

      {wall === "front" && (
        <>
          {/* 칠판 */}
          <Hotspot label={SPOT_LABEL.board} done={done("board")} mark={[258, 48]} onPress={() => onSpot("board")}>
            <rect x="40" y="48" width="210" height="95" rx="3" fill="#1c3a30" stroke="#6b4a36" strokeWidth="5" />
            <path d="M58 76 H150 M58 96 H190 M58 116 H130" stroke="#cfe8dc" strokeWidth="2" strokeDasharray="7 4" opacity="0.55" />
            <rect x="196" y="130" width="38" height="6" fill="#d9d2c0" />
          </Hotspot>
          {/* 출구 문 + 자물쇠 */}
          <g className={`hotspot door-spot ${doorOpened ? "opened" : ""}`} role="button" tabIndex={0} onClick={onDoor} onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && (e.preventDefault(), onDoor())} aria-label="출구 문">
            <title>출구 문</title>
            <rect x="290" y="50" width="90" height="158" fill="#0a0506" stroke="#6b4a36" strokeWidth="4" />
            <rect className="exit-light" x="295" y="55" width="80" height="153" fill="#fff6cf" opacity={doorOpened ? 0.95 : 0} />
            <g className="door-panel">
              <rect x="295" y="55" width="80" height="153" fill="#4a3022" stroke="#2b1a10" />
              <rect x="304" y="66" width="62" height="56" fill="#3d281b" />
              <rect x="304" y="132" width="62" height="66" fill="#3d281b" />
              <circle cx="306" cy="140" r="4" fill="#caa86a" />
            </g>
            <rect x="300" y="36" width="70" height="12" rx="2" fill="#0d3a1c" stroke="#2f9e56" />
            <text x="335" y="46" textAnchor="middle" fontSize="9" fill="#7dffa0" fontWeight="bold">EXIT</text>
            {!doorOpened && (
              <g>
                <rect x="330" y="140" width="34" height="38" rx="4" fill="#2a2d33" stroke="#7a808c" strokeWidth="2" />
                <circle cx="347" cy="152" r="4" fill="#d33" className="blink-dot" />
                <path d="M338 160 h18 M338 166 h18 M338 172 h18" stroke="#8d95a1" strokeWidth="2" />
              </g>
            )}
          </g>
        </>
      )}

      {wall === "right" && (
        <>
          {/* 책상 → 클로즈업 */}
          <Hotspot label={VIEW_LABEL.desk} onPress={() => zoom("desk")}>
            <rect x="30" y="150" width="170" height="12" fill="#5a3e2a" stroke="#7a5a3a" />
            <rect x="36" y="162" width="158" height="46" fill="#47301f" stroke="#6b4a36" />
            <rect x="44" y="168" width="68" height="32" fill="#3b2819" stroke="#6b4a36" />
            <rect x="118" y="168" width="68" height="32" fill="#3b2819" stroke="#6b4a36" />
            <circle cx="78" cy="184" r="3" fill="#caa86a" />
            <circle cx="152" cy="184" r="3" fill="#caa86a" />
            <rect x="60" y="118" width="55" height="32" rx="3" fill="#15171c" stroke="#40444f" strokeWidth="2" />
            <rect className="screen-glow" x="65" y="122" width="45" height="22" fill="#1c3a4a" />
          </Hotspot>
          {/* 캐비닛 → 클로즈업 */}
          <Hotspot label={VIEW_LABEL.cabinet} onPress={() => zoom("cabinet")}>
            <rect x="215" y="62" width="70" height="146" rx="3" fill="#3b4048" stroke="#6a717c" strokeWidth="3" />
            <rect x="222" y="70" width="25" height="130" fill="#4b525c" stroke="#2c3037" />
            <rect x="253" y="70" width="25" height="130" fill="#4b525c" stroke="#2c3037" />
            <rect x="240" y="120" width="3" height="18" fill="#9aa1ad" />
            <rect x="257" y="120" width="3" height="18" fill="#9aa1ad" />
          </Hotspot>
          {/* 휴지통 */}
          <Hotspot label={SPOT_LABEL.trash} done={done("trash")} mark={[345, 168]} onPress={() => onSpot("trash")}>
            <path d="M310 175 H348 L343 214 H315 Z" fill="#3a3d44" stroke="#5a5e66" strokeWidth="2" />
            <path d="M306 175 H352" stroke="#5a5e66" strokeWidth="3" />
            <path d="M322 183 V208 M329 183 V208 M336 183 V208" stroke="#25272c" strokeWidth="1.5" />
          </Hotspot>
        </>
      )}
    </svg>
  );
}

// 벽 3장을 나란히 놓고 옆으로 밀어서 "고개를 돌리는" 전환을 만든다.
export default function RoomScene(props: Props) {
  const idx = WALL_ORDER.indexOf(props.wall);
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
