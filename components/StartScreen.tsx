"use client";

import { useState } from "react";
import type { ThemeId } from "@/lib/types";
import { SAMPLE_MATERIAL, SAMPLE_SUBJECT } from "@/lib/sample";

const THEMES: { id: ThemeId; name: string; desc: string }[] = [
  { id: "horror", name: "공포", desc: "폐교된 학교 실험실" },
  { id: "isekai", name: "이세계 탈출", desc: "마법진이 빛나는 판타지 세계" },
  { id: "detective", name: "추리", desc: "사건 현장 연구실" },
];

interface Props {
  onEnter: (o: { subject: string; theme: ThemeId; surprise: boolean }) => void;
}

export default function StartScreen({ onEnter }: Props) {
  const [subject, setSubject] = useState("");
  const [material, setMaterial] = useState("");
  const [theme, setTheme] = useState<ThemeId>("horror");
  const [surprise, setSurprise] = useState(true);
  const [loading, setLoading] = useState(false);

  function start(s: string) {
    setLoading(true);
    // AI가 방을 만드는 동안의 로딩 연출 자리 (지금은 짧게 기다리기만 함)
    setTimeout(() => onEnter({ subject: s, theme, surprise }), 1500);
  }

  if (loading) {
    return (
      <section className="screen center">
        <div className="loading-lock" aria-hidden="true">🔒</div>
        <p className="loading-text">방을 만드는 중… 문이 잠기는 소리가 들린다</p>
      </section>
    );
  }

  return (
    <section className="screen">
      <h1 className="title">시험범위에 갇혔다</h1>
      <p className="sub">강의자료를 넣으면, 그 내용이 단서가 되어 방에 숨는다.</p>

      <label className="field">
        <span>과목 이름</span>
        <input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="예: 컴퓨터 네트워크" />
      </label>

      <label className="field">
        <span>강의자료 (글 붙여넣기)</span>
        <textarea
          rows={6}
          value={material}
          onChange={(e) => setMaterial(e.target.value)}
          placeholder="강의자료 내용을 여기에 붙여넣으세요. (PDF 올리기는 나중에 추가돼요)"
        />
      </label>

      <div className="field">
        <span>테마</span>
        <div className="theme-cards">
          {THEMES.map((t) => (
            <button
              key={t.id}
              type="button"
              className={`theme-card ${theme === t.id ? "selected" : ""}`}
              onClick={() => setTheme(t.id)}
              aria-pressed={theme === t.id}
            >
              <strong>{t.name}</strong>
              <small>{t.desc}</small>
            </button>
          ))}
        </div>
      </div>

      <label className="switch">
        <input type="checkbox" checked={surprise} onChange={(e) => setSurprise(e.target.checked)} />
        <span>놀람 주의: 실패하면 교수님이 나타납니다</span>
      </label>

      <div className="actions">
        <button
          type="button"
          className="btn ghost"
          onClick={() => {
            setSubject(SAMPLE_SUBJECT);
            setMaterial(SAMPLE_MATERIAL);
          }}
        >
          예시 자료로 해 보기
        </button>
        <button
          type="button"
          className="btn primary"
          disabled={!material.trim()}
          onClick={() => start(subject)}
        >
          입장하기
        </button>
      </div>
      <p className="note">지금은 예시 문제로 진행돼요. (AI 연결은 4단계)</p>
    </section>
  );
}
