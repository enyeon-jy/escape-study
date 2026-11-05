"use client";

import type { ReactNode } from "react";
import { WORLDS, type FxKind } from "@/lib/worlds";
import type { ThemeId } from "@/lib/types";
import type { WallId } from "@/lib/scenes";

// 공간(방)마다 다른 분위기: 배경 색조 + 공간 소품(양옆 벽 포함) + 분위기 효과.
// 모두 조사할 수 없는 장식이라 pointerEvents를 끈다. 효과는 움직임 줄이기 설정이면 CSS에서 멈춘다.

// 같은 모양이 서버·브라우저에서 똑같이 나오도록 위치는 계산으로 정한다
const pts = (n: number, seed: number) => Array.from({ length: n }, (_, i) => ({ x: (i * 67 + seed * 31) % 380 + 10, y: (i * 41 + seed * 17) % 170 + 20, d: ((i * 0.9 + seed) % 6) }));

function Fx({ kind, wall }: { kind: FxKind; wall: WallId }) {
  const seed = wall === "left" ? 1 : wall === "front" ? 2 : 3;
  switch (kind) {
    case "dust":
      return (
        <g>
          {pts(14, seed).map((p, i) => (
            <circle key={i} className="fx-float" style={{ animationDelay: `-${p.d}s` }} cx={p.x} cy={p.y} r={0.9 + (i % 3) * 0.5} fill="#f4e6c8" opacity="0.5" />
          ))}
        </g>
      );
    case "bubbles":
      return (
        <g>
          {pts(9, seed).map((p, i) => (
            <circle key={i} className="fx-rise" style={{ animationDelay: `-${p.d}s`, ["--rise" as string]: "70px" }} cx={30 + ((i * 43) % 150)} cy={190} r={2 + (i % 3)} fill="none" stroke="#7affc0" strokeWidth="1" opacity="0.7" />
          ))}
        </g>
      );
    case "fog":
      return (
        <g>
          {[0, 1, 2].map((i) => (
            <ellipse key={i} className="fx-drift" style={{ animationDelay: `-${i * 5 + seed}s` }} cx={100 + i * 110} cy={175 + (i % 2) * 14} rx="110" ry="22" fill="#9aa8c8" opacity="0.12" />
          ))}
        </g>
      );
    case "steam":
      return (
        <g>
          {[0, 1, 2, 3].map((i) => (
            <circle key={i} className="fx-steam" style={{ animationDelay: `-${i * 1.6 + seed}s` }} cx={70 + i * 90 + seed * 10} cy={30} r="9" fill="#e8e0d4" />
          ))}
        </g>
      );
    case "rain":
      return (
        <g>
          {pts(16, seed).map((p, i) => (
            <line key={i} className="rain" style={{ animationDelay: `-${p.d / 3}s`, ["--h" as string]: "240px" }} x1={p.x} y1={-10} x2={p.x - 3} y2={4} stroke="#cfe3ee" strokeWidth="1" opacity="0.4" />
          ))}
        </g>
      );
    case "sparkle":
      return (
        <g>
          {pts(12, seed).map((p, i) => (
            <circle key={i} className="twinkle" style={{ animationDelay: `-${p.d}s` }} cx={p.x} cy={p.y} r={1 + (i % 3) * 0.6} fill={i % 2 ? "#8af5ff" : "#c8a8ff"} />
          ))}
        </g>
      );
    case "stars":
      return (
        <g>
          {pts(16, seed + 3).map((p, i) => (
            <path key={i} className="twinkle" style={{ animationDelay: `-${p.d}s` }} d={`M${p.x} ${p.y - 3} L${p.x + 1} ${p.y - 1} L${p.x + 3} ${p.y} L${p.x + 1} ${p.y + 1} L${p.x} ${p.y + 3} L${p.x - 1} ${p.y + 1} L${p.x - 3} ${p.y} L${p.x - 1} ${p.y - 1} Z`} fill="#f0eaff" />
          ))}
        </g>
      );
    case "embers":
      return (
        <g>
          {pts(12, seed).map((p, i) => (
            <circle key={i} className="fx-rise" style={{ animationDelay: `-${p.d}s`, ["--rise" as string]: "120px" }} cx={p.x} cy={215} r={1.2 + (i % 2)} fill="#ff7a3a" opacity="0.85" />
          ))}
        </g>
      );
  }
}

