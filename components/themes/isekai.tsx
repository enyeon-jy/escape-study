"use client";

import type { ReactNode } from "react";
import { DoorSpot, Hotspot, type ShapeProps, type WallProps, type ZoomArtProps } from "./common";
import { THEME_NAMES, spotLabel, viewLabel } from "@/lib/themes";

// 이세계 테마: 현실에 없는 공간. 벽 대신 떠 있는 돌 조각과 별 하늘, 거꾸로 흐르는 폭포, 공중에 뜬 계단, 보라·청록 오로라.
const T = "isekai" as const;

// 별 위치는 계산으로 정해서 서버와 브라우저 그림이 어긋나지 않게 한다
const STARS = Array.from({ length: 46 }, (_, i) => ({
  x: (i * 83 + 17) % 400,
  y: (i * 47 + 9) % 215,
  r: 0.6 + ((i * 7) % 5) * 0.28,
  d: (i * 0.53) % 5,
}));

function Bob({ children, d = 0, amp = 4 }: { children: ReactNode; d?: number; amp?: number }) {
  return (
    <g className="float-bob" style={{ animationDelay: `-${d}s`, ["--amp" as string]: `${amp}px` }}>
      {children}
    </g>
  );
}

// 떠 있는 돌 조각 (윗면은 평평하고 아래는 뾰족하게 매달림)
function Rock({ x, y, w, h = 26 }: { x: number; y: number; w: number; h?: number }) {
  return (
    <g pointerEvents="none">
      <polygon points={`${x},${y} ${x + w},${y} ${x + w * 0.9},${y + h * 0.4} ${x + w * 0.7},${y + h * 0.7} ${x + w * 0.5},${y + h} ${x + w * 0.3},${y + h * 0.65} ${x + w * 0.1},${y + h * 0.4}`} fill="#3a3466" stroke="#6a5ca8" strokeWidth="1.2" />
      <path d={`M${x} ${y} H${x + w}`} stroke="#6af5d8" strokeWidth="1.6" opacity="0.7" />
      <path d={`M${x + w * 0.3} ${y + 4} L${x + w * 0.4} ${y + h * 0.6}`} stroke="#241f48" strokeWidth="1" />
    </g>
  );
}

function IsekaiBg({ wall }: { wall: string }) {
  const id = (n: string) => `${n}-${wall}`;
  const shift = wall === "left" ? 0 : wall === "front" ? 60 : 120;
  return (
    <>
      <defs>
        <linearGradient id={id("sky")} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#0b0824" />
          <stop offset="0.55" stopColor="#1d1250" />
          <stop offset="1" stopColor="#1b3a5a" />
        </linearGradient>
        <filter id={id("blur")} x="-20%" y="-50%" width="140%" height="200%">
          <feGaussianBlur stdDeviation="12" />
        </filter>
        <radialGradient id={id("glow")} cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#6af5d8" stopOpacity="0.35" />
          <stop offset="1" stopColor="#6af5d8" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="400" height="250" fill={`url(#${id("sky")})`} />
      {/* 오로라: 보라와 청록 빛이 천천히 일렁인다 */}
      <g filter={`url(#${id("blur")})`}>
        <path className="aurora" d={`M-40 ${70 + shift / 6} Q100 ${20 + shift / 5} 220 ${70} T460 ${50 + shift / 8} V110 Q300 130 180 100 T-40 120 Z`} fill="#6af5d8" opacity="0.28" />
        <path className="aurora aurora-b" d={`M-40 ${110} Q120 70 240 120 T460 100 V150 Q300 170 200 140 T-40 160 Z`} fill="#9a6aff" opacity="0.32" />
      </g>
      {STARS.map((s, i) => (
        <circle key={i} className="twinkle" style={{ animationDelay: `-${s.d}s` }} cx={(s.x + shift * 3) % 400} cy={s.y} r={s.r} fill={i % 5 === 0 ? "#6af5d8" : "#f0eaff"} />
      ))}
      {/* 먼 행성 */}
      <circle cx={wall === "front" ? 80 : 330} cy="60" r="22" fill="#4a3a8a" opacity="0.85" />
      <path d={`M${(wall === "front" ? 80 : 330) - 34} 66 Q${wall === "front" ? 80 : 330} 52 ${(wall === "front" ? 80 : 330) + 34} 60`} stroke="#9a8aff" strokeWidth="2" fill="none" opacity="0.7" />
      {/* 멀리 떠 있는 작은 돌 조각들 */}
      <Bob d={1} amp={3}>
        <Rock x={wall === "right" ? 30 : 300} y={wall === "left" ? 158 : 172} w={44} h={22} />
      </Bob>
      <Bob d={3} amp={3}>
        <Rock x={wall === "front" ? 6 : 350} y={196} w={34} h={18} />
      </Bob>
      <ellipse cx="200" cy="240" rx="170" ry="26" fill={`url(#${id("glow")})`} />
    </>
  );
}

