"use client";

import { DoorSpot, Hotspot, type ShapeProps, type WallProps, type ZoomArtProps } from "./common";
import { THEME_NAMES, spotLabel, viewLabel } from "@/lib/themes";

// 공포 테마: 폐교 실험실. 금 간 타일, 곰팡이, 천장에서 떨어지는 핏방울, 붉은 비상등, 느린 형광등.
// (공포는 분위기 연출까지만. 상처나 신체 훼손 묘사는 넣지 않는다.)
const T = "horror" as const;

// 천장 얼룩에서 핏방울이 뚝뚝 떨어진다. 움직임 줄이기를 켜면 CSS에서 멈춘다.
function Drip({ x, delay, floor = 208 }: { x: number; delay: number; floor?: number }) {
  const fall = floor - 16;
  return (
    <g pointerEvents="none">
      <path d={`M${x - 11} 0 Q${x - 6} 12 ${x} 11 Q${x + 6} 12 ${x + 11} 0 Z`} fill="#3d0808" />
      <path d={`M${x - 1} 8 V30`} stroke="#5a0b0b" strokeWidth="2" strokeLinecap="round" opacity="0.8" />
      <ellipse className="drip" style={{ animationDelay: `${delay}s`, ["--fall" as string]: `${fall}px` }} cx={x} cy="16" rx="2" ry="3.4" fill="#8f1414" />
      <ellipse className="splash" style={{ animationDelay: `${delay}s` }} cx={x} cy={floor} rx="7" ry="1.8" fill="none" stroke="#7a1010" strokeWidth="1" />
    </g>
  );
}

