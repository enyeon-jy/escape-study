"use client";

import type { KeyboardEvent } from "react";
import { SLOT_POS } from "@/lib/scenes";
import { shapeLabel, viewLabel } from "@/lib/themes";
import type { RoomView, Slot, ThemeId } from "@/lib/types";
import { themeArt } from "./themes";

interface Props {
  theme: ThemeId;
  view: RoomView;
  inspected: string[];
  unlocked: string[];
  onSlot: (slot: Slot) => void;
  onBack: () => void;
}

export default function ZoomView({ theme, view, inspected, unlocked, onSlot, onBack }: Props) {
  const { ZoomArt, SlotArt } = themeArt(theme);
  const key = (s: Slot) => (e: KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onSlot(s);
    }
  };

  return (
    <div className="zoom-view">
      <svg className="wall-svg" viewBox="0 0 400 250" role="group" aria-label={`${viewLabel(theme, view.id)} 클로즈업`}>
        <ZoomArt view={view.id} />

        {view.slots.map((s, i) => {
          const [x, y] = SLOT_POS[i];
          const locked = !!s.lockedBy && !unlocked.includes(s.id);
          const done = inspected.includes(s.id);
          const label = shapeLabel(theme, s.shape);
          return (
            <g
              key={s.id}
              className={`hotspot ${done ? "done" : ""}`}
              transform={`translate(${x} ${y})`}
              role="button"
              tabIndex={0}
              onClick={() => onSlot(s)}
              onKeyDown={key(s)}
              aria-label={`${label}${locked ? " (잠김)" : done ? " (조사함)" : ""}`}
            >
              <title>{label}</title>
              <SlotArt shape={s.shape} />
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
              <text className="slot-label" x="40" y="84" textAnchor="middle" fontSize="11">
                {label}
              </text>
            </g>
          );
        })}
      </svg>
      <button type="button" className="modal-x zoom-x" onClick={onBack} aria-label="닫기">
        ✕
      </button>
      <button type="button" className="back-btn" onClick={onBack} aria-label="방 전체로 돌아가기">
        ↓ 돌아가기
      </button>
    </div>
  );
}
