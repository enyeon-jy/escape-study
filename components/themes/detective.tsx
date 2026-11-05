"use client";

import SpaceLayer from "./space";
import { DetectiveBoard } from "./boards";
import { WORLDS } from "@/lib/worlds";
import { DoorSpot, Hotspot, type ShapeProps, type WallProps, type ZoomArtProps } from "./common";
import { THEME_NAMES, spotLabel, viewLabel } from "@/lib/themes";

// 추리 테마: 비 오는 밤의 탐정 사무실. 세피아 톤, 나무 벽, 빨간 실로 이은 사건 보드, 블라인드 사이로 드는 빛.
const T = "detective" as const;

function Rain({ x, y, w, h, id }: { x: number; y: number; w: number; h: number; id: string }) {
  const streaks = Array.from({ length: 9 }, (_, i) => ({ x: x + 4 + ((i * 37) % (w - 8)), d: (i * 0.37) % 1.6, l: 8 + ((i * 5) % 9) }));
  return (
    <g pointerEvents="none">
      <clipPath id={id}>
        <rect x={x} y={y} width={w} height={h} />
      </clipPath>
      <g clipPath={`url(#${id})`}>
        {streaks.map((s, i) => (
          <line key={i} className="rain" style={{ animationDelay: `-${s.d}s`, ["--h" as string]: `${h}px` }} x1={s.x} y1={y - 12} x2={s.x - 2} y2={y - 12 + s.l} stroke="#cfe3ee" strokeWidth="1" opacity="0.5" />
        ))}
        {[0.2, 0.55, 0.8].map((f, i) => (
          <path key={i} d={`M${x + w * f} ${y + 6} q-1.5 ${h * 0.4} 0 ${h * 0.7}`} stroke="#cfe3ee" strokeWidth="0.8" fill="none" opacity="0.25" />
        ))}
      </g>
    </g>
  );
}

function DetBg({ wall }: { wall: string }) {
  const id = (n: string) => `${n}-${wall}`;
  return (
    <>
      <defs>
        <linearGradient id={id("wood")} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#4a3220" />
          <stop offset="0.5" stopColor="#573a25" />
          <stop offset="1" stopColor="#4a3220" />
        </linearGradient>
        <linearGradient id={id("shade")} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#1a0f08" stopOpacity="0.6" />
          <stop offset="0.5" stopColor="#1a0f08" stopOpacity="0.15" />
          <stop offset="1" stopColor="#1a0f08" stopOpacity="0.6" />
        </linearGradient>
        <linearGradient id={id("beam")} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#ffd9a0" stopOpacity="0.4" />
          <stop offset="1" stopColor="#ffd9a0" stopOpacity="0" />
        </linearGradient>
        <radialGradient id={id("lamp")} cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#ffcf7a" stopOpacity="0.45" />
          <stop offset="1" stopColor="#ffcf7a" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="400" height="250" fill="#2a1a10" />
      <rect width="400" height="205" fill={`url(#${id("wood")})`} />
      {Array.from({ length: 20 }, (_, i) => (
        <path key={i} d={`M${i * 20} 0 V205`} stroke="#2a190e" strokeWidth="1.4" />
      ))}
      {Array.from({ length: 20 }, (_, i) => (
        <path key={i} d={`M${i * 20 + 7} ${10 + ((i * 29) % 60)} q3 40 -1 90`} stroke="#6b4a30" strokeWidth="0.8" fill="none" opacity="0.5" />
      ))}
      <rect y="140" width="400" height="65" fill="#3a2516" opacity="0.55" />
      <rect y="138" width="400" height="5" fill="#6b4a30" />
      <rect y="205" width="400" height="45" fill="#1c110a" />
      <path d="M0 205 H400" stroke="#6b4a30" strokeWidth="3" />
      {Array.from({ length: 8 }, (_, i) => (
        <path key={i} d={`M${i * 60} 205 L${i * 60 - 30 + (i - 4) * 12} 250`} stroke="#120a05" strokeWidth="1.2" />
      ))}
      <rect width="400" height="250" fill={`url(#${id("shade")})`} />
      {/* 천장 램프 */}
      <path d="M200 0 V14" stroke="#1a1008" strokeWidth="2" />
      <path d="M180 22 Q200 8 220 22 Z" fill="#2e4a3a" stroke="#1a1008" />
      <ellipse className="flicker" cx="200" cy="24" rx="60" ry="30" fill={`url(#${id("lamp")})`} />
    </>
  );
}