// 공간 소품: 양옆 벽과 앞 벽 모두에 놓이는 장식
function Deco({ theme, space, wall }: { theme: ThemeId; space: number; wall: WallId }): ReactNode {
  const key = `${theme}-${space}`;
  switch (key) {
    case "horror-1": // 과학실: 바닥의 노란 경고 띠
      return (
        <g opacity="0.7">
          <rect y="198" width="400" height="7" fill="#c8a82a" />
          {Array.from({ length: 24 }, (_, i) => (
            <polygon key={i} points={`${i * 18},198 ${i * 18 + 9},198 ${i * 18 + 3},205 ${i * 18 - 6},205`} fill="#1a1a14" />
          ))}
        </g>
      );
    case "horror-2": // 복도: 소실점으로 모이는 선
      return (
        <g stroke="#8a98c8" strokeWidth="1" opacity="0.22" fill="none">
          <path d="M0 0 L190 110 M400 0 L210 110 M0 250 L190 135 M400 250 L210 135" />
          <rect x="176" y="104" width="48" height="36" />
        </g>
      );
    case "horror-3": // 보일러실: 천장을 가로지르는 파이프
      return (
        <g>
          <rect x="0" y="12" width="400" height="12" fill="#4a4540" stroke="#2a2622" />
          <rect x="0" y="30" width="400" height="7" fill="#5a4a3a" stroke="#2a2622" />
          {[60, 150, 250, 340].map((x) => (
            <rect key={x} x={x} y="8" width="8" height="32" fill="#3a3632" stroke="#2a2622" />
          ))}
          <rect x={wall === "right" ? 20 : 372} y="24" width="9" height="150" fill="#4a4540" stroke="#2a2622" />
        </g>
      );
    case "detective-1": // 사건 현장: 노란 폴리스라인
      return (
        <g opacity="0.85">
          <g transform="rotate(-6 200 40)">
            <rect x="-20" y="30" width="440" height="14" fill="#e8c82a" />
            {Array.from({ length: 22 }, (_, i) => (
              <polygon key={i} points={`${i * 22},30 ${i * 22 + 10},30 ${i * 22 + 2},44 ${i * 22 - 8},44`} fill="#1a1a14" />
            ))}
          </g>
        </g>
      );
    case "detective-2": // 기록 보관소: 바닥의 서류 상자
      return (
        <g>
          {[16, 66, 330].map((x, i) => (
            <g key={x}>
              <rect x={x} y={176 - (i % 2) * 14} width="44" height={30 + (i % 2) * 14} fill="#b89a68" stroke="#6a4a22" />
              <rect x={x + 6} y={184 - (i % 2) * 14} width="32" height="8" fill="#e8d8a8" />
            </g>
          ))}
        </g>
      );
    case "detective-3": // 옥상: 난간과 멀리 보이는 도시
      return (
        <g>
          <path d="M0 150 L24 150 L24 128 L48 128 L48 144 L72 144 L72 118 L96 118 L96 150 L140 150 L140 134 L170 134 L170 150 L230 150 L230 122 L262 122 L262 150 L300 150 L300 138 L330 138 L330 112 L356 112 L356 150 L400 150 V170 H0 Z" fill="#0a0e1c" opacity="0.85" />
          {[34, 82, 244, 340].map((x) => (
            <rect key={x} x={x} y={132 + (x % 3) * 4} width="4" height="4" fill="#ffd98a" opacity="0.8" />
          ))}
          <rect x="0" y="188" width="400" height="5" fill="#2a2e3a" />
          {Array.from({ length: 14 }, (_, i) => (
            <rect key={i} x={i * 30 + 6} y="188" width="4" height="22" fill="#2a2e3a" />
          ))}
        </g>
      );
    case "isekai-1": // 수정 동굴: 천장의 고드름 같은 수정
      return (
        <g>
          {[20, 70, 130, 210, 270, 330, 380].map((x, i) => (
            <polygon key={x} points={`${x - 12},0 ${x + 12},0 ${x},${28 + (i % 3) * 14}`} fill="#1a5a6a" stroke="#6af5d8" strokeWidth="0.8" opacity="0.75" />
          ))}
        </g>
      );
    case "isekai-2": // 별의 도서관: 별자리 선
      return (
        <g stroke="#c8b0ff" strokeWidth="0.8" fill="none" opacity="0.35">
          <path d="M40 40 L90 70 L130 50 L180 90 M260 40 L300 80 L350 56" />
          {[[40, 40], [90, 70], [130, 50], [180, 90], [260, 40], [300, 80], [350, 56]].map(([x, y]) => (
            <circle key={`${x}${y}`} cx={x} cy={y} r="2.2" fill="#f0eaff" />
          ))}
        </g>
      );
    case "isekai-3": // 마왕성: 멀리 보이는 첨탑과 붉은 달
      return (
        <g>
          <circle cx={wall === "left" ? 300 : 90} cy="70" r="26" fill="#a01a3a" opacity="0.65" />
          <path d="M0 170 L20 170 L26 120 L32 170 L60 170 L70 100 L80 170 L120 170 L128 130 L136 170 L190 170 L200 90 L210 170 L260 170 L268 124 L276 170 L320 170 L330 110 L340 170 L400 170 V200 H0 Z" fill="#14081a" opacity="0.9" />
        </g>
      );
    default:
      return null;
  }
}

export default function SpaceLayer({ theme, space, wall }: { theme: ThemeId; space: number; wall: WallId }) {
  const s = WORLDS[theme].spaces[space];
  return (
    <g pointerEvents="none" className="space-layer">
      {s.tintOpacity > 0 && <rect width="400" height="250" fill={s.tint} opacity={s.tintOpacity} />}
      <Deco theme={theme} space={space} wall={wall} />
      <Fx kind={s.fx} wall={wall} />
    </g>
  );
}