// 벽에 번진 붉은 손자국 (그림물감처럼 번진 모양. 분위기용)
function Handprint({ x, y, s = 1, rot = -8 }: { x: number; y: number; s?: number; rot?: number }) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`} fill="#7a1010" opacity="0.7" pointerEvents="none">
      <ellipse cx="0" cy="7" rx="11" ry="12" />
      <rect x="-13" y="-12" width="5" height="19" rx="2.5" transform="rotate(-14 -10 6)" />
      <rect x="-7" y="-19" width="5" height="25" rx="2.5" transform="rotate(-4 -4 6)" />
      <rect x="0" y="-21" width="5" height="26" rx="2.5" transform="rotate(3 2 6)" />
      <rect x="7" y="-16" width="5" height="22" rx="2.5" transform="rotate(12 9 6)" />
      <rect x="-21" y="2" width="5" height="15" rx="2.5" transform="rotate(-58 -18 9)" />
      <path d="M-8 18 V44 M-1 19 V36 M6 18 V50" stroke="#7a1010" strokeWidth="2.4" strokeLinecap="round" />
    </g>
  );
}

function Skull({ x, y }: { x: number; y: number }) {
  // 교실에 있는 해골 모형
  return (
    <g transform={`translate(${x} ${y})`}>
      <path d="M0 14 C-2 -4 8 -12 18 -12 C28 -12 38 -4 36 14 C36 20 32 22 30 24 L30 30 H6 V24 C4 22 0 20 0 14 Z" fill="#cfc9b4" stroke="#8a846f" strokeWidth="1.2" />
      <ellipse cx="11" cy="12" rx="5" ry="5.5" fill="#15110f" />
      <ellipse cx="25" cy="12" rx="5" ry="5.5" fill="#15110f" />
      <path d="M18 17 L15 24 H21 Z" fill="#15110f" />
      <path d="M9 30 V25 M14 30 V25 M19 30 V25 M24 30 V25 M29 30 V25" stroke="#8a846f" strokeWidth="1.2" />
    </g>
  );
}

function Jar({ x, y, h = 34, tint = "#3d6b4f", blob = true }: { x: number; y: number; h?: number; tint?: string; blob?: boolean }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <rect x="0" y="0" width="20" height={h} rx="4" fill="#9fd4c4" fillOpacity="0.2" stroke="#7fb3a4" strokeWidth="1.3" />
      <rect x="1.5" y={h * 0.25} width="17" height={h * 0.75 - 1.5} rx="3" fill={tint} fillOpacity="0.55" />
      {blob && <ellipse cx="10" cy={h * 0.6} rx="5" ry="6" fill="#16241b" opacity="0.7" />}
      <rect x="-1" y="-4" width="22" height="5" rx="1.5" fill="#22282a" />
      <rect x="4" y={h * 0.4} width="12" height="7" fill="#d8d2bf" opacity="0.75" />
    </g>
  );
}

function HorrorBg({ wall }: { wall: string }) {
  const id = (n: string) => `${n}-${wall}`;
  return (
    <>
      <defs>
        <pattern id={id("tile")} width="26" height="26" patternUnits="userSpaceOnUse">
          <rect width="26" height="26" fill="#27393a" />
          <rect x="1" y="1" width="24" height="24" fill="#2d4143" />
          <path d="M1 1 H25" stroke="#3d5558" strokeWidth="1" />
          <path d="M0 0 H26 M0 0 V26" stroke="#121b1c" strokeWidth="1.6" />
        </pattern>
        <linearGradient id={id("dark")} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#000" stopOpacity="0.65" />
          <stop offset="0.5" stopColor="#000" stopOpacity="0.28" />
          <stop offset="1" stopColor="#000" stopOpacity="0.62" />
        </linearGradient>
        <linearGradient id={id("beam")} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#d8ffe9" stopOpacity="0.22" />
          <stop offset="1" stopColor="#d8ffe9" stopOpacity="0" />
        </linearGradient>
        <radialGradient id={id("red")} cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#ff2a2a" stopOpacity="0.5" />
          <stop offset="1" stopColor="#ff2a2a" stopOpacity="0" />
        </radialGradient>
        <radialGradient id={id("mold")} cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#0f1a0a" stopOpacity="0.85" />
          <stop offset="0.6" stopColor="#1d2c12" stopOpacity="0.45" />
          <stop offset="1" stopColor="#1d2c12" stopOpacity="0" />
        </radialGradient>
        <linearGradient id={id("floor")} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#141010" />
          <stop offset="1" stopColor="#060404" />
        </linearGradient>
      </defs>

      <rect width="400" height="250" fill="#10191a" />
      <rect width="400" height="205" fill={`url(#${id("tile")})`} />
      {/* 금 간 타일과 곰팡이 얼룩 */}
      <path d="M96 0 L102 34 L92 60 L104 96 L98 130" stroke="#0a1011" strokeWidth="1.6" fill="none" />
      <path d="M102 34 L120 44 M92 60 L78 70" stroke="#0a1011" strokeWidth="1.1" fill="none" />
      <path d="M340 70 L330 110 L346 140 L338 180" stroke="#0a1011" strokeWidth="1.5" fill="none" />
      <path d="M330 110 L312 118" stroke="#0a1011" strokeWidth="1" fill="none" />
      <ellipse cx="40" cy="190" rx="60" ry="26" fill={`url(#${id("mold")})`} />
      <ellipse cx="372" cy="30" rx="48" ry="34" fill={`url(#${id("mold")})`} />
      <ellipse cx="210" cy="200" rx="40" ry="14" fill={`url(#${id("mold")})`} />
      <rect width="400" height="205" fill={`url(#${id("dark")})`} />
      {/* 바닥 */}
      <rect y="205" width="400" height="45" fill={`url(#${id("floor")})`} />
      <path d="M0 205 H400" stroke="#3a1a1c" strokeWidth="2" />
      <path d="M0 232 H400 M60 205 L20 250 M200 205 V250 M340 205 L380 250" stroke="#1a1313" strokeWidth="1" opacity="0.7" />
      {/* 천장 형광등(느리게 약하게 깜빡임)과 빛줄기 */}
      <rect x="130" y="0" width="140" height="12" rx="3" fill="#1d2425" />
      <rect className="flicker" x="136" y="2" width="128" height="7" rx="2" fill="#e5fff0" />
      <polygon className="flicker" points="140,12 260,12 320,205 80,205" fill={`url(#${id("beam")})`} />
      {/* 빨간 비상등 */}
      <circle className="redglow" cx={wall === "left" ? 40 : 360} cy="24" r="64" fill={`url(#${id("red")})`} />
      <rect x={wall === "left" ? 33 : 353} y="16" width="14" height="14" rx="3" fill="#2a0c0c" />
      <circle className="redlamp" cx={wall === "left" ? 40 : 360} cy="23" r="5" fill="#ff3a3a" />
    </>
  );
}