function Wall(p: WallProps) {
  const { wall, views, inspected, doorOpened, onSpot, onZoom, onDoor } = p;
  const zoom = (v: (typeof views)[number]) => (views.includes(v) ? onZoom(v) : onSpot(`dead-${v}`));
  const done = (id: string) => inspected.includes(id);

  return (
    <svg className="wall-svg" viewBox="0 0 400 250" role="group" aria-label={wall}>
      <IsekaiBg wall={wall} />

      {wall === "left" && (
        <>
          {/* 떠다니는 고서대: 책들이 공중에 떠 있다 */}
          <Hotspot label={viewLabel(T, "shelf")} onPress={() => zoom("shelf")}>
            <Rock x={34} y={160} w={130} h={40} />
            <rect x="84" y="108" width="30" height="52" fill="#4a3a8a" stroke="#8a7ae0" />
            <path d="M76 108 H122 L114 94 H84 Z" fill="#6a5ac0" stroke="#a89aff" />
            <rect x="88" y="70" width="22" height="26" fill="#a82a6a" stroke="#ffb0d8" className="float-bob" style={{ animationDelay: "-1s" }} />
            <g className="float-bob" style={{ animationDelay: "-2.5s" }}>
              <rect x="46" y="96" width="26" height="30" rx="2" fill="#1a6a6a" stroke="#6af5d8" />
              <path d="M51 104 H67 M51 110 H67 M51 116 H61" stroke="#6af5d8" strokeWidth="1.2" />
            </g>
            <g className="float-bob" style={{ animationDelay: "-4s" }}>
              <rect x="128" y="88" width="28" height="32" rx="2" fill="#5a2a9a" stroke="#c0a0ff" />
              <circle cx="142" cy="104" r="6" fill="none" stroke="#ffe08a" strokeWidth="1.5" />
            </g>
            <ellipse cx="99" cy="156" rx="30" ry="5" fill="#6af5d8" opacity="0.35" />
          </Hotspot>

          {/* 별 거울 */}
          <Hotspot label={spotLabel(T, "frame")} done={done("frame")} mark={[258, 62]} onPress={() => onSpot("frame")}>
            <Bob d={2}>
              <ellipse cx="226" cy="100" rx="30" ry="40" fill="#0b0824" stroke="#c0a0ff" strokeWidth="4" />
              <ellipse cx="226" cy="100" rx="24" ry="34" fill="#2a1a6a" opacity="0.9" />
              <path d="M226 78 L230 94 L246 96 L233 105 L238 121 L226 112 L214 121 L219 105 L206 96 L222 94 Z" fill="#6af5d8" opacity="0.85" />
            </Bob>
          </Hotspot>

          {/* 거꾸로 흐르는 폭포: 아래 연못에서 하늘로 올라간다 */}
          <g pointerEvents="none">
            <Rock x={300} y={190} w={80} h={24} />
            <path d="M320 188 V20 M338 188 V10 M356 188 V26" className="waterfall-flow" stroke="#8af5ff" strokeWidth="5" strokeLinecap="round" fill="none" opacity="0.7" />
            <path d="M328 188 V16 M347 188 V30" className="waterfall-flow wf-b" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" fill="none" opacity="0.6" />
            <ellipse cx="338" cy="190" rx="34" ry="6" fill="#8af5ff" opacity="0.4" />
          </g>
        </>
      )}

      {wall === "front" && (
        <>
          {/* 룬 석판 */}
          <Hotspot label={spotLabel(T, "board")} done={done("board")} mark={[218, 50]} onPress={() => onSpot("board")}>
            <Bob d={0.5}>
              <polygon points="44,58 206,52 212,140 40,146" fill="#2f2a5a" stroke="#8a7ae0" strokeWidth="3" />
              <polygon points="52,66 198,61 202,132 50,138" fill="#1d1a3e" />
              {["ᚠ", "ᚢ", "ᚦ", "ᚨ", "ᚱ", "ᚲ", "ᚷ", "ᚹ"].map((r, i) => (
                <text key={i} className="rune-glow" x={64 + (i % 4) * 36} y={92 + Math.floor(i / 4) * 32} fontSize="22" fill="#6af5d8" fontFamily="Noto Sans Runic, serif">
                  {r}
                </text>
              ))}
            </Bob>
          </Hotspot>

          {/* 공중에 뜬 계단 */}
          <g pointerEvents="none">
            {[0, 1, 2, 3, 4].map((i) => (
              <Bob key={i} d={i * 0.9} amp={2.5}>
                <polygon points={`${236 + i * 7},${196 - i * 14} ${272 + i * 7},${196 - i * 14} ${268 + i * 7},${204 - i * 14} ${240 + i * 7},${204 - i * 14}`} fill="#4a3f88" stroke="#6af5d8" strokeWidth="1" />
              </Bob>
            ))}
          </g>

          {/* 차원의 문: 룬이 새겨진 포털 */}
          <DoorSpot label={THEME_NAMES[T].doorLabel} opened={doorOpened} onPress={onDoor}>
            <path d="M296 208 V108 Q296 52 336 52 Q376 52 376 108 V208 Z" fill="#0b0824" stroke="#c0a0ff" strokeWidth="5" />
            <path className="exit-light" d="M301 204 V108 Q301 58 336 58 Q371 58 371 108 V204 Z" fill="#e8fff8" opacity={doorOpened ? 0.95 : 0} />
            <g className="door-panel">
              <path d="M301 204 V108 Q301 58 336 58 Q371 58 371 108 V204 Z" fill="#2a1a6a" />
              <circle className="rune-spin" cx="336" cy="132" r="34" fill="none" stroke="#6af5d8" strokeWidth="2" strokeDasharray="4 5" />
              <circle cx="336" cy="132" r="24" fill="none" stroke="#c0a0ff" strokeWidth="1.5" />
              <path d="M336 108 L357 144 L315 144 Z M336 156 L357 120 L315 120 Z" fill="none" stroke="#6af5d8" strokeWidth="1.2" opacity="0.8" />
              <circle cx="336" cy="132" r="5" fill="#ffe08a" />
              {["ᚠ", "ᚦ", "ᚱ", "ᛉ"].map((r, i) => (
                <text key={i} x={336 + 40 * Math.cos((i * Math.PI) / 2 - Math.PI / 2) - 5} y={136 + 40 * Math.sin((i * Math.PI) / 2 - Math.PI / 2)} fontSize="11" fill="#ffe08a" fontFamily="Noto Sans Runic, serif">
                  {r}
                </text>
              ))}
            </g>
            <ellipse cx="336" cy="206" rx="46" ry="7" fill="#6af5d8" opacity="0.4" />
          </DoorSpot>
        </>
      )}

      {wall === "right" && (
        <>
          {/* 마법진 제단: 빛나는 마법진과 수정 */}
          <Hotspot label={viewLabel(T, "desk")} onPress={() => zoom("desk")}>
            <Rock x={26} y={158} w={170} h={42} />
            <ellipse cx="110" cy="156" rx="76" ry="14" fill="#1d1a3e" stroke="#8a7ae0" strokeWidth="2" />
            <ellipse className="rune-glow" cx="110" cy="156" rx="62" ry="10" fill="none" stroke="#6af5d8" strokeWidth="1.6" strokeDasharray="5 4" />
            <ellipse cx="110" cy="156" rx="34" ry="6" fill="none" stroke="#c0a0ff" strokeWidth="1.3" />
            <path d="M110 148 L128 160 L92 160 Z" fill="none" stroke="#ffe08a" strokeWidth="1" opacity="0.8" />
            <g className="float-bob" style={{ animationDelay: "-1.5s" }}>
              <polygon points="110,100 122,124 110,148 98,124" fill="#6af5d8" fillOpacity="0.75" stroke="#e8fff8" strokeWidth="1.5" />
              <path d="M110 100 V148 M98 124 H122" stroke="#e8fff8" strokeWidth="0.8" opacity="0.7" />
            </g>
            <ellipse cx="110" cy="154" rx="46" ry="12" fill="#6af5d8" opacity="0.2" />
          </Hotspot>

          {/* 수정 상자 */}
          <Hotspot label={viewLabel(T, "cabinet")} onPress={() => zoom("cabinet")}>
            <Bob d={2}>
              <Rock x={216} y={170} w={72} h={30} />
              <polygon points="226,170 238,110 252,170" fill="#9a6aff" fillOpacity="0.75" stroke="#e0d0ff" strokeWidth="1.5" />
              <polygon points="248,170 262,84 278,170" fill="#6af5d8" fillOpacity="0.7" stroke="#e8fff8" strokeWidth="1.5" />
              <polygon points="268,170 280,126 290,170" fill="#c08aff" fillOpacity="0.7" stroke="#f0e0ff" strokeWidth="1.5" />
              <path d="M262 84 V170 M238 110 V170" stroke="#ffffff" strokeWidth="0.8" opacity="0.5" />
            </Bob>
          </Hotspot>

          {/* 빛나는 수정 */}
          <Hotspot label={spotLabel(T, "trash")} done={done("trash")} mark={[356, 150]} onPress={() => onSpot("trash")}>
            <Bob d={3.5}>
              <Rock x={312} y={186} w={44} h={20} />
              <polygon points="324,186 332,150 340,186" fill="#6af5d8" fillOpacity="0.8" stroke="#e8fff8" strokeWidth="1.2" />
              <polygon points="338,186 346,164 352,186" fill="#9a6aff" fillOpacity="0.8" stroke="#e0d0ff" strokeWidth="1.2" />
              <ellipse cx="334" cy="184" rx="24" ry="5" fill="#6af5d8" opacity="0.4" />
            </Bob>
          </Hotspot>

          {/* 바늘이 거꾸로 도는 시계 */}
          <g pointerEvents="none">
            <circle cx="326" cy="60" r="22" fill="#1d1a3e" stroke="#ffe08a" strokeWidth="3" />
            {Array.from({ length: 12 }, (_, i) => (
              <circle key={i} cx={326 + 17 * Math.sin((i * Math.PI) / 6)} cy={60 - 17 * Math.cos((i * Math.PI) / 6)} r="1.3" fill="#ffe08a" />
            ))}
            <g className="clock-rev" style={{ transformOrigin: "326px 60px", transformBox: "view-box" }}>
              <path d="M326 60 V45" stroke="#6af5d8" strokeWidth="2" strokeLinecap="round" />
            </g>
            <g className="clock-rev slow" style={{ transformOrigin: "326px 60px", transformBox: "view-box" }}>
              <path d="M326 60 L336 66" stroke="#ffe08a" strokeWidth="2.4" strokeLinecap="round" />
            </g>
            <circle cx="326" cy="60" r="2" fill="#ffe08a" />
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
        <linearGradient id="is-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#0b0824" />
          <stop offset="1" stopColor="#24175a" />
        </linearGradient>
        <radialGradient id="is-glow" cx="0.5" cy="0.9" r="0.7">
          <stop offset="0" stopColor="#6af5d8" stopOpacity="0.25" />
          <stop offset="1" stopColor="#6af5d8" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="400" height="250" fill="url(#is-sky)" />
      {STARS.slice(0, 30).map((s, i) => (
        <circle key={i} className="twinkle" style={{ animationDelay: `-${s.d}s` }} cx={s.x} cy={(s.y * 1.1) % 240} r={s.r} fill="#f0eaff" />
      ))}
      {view === "shelf" && (
        <>
          <polygon points="10,176 390,176 360,236 240,246 160,226 60,240" fill="#3a3466" stroke="#6a5ca8" strokeWidth="3" />
          <path d="M10 176 H390" stroke="#6af5d8" strokeWidth="2" opacity="0.7" />
          {[40, 120, 220, 310].map((x, i) => (
            <g key={x} className="float-bob" style={{ animationDelay: `-${i * 1.3}s` }}>
              <rect x={x} y={40 + (i % 2) * 24} width="34" height="42" rx="3" fill={["#a82a6a", "#1a6a6a", "#5a2a9a", "#4a3a8a"][i]} stroke="#e0d0ff" strokeOpacity="0.6" />
              <path d={`M${x + 6} ${52 + (i % 2) * 24} H${x + 28} M${x + 6} ${60 + (i % 2) * 24} H${x + 28}`} stroke="#e0d0ff" strokeOpacity="0.6" />
            </g>
          ))}
        </>
      )}
      {view === "desk" && (
        <>
          <polygon points="0,150 400,150 400,176 0,176" fill="#2f2a5a" stroke="#8a7ae0" strokeWidth="3" />
          <ellipse cx="200" cy="160" rx="180" ry="10" fill="none" stroke="#6af5d8" strokeWidth="1.6" strokeDasharray="6 5" className="rune-glow" />
          <ellipse cx="200" cy="160" rx="110" ry="6" fill="none" stroke="#c0a0ff" strokeWidth="1.2" />
          <rect x="30" y="176" width="340" height="64" fill="#241f48" />
        </>
      )}
      {view === "cabinet" && (
        <>
          <polygon points="10,240 60,60 110,200 170,30 230,190 290,50 340,200 390,70 390,240" fill="#2a1f66" stroke="#8a7ae0" strokeWidth="2" />
          <polygon points="60,60 85,150 40,150" fill="#9a6aff" fillOpacity="0.5" />
          <polygon points="170,30 200,130 140,130" fill="#6af5d8" fillOpacity="0.45" />
          <polygon points="290,50 320,150 260,150" fill="#c08aff" fillOpacity="0.5" />
          <path d="M10 176 H390" stroke="#6af5d8" strokeWidth="2" opacity="0.5" />
        </>
      )}
      <rect width="400" height="250" fill="url(#is-glow)" />
    </>
  );
}

function SlotArt({ shape }: ShapeProps) {
  switch (shape) {
    case "drawer":
      // 봉인 상자
      return (
        <>
          <rect x="4" y="22" width="72" height="38" rx="3" fill="#3a3466" stroke="#8a7ae0" strokeWidth="2" />
          <path d="M4 34 H76" stroke="#8a7ae0" />
          <circle cx="40" cy="42" r="7" fill="#1d1a3e" stroke="#6af5d8" strokeWidth="1.5" />
          <path d="M40 37 V47 M35 42 H45" stroke="#6af5d8" />
        </>
      );
    case "notebook":
      // 두루마리
      return (
        <>
          <rect x="12" y="14" width="56" height="44" fill="#e8d8a8" stroke="#a8884a" strokeWidth="1.5" />
          <rect x="8" y="10" width="64" height="8" rx="4" fill="#c8a868" stroke="#8a6a32" />
          <rect x="8" y="54" width="64" height="8" rx="4" fill="#c8a868" stroke="#8a6a32" />
          <text x="22" y="40" fontSize="13" fill="#5a2a9a" fontFamily="Noto Sans Runic, serif">
            ᚠᚢᚦᚨᚱ
          </text>
        </>
      );
    case "cup":
      // 물약병
      return (
        <>
          <path d="M32 10 H48 V22 L60 52 Q62 62 52 62 H28 Q18 62 20 52 L32 22 Z" fill="#6af5d8" fillOpacity="0.3" stroke="#a8fff0" strokeWidth="2" />
          <path d="M24 46 H56 L58 52 Q60 60 52 60 H28 Q20 60 22 52 Z" fill="#9a6aff" fillOpacity="0.8" />
          <rect x="31" y="4" width="18" height="8" rx="2" fill="#a8884a" />
        </>
      );
    case "box":
      // 수정함
      return (
        <>
          <polygon points="40,6 66,26 60,62 20,62 14,26" fill="#9a6aff" fillOpacity="0.55" stroke="#e0d0ff" strokeWidth="2" />
          <path d="M40 6 V62 M14 26 L66 26" stroke="#e8fff8" strokeWidth="1" opacity="0.6" />
        </>
      );
    case "book":
      // 마법서
      return (
        <>
          <rect x="14" y="6" width="52" height="58" rx="3" fill="#4a1a8a" stroke="#c0a0ff" strokeWidth="2" />
          <circle cx="40" cy="34" r="12" fill="none" stroke="#ffe08a" strokeWidth="1.8" />
          <path d="M40 22 L46 40 L32 28 H48 L34 40 Z" fill="none" stroke="#ffe08a" strokeWidth="1" />
          <rect x="14" y="52" width="52" height="4" fill="#c0a0ff" opacity="0.4" />
        </>
      );
  }
}

const isekai = { Wall, ZoomArt, SlotArt };
export default isekai;
