"use client";

// 반짝이는 입자가 천천히 떠오른다 (이세계). 움직임 줄이기 설정이면 CSS에서 숨긴다.
const DOTS = Array.from({ length: 16 }, (_, i) => ({
  left: (i * 37 + 11) % 100,
  size: 2 + (i % 4),
  dur: 11 + ((i * 3) % 9),
  delay: -((i * 1.7) % 14),
  teal: i % 3 !== 0,
}));

export default function Particles() {
  return (
    <div className="particles" aria-hidden="true">
      {DOTS.map((d, i) => (
        <span
          key={i}
          className="particle"
          style={{ left: `${d.left}%`, width: d.size, height: d.size, animationDuration: `${d.dur}s`, animationDelay: `${d.delay}s`, background: d.teal ? "#8af5ff" : "#c8a8ff", boxShadow: `0 0 ${d.size * 3}px ${d.teal ? "#6af5d8" : "#9a6aff"}` }}
        />
      ))}
    </div>
  );
}