function Wall(p: WallProps) {
  const { wall, views, inspected, doorOpened, onSpot, onZoom, onDoor } = p;
  const zoom = (v: (typeof views)[number]) => (views.includes(v) ? onZoom(v) : onSpot(`dead-${v}`));
  const done = (id: string) => inspected.includes(id);

  return (
    <svg className="wall-svg" viewBox="0 0 400 250" role="group" aria-label={wall}>
      <HorrorBg wall={wall} />

      {wall === "left" && (
        <>
          {/* 표본 선반: 해골 모형과 표본병 */}
          <Hotspot label={viewLabel(T, "shelf")} onPress={() => zoom("shelf")}>
            <rect x="40" y="45" width="140" height="160" rx="3" fill="#2a3436" stroke="#566468" strokeWidth="2" />
            {[85, 125, 165].map((y) => (
              <rect key={y} x="44" y={y} width="132" height="5" fill="#68777b" />
            ))}
            <Skull x={62} y={58} />
            <path d="M110 85 l6 -10 l4 10 M130 85 l8 -14 l3 14" stroke="#8a846f" strokeWidth="2" fill="none" />
            <Jar x={52} y={92} h={32} tint="#3d6b4f" />
            <Jar x={80} y={92} h={32} tint="#6b5a2f" blob={false} />
            <Jar x={112} y={90} h={34} tint="#4f3d6b" />
            <Jar x={146} y={92} h={32} tint="#3d6b4f" />
            <Jar x={56} y={132} h={32} tint="#6b3d3d" blob={false} />
            <Jar x={92} y={130} h={34} tint="#3d6b4f" />
            <rect x="126" y="140" width="40" height="25" fill="#3a2f26" stroke="#5a4a3a" />
            <path d="M132 150 H160 M132 157 H152" stroke="#8a7a62" strokeWidth="1.2" />
            <rect x="52" y="172" width="34" height="31" fill="#2d3a3c" stroke="#566468" />
            <rect x="94" y="176" width="26" height="27" fill="#33292a" stroke="#5a4a4a" />
            <rect x="128" y="172" width="40" height="31" fill="#2d3a3c" stroke="#566468" />
          </Hotspot>

          {/* 빛바랜 사진 */}
          <Hotspot label={spotLabel(T, "frame")} done={done("frame")} mark={[300, 58]} onPress={() => onSpot("frame")}>
            <rect x="226" y="62" width="66" height="82" fill="#1f1a16" stroke="#6e5a3a" strokeWidth="4" />
            <rect x="236" y="72" width="46" height="62" fill="#4a4a40" />
            <circle cx="259" cy="94" r="9" fill="#6d6d60" />
            <path d="M243 130 q16 -26 32 0" fill="#6d6d60" />
            <path d="M236 72 L282 134" stroke="#2a2a22" strokeWidth="1.3" opacity="0.8" />
          </Hotspot>

          {/* 창문: 달빛, 쇠창살, 찢어진 커튼 */}
          <g pointerEvents="none">
            <rect x="318" y="38" width="64" height="104" fill="#0b1a2a" stroke="#4a5558" strokeWidth="4" />
            <circle cx="356" cy="70" r="14" fill="#cfe0ea" opacity="0.28" />
            <path d="M350 38 V142 M318 90 H382" stroke="#3a4448" strokeWidth="3" />
            <path d="M334 38 V142 M366 38 V142" stroke="#2a3235" strokeWidth="2" opacity="0.8" />
            <path d="M318 38 C328 62 322 90 330 120 L318 142 Z" fill="#1a1416" opacity="0.8" />
            <path d="M340 52 L352 70 L346 82" stroke="#cfe0ea" strokeWidth="0.8" fill="none" opacity="0.4" />
          </g>

          {/* 바닥에 깨진 약병 조각과 흘러나온 액체 */}
          <g pointerEvents="none">
            <ellipse cx="228" cy="226" rx="26" ry="6" fill="#274b33" opacity="0.5" />
            <polygon points="214,222 222,217 224,225" fill="#a9ddc9" opacity="0.7" />
            <polygon points="236,225 246,219 244,229" fill="#a9ddc9" opacity="0.55" />
            <polygon points="226,230 232,226 234,233" fill="#7fb3a4" opacity="0.7" />
            <path d="M205 230 q8 -5 14 0" stroke="#7fb3a4" strokeWidth="1.3" fill="none" />
          </g>
          <Drip x={196} delay={0.8} />
        </>
      )}

      {wall === "front" && (
        <>
          {/* 금 간 칠판 */}
          <Hotspot label={spotLabel(T, "board")} done={done("board")} mark={[258, 48]} onPress={() => onSpot("board")}>
            <rect x="40" y="48" width="210" height="95" rx="3" fill="#14282a" stroke="#4a3d32" strokeWidth="5" />
            <path d="M58 76 H150 M58 96 H190 M58 116 H130" stroke="#cfe8dc" strokeWidth="2" strokeDasharray="7 4" opacity="0.4" />
            <path d="M150 50 L158 82 L146 104 L160 140" stroke="#050c0d" strokeWidth="1.8" fill="none" />
            <path d="M158 82 L186 90" stroke="#050c0d" strokeWidth="1.2" fill="none" />
            <circle cx="214" cy="84" r="16" stroke="#cfe8dc" strokeWidth="1.6" fill="none" opacity="0.4" />
            <rect x="196" y="132" width="38" height="6" fill="#bdb6a3" />
          </Hotspot>

          {/* 출구 철문 + 비상 도어락 */}
          <DoorSpot label={THEME_NAMES[T].doorLabel} opened={doorOpened} onPress={onDoor}>
            <rect x="290" y="50" width="90" height="158" fill="#060303" stroke="#4a3d32" strokeWidth="4" />
            <rect className="exit-light" x="295" y="55" width="80" height="153" fill="#e8f5df" opacity={doorOpened ? 0.95 : 0} />
            <g className="door-panel">
              <rect x="295" y="55" width="80" height="153" fill="#3a403f" stroke="#1a1d1d" />
              <rect x="304" y="66" width="62" height="40" fill="#2f3534" stroke="#555d5b" />
              <rect x="318" y="72" width="34" height="28" fill="#0a1214" stroke="#555d5b" />
              <path d="M318 72 L352 100 M352 72 L318 100" stroke="#555d5b" strokeWidth="0.8" />
              <rect x="304" y="116" width="62" height="82" fill="#2f3534" stroke="#555d5b" />
              <path d="M312 118 q-4 30 2 56 M356 124 q4 24 -2 44 M334 150 q-2 20 2 42" stroke="#8a4a22" strokeWidth="3" opacity="0.5" fill="none" />
              <ellipse cx="344" cy="196" rx="14" ry="5" fill="#6b3a1a" opacity="0.35" />
            </g>
            <rect x="300" y="32" width="70" height="14" rx="2" fill="#1d0c0c" stroke="#6a1c1c" />
            <text className="flicker" x="335" y="43" textAnchor="middle" fontSize="9" fill="#ff5a4a" fontWeight="bold">
              EXIT
            </text>
            {!doorOpened && (
              <g>
                <rect x="330" y="140" width="34" height="40" rx="3" fill="#1c1f20" stroke="#6a706f" strokeWidth="2" />
                <circle cx="347" cy="150" r="3.5" fill="#d33" className="blink-dot" />
                {[0, 1, 2].map((r) => [0, 1, 2].map((c) => <rect key={`${r}${c}`} x={336 + c * 9} y={158 + r * 6.5} width="6" height="4" rx="1" fill="#8d9a98" />))}
              </g>
            )}
          </DoorSpot>
          <Drip x={272} delay={0} />
          <Drip x={20} delay={2.1} />
          <ellipse cx="272" cy="212" rx="14" ry="3" fill="#3d0808" opacity="0.55" pointerEvents="none" />
        </>
      )}

      {wall === "right" && (
        <>
          {/* 녹슨 수술대 */}
          <Hotspot label={viewLabel(T, "desk")} onPress={() => zoom("desk")}>
            <ellipse cx="116" cy="62" rx="34" ry="10" fill="#1a1f20" stroke="#3a4446" />
            <path d="M116 72 V120" stroke="#3a4446" strokeWidth="3" />
            <polygon points="36,150 196,150 206,162 26,162" fill="#8c9a9a" stroke="#4a5557" strokeWidth="1.5" />
            <rect x="26" y="162" width="180" height="6" fill="#5a6465" />
            <rect x="48" y="168" width="8" height="40" fill="#4f5758" />
            <rect x="176" y="168" width="8" height="40" fill="#4f5758" />
            <rect x="48" y="192" width="136" height="5" fill="#4a5253" />
            <ellipse cx="80" cy="156" rx="12" ry="4" fill="#8a4a22" opacity="0.5" />
            <ellipse cx="160" cy="158" rx="9" ry="3" fill="#8a4a22" opacity="0.45" />
            <path d="M50 178 q-3 12 0 24 M180 180 q3 10 0 22" stroke="#8a4a22" strokeWidth="2.5" opacity="0.5" fill="none" />
            <rect x="140" y="132" width="42" height="18" rx="2" fill="#2a3234" stroke="#566468" />
            <Jar x={146} y={118} h={14} tint="#3d6b4f" blob={false} />
            <rect x="60" y="136" width="34" height="14" rx="1" fill="#cfc9b4" stroke="#8a846f" transform="rotate(-4 77 143)" />
          </Hotspot>

          {/* 약품 캐비닛 */}
          <Hotspot label={viewLabel(T, "cabinet")} onPress={() => zoom("cabinet")}>
            <rect x="215" y="62" width="70" height="146" rx="3" fill="#2f3a3c" stroke="#566468" strokeWidth="3" />
            <rect x="222" y="70" width="25" height="130" fill="#10191a" stroke="#1a2224" />
            <rect x="253" y="70" width="25" height="130" fill="#10191a" stroke="#1a2224" />
            {[88, 120, 152].map((y) => (
              <g key={y}>
                <rect x="222" y={y + 14} width="25" height="3" fill="#566468" />
                <rect x="253" y={y + 14} width="25" height="3" fill="#566468" />
                <rect x="227" y={y} width="7" height="14" rx="1.5" fill="#6aa68f" opacity="0.7" />
                <rect x="237" y={y + 3} width="6" height="11" rx="1.5" fill="#a48a5a" opacity="0.7" />
                <rect x="258" y={y + 1} width="8" height="13" rx="1.5" fill="#8a6aa6" opacity="0.65" />
                <rect x="268" y={y + 4} width="6" height="10" rx="1.5" fill="#6aa68f" opacity="0.7" />
              </g>
            ))}
            <path d="M226 74 L244 120 L232 150" stroke="#d9e8e6" strokeWidth="0.9" fill="none" opacity="0.5" />
            <rect x="248" y="124" width="3" height="18" fill="#9aa1a0" />
            <path d="M218 150 q-3 16 2 40" stroke="#8a4a22" strokeWidth="3" opacity="0.45" fill="none" />
          </Hotspot>

          {/* 깨진 약병이 든 상자 */}
          <Hotspot label={spotLabel(T, "trash")} done={done("trash")} mark={[345, 168]} onPress={() => onSpot("trash")}>
            <path d="M310 175 H348 L343 214 H315 Z" fill="#2c3234" stroke="#566468" strokeWidth="2" />
            <path d="M306 175 H352" stroke="#566468" strokeWidth="3" />
            <polygon points="316,175 320,160 324,175" fill="#a9ddc9" opacity="0.6" />
            <polygon points="330,175 336,156 340,175" fill="#7fb3a4" opacity="0.6" />
            <path d="M322 183 V208 M329 183 V208 M336 183 V208" stroke="#171b1c" strokeWidth="1.5" />
          </Hotspot>

          <Handprint x={330} y={100} s={1.5} />
          <Drip x={160} delay={1.4} />
          <Drip x={300} delay={3.1} />
        </>
      )}
    </svg>
  );
}

