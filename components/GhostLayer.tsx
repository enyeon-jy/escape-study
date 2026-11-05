"use client";

import { useEffect, useRef, useState } from "react";

interface Props {
  enabled: boolean; // 공포 테마이고 "놀람 주의"가 켜져 있을 때만 true
  ratio: number; // 방 남은 시간 비율 (1=가득, 0=끝). 줄어들수록 자주 나온다
}

// 움직임 줄이기 설정이면 귀신은 나오지 않는다
function prefersReducedMotion() {
  try {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  } catch {
    return false;
  }
}

// 창문이나 복도 끝에 희미한 실루엣이 스르륵 지나간다.
// 번쩍이지 않고 아주 천천히 나타났다 사라진다. 남은 시간이 줄수록 간격이 짧아진다.
export default function GhostLayer({ enabled, ratio }: Props) {
  const [ghost, setGhost] = useState<{ id: number; left: number; dir: 1 | -1; size: number } | null>(null);
  const ratioRef = useRef(ratio);
  ratioRef.current = ratio;

  useEffect(() => {
    if (!enabled || prefersReducedMotion()) return;
    let timer: ReturnType<typeof setTimeout>;
    let n = 0;
    const schedule = () => {
      const r = Math.min(1, Math.max(0, ratioRef.current));
      const mean = 12 + 38 * r; // 시간이 가득하면 약 50초, 끝나 갈수록 약 12초 간격
      timer = setTimeout(
        () => {
          if (!document.hidden) {
            n += 1;
            setGhost({ id: n, left: 8 + Math.random() * 70, dir: Math.random() < 0.5 ? 1 : -1, size: 0.8 + Math.random() * 0.5 });
          }
          schedule();
        },
        mean * 1000 * (0.7 + Math.random() * 0.6),
      );
    };
    schedule();
    return () => clearTimeout(timer);
  }, [enabled]);

  if (!enabled || !ghost) return null;
  return (
    <div className="ghost-layer" aria-hidden="true">
      <div
        key={ghost.id}
        className="specter"
        style={{ left: `${ghost.left}%`, ["--dir" as string]: ghost.dir, ["--size" as string]: ghost.size }}
        onAnimationEnd={() => setGhost(null)}
      >
        <svg viewBox="0 0 60 120" width="60" height="120">
          <path d="M30 2 C12 2 6 22 9 42 L1 112 q7 -8 11 0 q8 -9 12 0 q8 -9 12 0 q7 -8 11 0 L51 42 C54 22 48 2 30 2 Z" fill="#dbe7ee" />
          <ellipse cx="22" cy="34" rx="3.4" ry="5" fill="#0b1214" />
          <ellipse cx="38" cy="34" rx="3.4" ry="5" fill="#0b1214" />
          <ellipse cx="30" cy="48" rx="3" ry="5" fill="#0b1214" opacity="0.7" />
        </svg>
      </div>
    </div>
  );
}
