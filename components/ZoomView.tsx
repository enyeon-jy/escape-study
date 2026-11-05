"use client";

import type { KeyboardEvent } from "react";
import { SLOT_POS, VIEW_LABEL } from "@/lib/scenes";
import type { RoomView, Slot, SlotShape } from "@/lib/types";

interface Props {
  view: RoomView;
  inspected: string[];
  unlocked: string[];
  onSlot: (slot: Slot) => void;
  onBack: () => void;
}

// 작은 물건 하나(80×70 칸 안에 그린다)
function Shape({ shape }: { shape: SlotShape }) {
  switch (shape) {
    case "drawer":
      return (
        <>
          <rect x="0" y="12" width="80" height="48" rx="3" fill="#47301f" stroke="#6b4a36" strokeWidth="2" />
          <rect x="6" y="18" width="68" height="36" fill="#3b2819" />
          <circle cx="40" cy="36" r="4" fill="#caa86a" />
        </>
      );
    case "notebook":
      return (
        <>
          <rect x="8" y="10" width="64" height="52" rx="2" fill="#2b3a5a" stroke="#4a5d86" strokeWidth="2" />
          <rect x="8" y="10" width="8" height="52" fill="#1c2740" />
          <path d="M24 26 H62 M24 36 H62 M24 46 H52" stroke="#9fb4de" strokeWidth="2" opacity="0.6" />
        </>
      );
    case "cup":
      return (
        <>
          <path d="M22 16 H54 L50 62 H26 Z" fill="#8a8a95" stroke="#b5b5c0" strokeWidth="2" />
          <path d="M54 26 q16 2 0 22" fill="none" stroke="#b5b5c0" strokeWidth="4" />
        </>
      );
    case "box":
      return (
        <>
          <rect x="4" y="26" width="72" height="36" fill="#5a4630" stroke="#7d6244" strokeWidth="2" />
          <rect x="0" y="16" width="80" height="14" fill="#6b5538" stroke="#7d6244" strokeWidth="2" />
          <rect x="34" y="28" width="12" height="10" fill="#caa86a" />
        </>
      );
    case "book":
      return (
        <>
          <rect x="14" y="6" width="52" height="58" rx="2" fill="#5a2b2b" stroke="#8a4a4a" strokeWidth="2" />
          <rect x="14" y="20" width="52" height="8" fill="#caa86a" opacity="0.7" />
          <rect x="14" y="44" width="52" height="4" fill="#caa86a" opacity="0.5" />
        </>
      );
  }
}

export default function ZoomView({ view, inspected, unlocked, onSlot, onBack }: Props) {
  const key = (s: Slot) => (e: KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onSlot(s);
    }
  };

  return (
    <div className="zoom-view">
      <svg className="wall-svg" viewBox="0 0 400 250" role="group" aria-label={`${VIEW_LABEL[view.id]} 클로즈업`}>
        <rect width="400" height="250" fill="#120a0b" />
        {view.id === "shelf" && (
          <>
            <rect x="10" y="20" width="380" height="220" fill="#3d2a1f" stroke="#6b4a36" strokeWidth="4" />
            <rect x="10" y="170" width="380" height="8" fill="#6b4a36" />
            <rect x="10" y="95" width="380" height="0" />
          </>
        )}
        {view.id === "desk" && (
          <>
            <rect x="0" y="0" width="400" height="250" fill="#1c1012" />
            <rect x="10" y="150" width="380" height="24" fill="#5a3e2a" stroke="#7a5a3a" strokeWidth="3" />
            <rect x="30" y="174" width="340" height="66" fill="#47301f" />
          </>
        )}
        {view.id === "cabinet" && (
          <>
            <rect x="10" y="20" width="380" height="220" fill="#3b4048" stroke="#6a717c" strokeWidth="4" />
            <path d="M10 170 H390" stroke="#2c3037" strokeWidth="4" />
          </>
        )}
        <rect className="flicker" x="130" y="0" width="140" height="8" rx="3" fill="#ffe3dc" />

        {view.slots.map((s, i) => {
          const [x, y] = SLOT_POS[i];
          const locked = !!s.lockedBy && !unlocked.includes(s.id);
          const done = inspected.includes(s.id);
          return (
            <g
              key={s.id}
              className={`hotspot ${done ? "done" : ""}`}
              transform={`translate(${x} ${y})`}
              role="button"
              tabIndex={0}
              onClick={() => onSlot(s)}
              onKeyDown={key(s)}
              aria-label={`${s.label}${locked ? " (잠김)" : done ? " (조사함)" : ""}`}
            >
              <title>{s.label}</title>
              <Shape shape={s.shape} />
              {locked && (
                <g transform="translate(58 0)">
                  <rect x="0" y="8" width="18" height="14" rx="2" fill="#c9a24a" stroke="#6b5420" />
                  <path d="M3 8 v-5 a6 6 0 0 1 12 0 v5" fill="none" stroke="#c9a24a" strokeWidth="3" />
                </g>
              )}
              {done && !locked && (
                <g className="check" transform="translate(70 8)">
                  <circle r="8" fill="#1f7a3d" stroke="#d9ffe6" strokeWidth="1" />
                  <path d="M-4 0 L-1 3.5 L4.5 -3" stroke="#fff" strokeWidth="2" fill="none" />
                </g>
              )}
              <text x="40" y="84" textAnchor="middle" fontSize="11" fill="#d8c9b0">
                {s.label}
              </text>
            </g>
          );
        })}
      </svg>
      <button type="button" className="back-btn" onClick={onBack} aria-label="방 전체로 돌아가기">
        ↓ 돌아가기
      </button>
    </div>
  );
}