// 클로즈업 배경 (큰 물건 안쪽)
function ZoomArt({ view }: ZoomArtProps) {
  return (
    <>
      <defs>
        <radialGradient id="hz-pool" cx="0.5" cy="0.2" r="0.8">
          <stop offset="0" stopColor="#d8ffe9" stopOpacity="0.2" />
          <stop offset="1" stopColor="#000" stopOpacity="0.7" />
        </radialGradient>
      </defs>
      <rect width="400" height="250" fill="#0a1011" />
      {view === "shelf" && (
        <>
          <rect x="10" y="14" width="380" height="226" fill="#1d282a" stroke="#566468" strokeWidth="4" />
          <rect x="10" y="170" width="380" height="8" fill="#68777b" />
          <rect x="10" y="84" width="380" height="5" fill="#4a585b" />
          {[30, 90, 150, 230, 300, 350].map((x, i) => (
            <rect key={x} x={x} y={i % 2 ? 40 : 30} width="22" height={i % 2 ? 44 : 54} rx="4" fill="#9fd4c4" fillOpacity="0.1" stroke="#7fb3a4" strokeOpacity="0.4" />
          ))}
        </>
      )}
      {view === "desk" && (
        <>
          <rect x="0" y="0" width="400" height="250" fill="#0e1516" />
          <polygon points="0,150 400,150 400,176 0,176" fill="#8c9a9a" stroke="#4a5557" strokeWidth="3" />
          <rect x="30" y="176" width="340" height="64" fill="#3a4446" />
          <ellipse cx="90" cy="162" rx="40" ry="6" fill="#8a4a22" opacity="0.5" />
          <ellipse cx="300" cy="164" rx="30" ry="5" fill="#8a4a22" opacity="0.4" />
          <path d="M60 176 q-4 30 0 60 M330 176 q4 24 0 50" stroke="#8a4a22" strokeWidth="4" opacity="0.4" fill="none" />
        </>
      )}
      {view === "cabinet" && (
        <>
          <rect x="10" y="14" width="380" height="226" fill="#2b3638" stroke="#566468" strokeWidth="4" />
          <path d="M10 170 H390" stroke="#161d1f" strokeWidth="4" />
          <polygon points="60,14 120,14 70,240 10,240" fill="#d8ffe9" opacity="0.05" />
          {[30, 370].map((x) => [30, 220].map((y) => <circle key={`${x}${y}`} cx={x} cy={y} r="3" fill="#6a7a7e" />))}
        </>
      )}
      <rect width="400" height="250" fill="url(#hz-pool)" />
      <rect className="flicker" x="130" y="0" width="140" height="8" rx="3" fill="#e5fff0" />
    </>
  );
}

