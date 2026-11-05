"use client";

// 타이틀 화면의 문과 자물쇠. [시작하기]를 누르면 자물쇠가 풀리고(unlocking) 문이 양쪽으로 열린다(opening).
export type TitlePhase = "idle" | "unlocking" | "opening";

export default function TitleDoor({ phase }: { phase: TitlePhase }) {
  return (
    <div className={`title-door ${phase}`} aria-hidden="true">
      <div className="door-light" />
      <div className="door-half l" />
      <div className="door-half r" />
      <div className="title-lock">
        <svg viewBox="0 0 120 150" width="120" height="150">
          <g className="lk-shackle">
            <path d="M32 66 V44 a28 28 0 0 1 56 0 V66" fill="none" strokeWidth="11" strokeLinecap="round" />
          </g>
          <rect className="lk-body" x="14" y="62" width="92" height="76" rx="12" />
          <rect className="lk-shine" x="20" y="68" width="80" height="14" rx="7" />
          <circle className="lk-hole" cx="60" cy="96" r="9" />
          <path className="lk-hole" d="M55 100 H65 L68 122 H52 Z" />
        </svg>
      </div>
    </div>
  );
}