function Wall(p: WallProps) {
  const { wall, space, views, inspected, doorOpened, onSpot, onZoom, onDoor } = p;
  const zoom = (v: (typeof views)[number]) => (views.includes(v) ? onZoom(v) : onSpot(`dead-${v}`));
  const done = (id: string) => inspected.includes(id);

  return (
    <svg className="wall-svg" viewBox="0 0 400 250" role="group" aria-label={wall}>
      <DetBg wall={wall} />
      <SpaceLayer theme={T} space={space} wall={wall} />

      {wall === "left" && (
        <>
          {/* 서류 캐비닛 */}
          <Hotspot label={viewLabel(T, "shelf")} onPress={() => zoom("shelf")}>
            <rect x="40" y="62" width="110" height="143" rx="2" fill="#4a5a4a" stroke="#2a352a" strokeWidth="2" />
            {[70, 114, 158].map((y) => (
              <g key={y}>
                <rect x="46" y={y} width="98" height="38" fill="#586a58" stroke="#2a352a" />
                <rect x="76" y={y + 8} width="38" height="14" fill="#d8cca8" stroke="#8a7e5a" />
                <path d={`M82 ${y + 15} H108`} stroke="#4a3a2a" strokeWidth="1.2" />
                <rect x="85" y={y + 26} width="32" height="5" rx="2" fill="#a89a62" />
              </g>
            ))}
            <rect x="52" y="48" width="38" height="14" fill="#d8cca8" transform="rotate(-3 70 55)" />
            <rect x="94" y="52" width="26" height="10" fill="#c4b890" />
          </Hotspot>

          {/* 액자: 탐정 면허 */}
          <Hotspot label={spotLabel(T, "frame")} done={done("frame")} mark={[262, 52]} onPress={() => onSpot("frame")}>
            <rect x="190" y="58" width="68" height="84" fill="#2a1a0e" stroke="#a8864a" strokeWidth="4" />
            <rect x="198" y="66" width="52" height="68" fill="#d8caa4" />
            <path d="M204 80 H244 M204 90 H244 M204 100 H232" stroke="#6b5a3a" strokeWidth="1.5" />
            <circle cx="224" cy="118" r="8" fill="none" stroke="#8a2a22" strokeWidth="2" />
          </Hotspot>

          {/* 블라인드 창문: 줄무늬 빛, 비 오는 유리 */}
          <g pointerEvents="none">
            <polygon points="300,44 380,44 330,205 250,205" fill={`url(#beam-${wall})`} opacity="0.55" />
            <rect x="300" y="40" width="80" height="106" fill="#1c2a36" stroke="#2a1a0e" strokeWidth="5" />
            <rect x="300" y="40" width="80" height="106" fill="#9bb4c4" opacity="0.18" />
            <Rain x={300} y={40} w={80} h={106} id={`rain-${wall}`} />
            {Array.from({ length: 8 }, (_, i) => (
              <rect key={i} x="296" y={42 + i * 7} width="88" height="4" fill="#d8caa4" opacity="0.85" />
            ))}
            <path d="M340 40 V146" stroke="#2a1a0e" strokeWidth="3" />
          </g>
          {/* 모자걸이 */}
          <g pointerEvents="none">
            <path d="M166 100 V205" stroke="#2a1a0e" strokeWidth="4" />
            <path d="M156 100 H176 M158 112 L152 106 M174 112 L180 106" stroke="#2a1a0e" strokeWidth="3" />
            <ellipse cx="166" cy="96" rx="14" ry="3" fill="#2a2420" />
            <path d="M156 96 Q166 78 176 96 Z" fill="#3a3028" />
          </g>
        </>
      )}

      {wall === "front" && (
        <>
          {/* 사건 보드: 코르크 판, 사진, 메모, 압정, 빨간 실 */}
          <Hotspot label={WORLDS[T].spaces[space].board} done={done("board")} mark={[258, 48]} onPress={() => onSpot("board")}>
            <DetectiveBoard space={space} />
          </Hotspot>

          {/* 출구: 간유리 창이 달린 사무실 문 */}
          <DoorSpot label={THEME_NAMES[T].doorLabel} opened={doorOpened} onPress={onDoor}>
            <rect x="290" y="50" width="90" height="158" fill="#0a0604" stroke="#2a1608" strokeWidth="5" />
            <rect className="exit-light" x="295" y="55" width="80" height="153" fill="#ffe2a8" opacity={doorOpened ? 0.95 : 0} />
            <g className="door-panel">
              <rect x="295" y="55" width="80" height="153" fill="#5a3a20" stroke="#2a1608" />
              <rect x="304" y="64" width="62" height="70" fill="#9bb4a0" opacity="0.6" stroke="#2a1608" strokeWidth="2" />
              <text x="335" y="92" textAnchor="middle" fontSize="8" fill="#2a1608" fontWeight="bold">
                PRIVATE
              </text>
              <text x="335" y="104" textAnchor="middle" fontSize="8" fill="#2a1608" fontWeight="bold">
                EYE
              </text>
              <path d="M310 114 H360" stroke="#2a1608" strokeWidth="1" />
              <rect x="304" y="144" width="62" height="56" fill="#4a2e18" stroke="#2a1608" />
            </g>
            {!doorOpened && (
              <g>
                <rect x="332" y="138" width="32" height="42" rx="4" fill="#a8864a" stroke="#4a3418" strokeWidth="2" />
                <circle cx="348" cy="152" r="7" fill="#2a1a0a" stroke="#d8b878" strokeWidth="1.5" />
                <path d="M348 152 L352 147" stroke="#d8b878" strokeWidth="1.5" />
                <circle cx="348" cy="168" r="3" fill="#c0221c" className="blink-dot" />
              </g>
            )}
            <rect x="300" y="32" width="70" height="14" rx="1" fill="#1a1008" stroke="#a8864a" />
            <text x="335" y="43" textAnchor="middle" fontSize="8" fill="#e0c07a" fontWeight="bold">
              OPEN
            </text>
          </DoorSpot>
        </>
      )}

      {wall === "right" && (
        <>
          {/* 낡은 책상: 타자기, 돋보기, 스탠드 */}
          <Hotspot label={viewLabel(T, "desk")} onPress={() => zoom("desk")}>
            <rect x="26" y="148" width="180" height="12" fill="#6a4426" stroke="#2a1608" />
            <rect x="32" y="160" width="14" height="48" fill="#4a2e18" />
            <rect x="186" y="160" width="14" height="48" fill="#4a2e18" />
            <rect x="50" y="160" width="132" height="36" fill="#573a22" stroke="#2a1608" />
            <rect x="58" y="166" width="54" height="24" fill="#4a2e18" stroke="#2a1608" />
            <rect x="118" y="166" width="54" height="24" fill="#4a2e18" stroke="#2a1608" />
            <circle cx="85" cy="178" r="2.5" fill="#d8b878" />
            <circle cx="145" cy="178" r="2.5" fill="#d8b878" />
            {/* 타자기 */}
            <rect x="52" y="124" width="52" height="24" rx="3" fill="#2a2a28" stroke="#5a5a52" strokeWidth="1.5" />
            <rect x="58" y="112" width="40" height="14" fill="#e8e0cc" stroke="#9a8a62" />
            <path d="M62 117 H92 M62 122 H86" stroke="#4a3a2a" strokeWidth="1" />
            {Array.from({ length: 7 }, (_, i) => (
              <circle key={i} cx={58 + i * 7} cy="138" r="2.4" fill="#8a8a82" />
            ))}
            {/* 스탠드 */}
            <path d="M170 148 V120 L150 104" stroke="#2e4a3a" strokeWidth="4" fill="none" />
            <path d="M140 104 H162 L156 94 H146 Z" fill="#2e4a3a" stroke="#1a2a20" />
            <ellipse cx="146" cy="108" rx="14" ry="5" fill="#ffcf7a" opacity="0.3" />
            {/* 돋보기 */}
            <circle cx="120" cy="140" r="8" fill="#cfe3ee" opacity="0.35" stroke="#a8864a" strokeWidth="2.5" />
            <path d="M126 146 L136 154" stroke="#4a2e18" strokeWidth="4" strokeLinecap="round" />
          </Hotspot>

          {/* 금고 */}
          <Hotspot label={viewLabel(T, "cabinet")} onPress={() => zoom("cabinet")}>
            <rect x="222" y="92" width="72" height="116" rx="3" fill="#2e3a34" stroke="#121a16" strokeWidth="3" />
            <rect x="230" y="100" width="56" height="100" rx="2" fill="#3a4a42" stroke="#1a241e" />
            <circle cx="258" cy="140" r="17" fill="#2a352e" stroke="#a8864a" strokeWidth="3" />
            <circle cx="258" cy="140" r="9" fill="#1a241e" stroke="#d8b878" strokeWidth="1.5" />
            <path d="M258 140 V128 M258 140 L266 144" stroke="#d8b878" strokeWidth="2" />
            {Array.from({ length: 12 }, (_, i) => (
              <path key={i} d={`M${258 + 14 * Math.cos((i * Math.PI) / 6)} ${140 + 14 * Math.sin((i * Math.PI) / 6)} L${258 + 17 * Math.cos((i * Math.PI) / 6)} ${140 + 17 * Math.sin((i * Math.PI) / 6)}`} stroke="#d8b878" strokeWidth="1" />
            ))}
            <rect x="276" y="168" width="6" height="18" rx="2" fill="#a8864a" />
            <text x="258" y="114" textAnchor="middle" fontSize="8" fill="#d8b878" fontWeight="bold">
              SAFE
            </text>
          </Hotspot>

          {/* 휴지통 */}
          <Hotspot label={spotLabel(T, "trash")} done={done("trash")} mark={[345, 168]} onPress={() => onSpot("trash")}>
            <path d="M312 175 H350 L345 214 H317 Z" fill="#2a2420" stroke="#6a5a42" strokeWidth="2" />
            <path d="M318 183 L344 183 M319 192 L343 192 M320 201 L342 201" stroke="#6a5a42" strokeWidth="1" />
            <circle cx="322" cy="172" r="6" fill="#e8e0cc" />
            <circle cx="336" cy="170" r="7" fill="#d8caa4" />
            <circle cx="329" cy="166" r="5" fill="#f0e8d4" />
          </Hotspot>

          {/* 벽시계 */}
          <g pointerEvents="none">
            <circle cx="338" cy="70" r="20" fill="#e8e0cc" stroke="#2a1608" strokeWidth="4" />
            <path d="M338 70 V57 M338 70 L347 76" stroke="#2a1608" strokeWidth="2" strokeLinecap="round" />
            <circle cx="338" cy="70" r="2" fill="#2a1608" />
          </g>
        </>
      )}
    </svg>
  );
}

