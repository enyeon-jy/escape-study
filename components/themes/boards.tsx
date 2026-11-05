"use client";

import type { ReactNode } from "react";

// 앞 벽의 대표 소품(조사할 수 있는 "board" 자리). 공간마다 모양이 다르다.
// 위치와 크기는 테마별 앞 벽 배치에 맞춰져 있다.

function Bob({ children, d = 0.5 }: { children: ReactNode; d?: number }) {
  return (
    <g className="float-bob" style={{ animationDelay: `-${d}s`, ["--amp" as string]: "4px" }}>
      {children}
    </g>
  );
}

// ── 공포 (x 40~250, y 48~143) ────────────────────────────────────────
export function HorrorBoard({ space }: { space: number }) {
  switch (space) {
    case 1: // 과학실: 실험 수칙 게시판 (주기율표 모양 칸과 경고 표지)
      return (
        <>
          <rect x="40" y="48" width="210" height="95" rx="3" fill="#16241d" stroke="#4a5a4a" strokeWidth="5" />
          {Array.from({ length: 27 }, (_, i) => {
            const c = i % 9;
            const r = Math.floor(i / 9);
            return <rect key={i} x={50 + c * 17} y={58 + r * 16} width="14" height="12" fill={["#2f6a4a", "#6a5a2a", "#2a4a6a"][(c + r) % 3]} opacity="0.8" stroke="#0a120e" />;
          })}
          <polygon points="214,110 232,110 223,92" fill="#c8a82a" stroke="#1a1a14" strokeWidth="2" />
          <text x="223" y="108" textAnchor="middle" fontSize="11" fontWeight="bold" fill="#1a1a14">
            !
          </text>
          <rect x="50" y="112" width="140" height="22" fill="#cfd4c4" opacity="0.8" />
          <path d="M56 119 H180 M56 127 H150" stroke="#2a3a2a" strokeWidth="1.5" />
        </>
      );
    case 2: // 끝없는 복도: 녹슨 사물함 줄
      return (
        <>
          {Array.from({ length: 8 }, (_, i) => (
            <g key={i}>
              <rect x={40 + i * 26} y="48" width="25" height="95" fill="#2c383e" stroke="#4a5660" strokeWidth="1.5" />
              <path d={`M${44 + i * 26} 58 H${61 + i * 26} M${44 + i * 26} 62 H${61 + i * 26} M${44 + i * 26} 66 H${61 + i * 26}`} stroke="#10181c" strokeWidth="1.5" />
              <rect x={57 + i * 26} y="100" width="3" height="10" fill="#8a9296" />
              <text x={52 + i * 26} y="132" textAnchor="middle" fontSize="8" fill="#8a9296">
                {i + 11}
              </text>
              {i === 5 && <polygon points={`${40 + i * 26},48 ${40 + i * 26 - 10},56 ${40 + i * 26 - 10},138 ${40 + i * 26},143`} fill="#1a2328" stroke="#4a5660" />}
            </g>
          ))}
          <path d="M70 70 q-3 28 1 56 M188 76 q3 24 -1 44" stroke="#8a4a22" strokeWidth="3" opacity="0.5" fill="none" />
        </>
      );
    case 3: // 지하 보일러실: 압력 계기판
      return (
        <>
          <rect x="40" y="48" width="210" height="95" rx="3" fill="#2a2622" stroke="#5a4a3a" strokeWidth="5" />
          {[84, 146, 208].map((cx, i) => (
            <g key={cx}>
              <circle cx={cx} cy="84" r="24" fill="#d8d0bc" stroke="#3a322a" strokeWidth="3" />
              <path d={`M${cx - 16} 94 A18 18 0 1 1 ${cx + 16} 94`} fill="none" stroke="#8a2a22" strokeWidth="3" strokeDasharray="2 4" />
              <path className="needle" d={`M${cx} 84 L${cx + [10, -8, 14][i]} ${70 + [4, 0, 8][i]}`} stroke="#14100c" strokeWidth="2.4" strokeLinecap="round" />
              <circle cx={cx} cy="84" r="3" fill="#14100c" />
            </g>
          ))}
          <rect x="52" y="122" width="186" height="8" rx="3" fill="#4a4540" stroke="#2a2622" />
          <circle cx="146" cy="126" r="9" fill="none" stroke="#a02a22" strokeWidth="3" />
          <path d="M137 126 H155 M146 117 V135" stroke="#a02a22" strokeWidth="2.5" />
        </>
      );
    default: // 교실: 금 간 칠판
      return (
        <>
          <rect x="40" y="48" width="210" height="95" rx="3" fill="#14282a" stroke="#4a3d32" strokeWidth="5" />
          <path d="M58 76 H150 M58 96 H190 M58 116 H130" stroke="#cfe8dc" strokeWidth="2" strokeDasharray="7 4" opacity="0.4" />
          <path d="M150 50 L158 82 L146 104 L160 140" stroke="#050c0d" strokeWidth="1.8" fill="none" />
          <path d="M158 82 L186 90" stroke="#050c0d" strokeWidth="1.2" fill="none" />
          <circle cx="214" cy="84" r="16" stroke="#cfe8dc" strokeWidth="1.6" fill="none" opacity="0.4" />
          <rect x="196" y="132" width="38" height="6" fill="#bdb6a3" />
        </>
      );
  }
}