// 클로즈업 안의 작은 물건 (80×70 칸)
function SlotArt({ shape }: ShapeProps) {
  switch (shape) {
    case "drawer":
      return (
        <>
          <rect x="0" y="12" width="80" height="48" rx="3" fill="#3a3f3d" stroke="#677070" strokeWidth="2" />
          <rect x="6" y="18" width="68" height="36" fill="#2c3130" />
          <path d="M14 22 q-2 14 1 28 M60 24 q3 10 0 24" stroke="#8a4a22" strokeWidth="3" opacity="0.5" fill="none" />
          <circle cx="40" cy="36" r="5" fill="none" stroke="#8d9a98" strokeWidth="3" />
        </>
      );
    case "notebook":
      return (
        <>
          <rect x="8" y="10" width="64" height="52" rx="2" fill="#4a3a2a" stroke="#76624a" strokeWidth="2" />
          <rect x="8" y="10" width="8" height="52" fill="#2f241a" />
          <path d="M24 26 H62 M24 36 H62 M24 46 H52" stroke="#d6c7a6" strokeWidth="2" opacity="0.55" />
          <path d="M30 14 q10 16 4 36" stroke="#6a1212" strokeWidth="2" opacity="0.5" fill="none" />
        </>
      );
    case "cup":
      return (
        <>
          <path d="M22 14 H58 L54 62 H26 Z" fill="#9fd4c4" fillOpacity="0.2" stroke="#7fb3a4" strokeWidth="2" />
          <path d="M25 38 H55 L54 62 H26 Z" fill="#3d6b4f" fillOpacity="0.6" />
          <path d="M22 26 H32 M22 38 H32 M22 50 H32" stroke="#cfe8dc" strokeWidth="1.5" opacity="0.7" />
        </>
      );
    case "box":
      return (
        <>
          <rect x="22" y="18" width="36" height="46" rx="6" fill="#9fd4c4" fillOpacity="0.2" stroke="#7fb3a4" strokeWidth="2" />
          <rect x="24" y="30" width="32" height="32" rx="5" fill="#4a6b3d" fillOpacity="0.55" />
          <ellipse cx="40" cy="46" rx="8" ry="9" fill="#16241b" opacity="0.7" />
          <rect x="20" y="10" width="40" height="9" rx="2" fill="#22282a" />
        </>
      );
    case "monitor":
      // 폐교에 버려진 낡은 모니터: 깨진 유리 너머로 초록 글자가 희미하게 보인다
      return (
        <>
          <rect x="8" y="6" width="64" height="46" rx="5" fill="#2a2e2c" stroke="#566468" strokeWidth="2" />
          <rect x="14" y="12" width="52" height="34" rx="2" fill="#07140d" />
          <path d="M18 20 H44 M18 27 H54 M18 34 H38" stroke="#4aff8a" strokeWidth="2" opacity="0.7" />
          <path d="M44 12 L38 30 L50 46" stroke="#d9e8e6" strokeWidth="0.9" fill="none" opacity="0.6" />
          <rect x="32" y="52" width="16" height="6" fill="#3a403f" />
          <rect x="22" y="58" width="36" height="5" rx="2" fill="#2a2e2c" stroke="#566468" />
        </>
      );
    case "book":
      return (
        <>
          <rect x="14" y="6" width="52" height="58" rx="2" fill="#3a2f2a" stroke="#6e5a4a" strokeWidth="2" />
          <rect x="14" y="20" width="52" height="8" fill="#a48a5a" opacity="0.6" />
          <rect x="14" y="44" width="52" height="4" fill="#a48a5a" opacity="0.45" />
          <path d="M14 8 L22 18 L14 30" stroke="#0a1011" strokeWidth="2" fill="#0a1011" />
        </>
      );
  }
}

const horror = { Wall, ZoomArt, SlotArt };
export default horror;