function ZoomArt({ view }: ZoomArtProps) {
  return (
    <>
      <defs>
        <radialGradient id="dt-pool" cx="0.5" cy="0.15" r="0.85">
          <stop offset="0" stopColor="#ffcf7a" stopOpacity="0.28" />
          <stop offset="1" stopColor="#120904" stopOpacity="0.7" />
        </radialGradient>
      </defs>
      <rect width="400" height="250" fill="#1a1008" />
      {view === "shelf" && (
        <>
          <rect x="10" y="14" width="380" height="226" fill="#4a5a4a" stroke="#2a352a" strokeWidth="4" />
          <path d="M10 170 H390" stroke="#2a352a" strokeWidth="5" />
          {[24, 44, 64, 84, 104, 124, 144].map((x, i) => (
            <rect key={x} x={x * 2 + 20} y={i % 2 ? 42 : 36} width="26" height={i % 2 ? 54 : 60} fill={["#d8caa4", "#c4b484", "#e0d4b0"][i % 3]} stroke="#8a7a52" />
          ))}
        </>
      )}
      {view === "desk" && (
        <>
          <rect width="400" height="250" fill="#2a1a10" />
          <rect x="0" y="150" width="400" height="26" fill="#6a4426" stroke="#2a1608" strokeWidth="3" />
          <path d="M0 160 H400 M0 168 H400" stroke="#573a22" strokeWidth="1" />
          <rect x="30" y="176" width="340" height="64" fill="#4a2e18" />
          <circle cx="330" cy="150" r="14" fill="#cfe3ee" opacity="0.2" stroke="#a8864a" strokeWidth="3" />
        </>
      )}
      {view === "cabinet" && (
        <>
          <rect x="10" y="14" width="380" height="226" fill="#2e3a34" stroke="#121a16" strokeWidth="4" />
          <rect x="22" y="26" width="356" height="202" fill="#3a4a42" stroke="#1a241e" strokeWidth="2" />
          <path d="M22 170 H378" stroke="#1a241e" strokeWidth="4" />
          {[40, 360].map((x) => [40, 212].map((y) => <circle key={`${x}${y}`} cx={x} cy={y} r="3.5" fill="#a8864a" />))}
        </>
      )}
      <path d="M0 0 L120 250 M50 0 L170 250 M100 0 L220 250" stroke="#ffd9a0" strokeWidth="10" opacity="0.05" />
      <rect width="400" height="250" fill="url(#dt-pool)" />
    </>
  );
}