// ── 추리 (x 34~250, y 44~154) ────────────────────────────────────────
export function DetectiveBoard({ space }: { space: number }) {
  switch (space) {
    case 1: // 사건 현장: 증거 번호판
      return (
        <>
          <rect x="34" y="44" width="216" height="110" rx="2" fill="#3a4650" stroke="#1a222a" strokeWidth="5" />
          <rect x="42" y="52" width="200" height="94" fill="#46545e" />
          {[
            [78, 96, "1"],
            [138, 110, "2"],
            [196, 92, "3"],
          ].map(([x, y, n]) => (
            <g key={String(n)}>
              <polygon points={`${Number(x) - 12},${Number(y) + 20} ${x},${Number(y) - 14} ${Number(x) + 12},${Number(y) + 20}`} fill="#e8c82a" stroke="#6a5a10" strokeWidth="1.5" />
              <text x={x as number} y={Number(y) + 14} textAnchor="middle" fontSize="12" fontWeight="bold" fill="#1a1a14">
                {n}
              </text>
            </g>
          ))}
          <rect x="52" y="58" width="40" height="28" fill="#e8e0cc" stroke="#9a8a62" transform="rotate(-3 72 72)" />
          <rect x="196" y="58" width="36" height="26" fill="#e8e0cc" stroke="#9a8a62" transform="rotate(4 214 71)" />
          <g transform="rotate(-8 140 70)">
            <rect x="40" y="66" width="200" height="12" fill="#e8c82a" opacity="0.9" />
            {Array.from({ length: 10 }, (_, i) => (
              <polygon key={i} points={`${40 + i * 21},66 ${40 + i * 21 + 9},66 ${40 + i * 21 + 2},78 ${40 + i * 21 - 7},78`} fill="#1a1a14" />
            ))}
          </g>
        </>
      );
    case 2: // 기록 보관소: 서류 서랍장
      return (
        <>
          <rect x="34" y="44" width="216" height="110" rx="2" fill="#3a2e1c" stroke="#1a1408" strokeWidth="5" />
          {Array.from({ length: 12 }, (_, i) => {
            const c = i % 4;
            const r = Math.floor(i / 4);
            return (
              <g key={i}>
                <rect x={42 + c * 52} y={50 + r * 34} width="48" height="30" fill="#5a4a32" stroke="#2a2010" />
                <rect x={52 + c * 52} y={56 + r * 34} width="28" height="9" fill="#e8d8a8" stroke="#8a7a52" />
                <rect x={56 + c * 52} y={70 + r * 34} width="20" height="4" rx="2" fill="#c4a468" />
              </g>
            );
          })}
        </>
      );
    case 3: // 옥상: 물탱크
      return (
        <>
          <rect x="34" y="44" width="216" height="110" rx="2" fill="#10182a" opacity="0.5" />
          <rect x="96" y="124" width="8" height="30" fill="#2a2e3a" />
          <rect x="176" y="124" width="8" height="30" fill="#2a2e3a" />
          <rect x="84" y="60" width="112" height="68" rx="10" fill="#4a5a66" stroke="#1a222a" strokeWidth="3" />
          <rect x="84" y="82" width="112" height="5" fill="#2a3a44" />
          <rect x="84" y="104" width="112" height="5" fill="#2a3a44" />
          <ellipse cx="140" cy="60" rx="56" ry="9" fill="#5a6a76" stroke="#1a222a" strokeWidth="2" />
          <path d="M214 148 V70 M232 148 V70 M214 80 H232 M214 96 H232 M214 112 H232 M214 128 H232" stroke="#3a4650" strokeWidth="3" />
          <text x="140" y="100" textAnchor="middle" fontSize="12" fontWeight="bold" fill="#cfe3ee" opacity="0.8">
            WATER
          </text>
        </>
      );
    default: // 탐정 사무실: 사건 보드
      return (
        <>
          <rect x="34" y="44" width="216" height="110" rx="2" fill="#a67c4e" stroke="#4a2e18" strokeWidth="5" />
          <rect x="40" y="50" width="204" height="98" fill="#b88c58" opacity="0.9" />
          {[
            [56, 58, -4],
            [118, 56, 3],
            [188, 60, -2],
          ].map(([x, y, r], i) => (
            <g key={i} transform={`rotate(${r} ${x + 20} ${y + 24})`}>
              <rect x={x} y={y} width="40" height="48" fill="#e8e0cc" stroke="#9a8a62" />
              <rect x={x + 4} y={y + 4} width="32" height="30" fill={i === 1 ? "#4a4a44" : "#6a6a60"} />
              <circle cx={x + 20} cy={y + 15} r="7" fill="#2a2a26" />
              <path d={`M${x + 8} ${y + 34} q12 -14 24 0`} fill="#2a2a26" />
              <path d={`M${x + 6} ${y + 40} H${x + 34}`} stroke="#6b5a3a" strokeWidth="1.3" />
              <circle cx={x + 20} cy={y + 2} r="2.8" fill="#c8302a" />
            </g>
          ))}
          <rect x="70" y="116" width="42" height="26" fill="#f0e08a" transform="rotate(3 90 128)" />
          <rect x="150" y="112" width="44" height="30" fill="#f4f0e0" transform="rotate(-3 170 126)" />
          <path d="M78 124 H104 M78 130 H98 M158 120 H188 M158 126 H184 M158 132 H176" stroke="#6b5a3a" strokeWidth="1.2" />
          <path d="M76 58 L138 60 L208 62 L170 118 L90 120 L76 58" stroke="#c0221c" strokeWidth="1.6" fill="none" strokeLinejoin="round" />
          <path d="M138 60 L90 120" stroke="#c0221c" strokeWidth="1.2" />
          <circle cx="90" cy="118" r="2.8" fill="#c8302a" />
          <circle cx="170" cy="116" r="2.8" fill="#c8302a" />
          <rect x="214" y="70" width="26" height="36" fill="#e8e0cc" stroke="#9a8a62" transform="rotate(5 227 88)" />
          <text x="222" y="92" fontSize="14" fill="#8a2a22" fontWeight="bold">
            ?
          </text>
        </>
      );
  }
}

// ── 이세계 (x 40~212, y 52~146) ──────────────────────────────────────
export function IsekaiBoard({ space }: { space: number }) {
  switch (space) {
    case 1: // 수정 동굴: 빛나는 수정 벽
      return (
        <Bob>
          <polygon points="40,146 56,86 72,146" fill="#2a8a9a" fillOpacity="0.8" stroke="#a8fff0" strokeWidth="1.5" />
          <polygon points="66,146 92,62 120,146" fill="#6a4ae8" fillOpacity="0.75" stroke="#e0d0ff" strokeWidth="1.5" />
          <polygon points="112,146 134,92 156,146" fill="#2ad8c8" fillOpacity="0.75" stroke="#e8fff8" strokeWidth="1.5" />
          <polygon points="150,146 176,70 204,146" fill="#9a6aff" fillOpacity="0.75" stroke="#f0e0ff" strokeWidth="1.5" />
          <path d="M92 62 V146 M176 70 V146 M56 86 V146" stroke="#ffffff" strokeWidth="0.8" opacity="0.5" />
          {["ᚠ", "ᚦ", "ᚱ"].map((r, i) => (
            <text key={i} className="rune-glow" x={84 + i * 38} y={118} fontSize="16" fill="#e8fff8" fontFamily="Noto Sans Runic, serif">
              {r}
            </text>
          ))}
        </Bob>
      );
    case 2: // 별의 도서관: 별자리 두루마리
      return (
        <Bob>
          <rect x="52" y="60" width="148" height="80" fill="#14104a" stroke="#c0a0ff" strokeWidth="2.5" />
          <rect x="46" y="54" width="160" height="10" rx="5" fill="#c8a868" stroke="#8a6a32" />
          <rect x="46" y="136" width="160" height="10" rx="5" fill="#c8a868" stroke="#8a6a32" />
          <path d="M70 84 L102 100 L130 82 L160 108 L184 90" stroke="#c8b0ff" strokeWidth="1.2" fill="none" />
          {[[70, 84], [102, 100], [130, 82], [160, 108], [184, 90]].map(([x, y]) => (
            <circle key={`${x}${y}`} className="twinkle" cx={x} cy={y} r="3" fill="#f0eaff" />
          ))}
          <path d="M80 124 H172" stroke="#6af5d8" strokeWidth="1.2" strokeDasharray="4 4" opacity="0.7" />
        </Bob>
      );
    case 3: // 마왕성: 마왕의 문양 깃발
      return (
        <Bob>
          <polygon points="56,54 196,54 196,128 126,146 56,128" fill="#1a0a22" stroke="#a02a4a" strokeWidth="3" />
          <path d="M70 70 L84 54 L98 70 M154 70 L168 54 L182 70" stroke="#a02a4a" strokeWidth="2" fill="none" />
          <ellipse cx="126" cy="92" rx="34" ry="18" fill="#3a0a1a" stroke="#ff4a6a" strokeWidth="2" />
          <ellipse className="rune-glow" cx="126" cy="92" rx="12" ry="14" fill="#ff2a4a" />
          <ellipse cx="126" cy="92" rx="3" ry="12" fill="#14040a" />
          <path d="M80 122 H172" stroke="#a02a4a" strokeWidth="1.5" strokeDasharray="5 4" />
        </Bob>
      );
    default: // 떠 있는 섬: 룬 석판
      return (
        <Bob>
          <polygon points="44,58 206,52 212,140 40,146" fill="#2f2a5a" stroke="#8a7ae0" strokeWidth="3" />
          <polygon points="52,66 198,61 202,132 50,138" fill="#1d1a3e" />
          {["ᚠ", "ᚢ", "ᚦ", "ᚨ", "ᚱ", "ᚲ", "ᚷ", "ᚹ"].map((r, i) => (
            <text key={i} className="rune-glow" x={64 + (i % 4) * 36} y={92 + Math.floor(i / 4) * 32} fontSize="22" fill="#6af5d8" fontFamily="Noto Sans Runic, serif">
              {r}
            </text>
          ))}
        </Bob>
      );
  }
}