function SlotArt({ shape }: ShapeProps) {
  switch (shape) {
    case "drawer":
      return (
        <>
          <rect x="0" y="12" width="80" height="48" rx="2" fill="#5a3a20" stroke="#2a1608" strokeWidth="2" />
          <rect x="6" y="18" width="68" height="36" fill="#4a2e18" />
          <rect x="28" y="32" width="24" height="6" rx="3" fill="#d8b878" />
        </>
      );
    case "notebook":
      // 사건 파일 (마닐라 폴더)
      return (
        <>
          <path d="M6 18 H30 L36 12 H70 V62 H6 Z" fill="#d4b878" stroke="#8a6a32" strokeWidth="2" />
          <rect x="12" y="22" width="52" height="34" fill="#f0e8d4" />
          <path d="M18 30 H58 M18 38 H58 M18 46 H46" stroke="#6b5a3a" strokeWidth="1.5" opacity="0.7" />
          <rect x="44" y="40" width="22" height="12" fill="none" stroke="#b3302a" strokeWidth="1.8" transform="rotate(-10 55 46)" />
        </>
      );
    case "cup":
      return (
        <>
          <path d="M22 18 H52 L49 62 H25 Z" fill="#e8e0cc" stroke="#8a7a52" strokeWidth="2" />
          <path d="M52 28 q14 2 0 20" fill="none" stroke="#8a7a52" strokeWidth="4" />
          <ellipse cx="37" cy="19" rx="15" ry="3" fill="#4a2e18" />
        </>
      );
    case "box":
      return (
        <>
          <rect x="6" y="26" width="68" height="36" fill="#b88c58" stroke="#6a4a22" strokeWidth="2" />
          <rect x="2" y="16" width="76" height="14" fill="#c89c68" stroke="#6a4a22" strokeWidth="2" />
          <rect x="30" y="16" width="20" height="46" fill="#e8e0cc" opacity="0.55" />
          <rect x="52" y="36" width="16" height="12" fill="#f4f0e0" stroke="#8a7a52" />
        </>
      );
    case "monitor":
      // 사무실의 낡은 베이지색 모니터
      return (
        <>
          <rect x="8" y="6" width="64" height="46" rx="5" fill="#c9bb98" stroke="#6a5a38" strokeWidth="2" />
          <rect x="14" y="12" width="52" height="34" rx="2" fill="#0e1a10" />
          <path d="M18 20 H44 M18 27 H54 M18 34 H38" stroke="#ffcf6a" strokeWidth="2" opacity="0.85" />
          <circle cx="62" cy="49" r="1.8" fill="#c0221c" />
          <rect x="32" y="52" width="16" height="6" fill="#b8aa88" />
          <rect x="20" y="58" width="40" height="5" rx="2" fill="#c9bb98" stroke="#6a5a38" />
        </>
      );
    case "book":
      return (
        <>
          <rect x="14" y="6" width="52" height="58" rx="2" fill="#2e4a3a" stroke="#1a2a20" strokeWidth="2" />
          <rect x="14" y="20" width="52" height="8" fill="#d8b878" opacity="0.7" />
          <rect x="22" y="36" width="36" height="14" fill="#e8e0cc" opacity="0.8" />
        </>
      );
  }
}

const detective = { Wall, ZoomArt, SlotArt };
export default detective;
