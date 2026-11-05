"use client";

import { useState } from "react";
import type { Difficulty, GameData, GameMode, ThemeId } from "@/lib/types";
import { DIFFICULTY, MATERIAL_MAX_CHARS, ROOMS } from "@/lib/config";
import { SAMPLE_MATERIAL, SAMPLE_SUBJECT } from "@/lib/sample";
import { createGame } from "@/lib/gameFactory";
import type { Snapshot } from "@/lib/save";
import { THEME_TAGLINE } from "@/lib/themes";

const THEMES: { id: ThemeId; name: string; desc: string }[] = [
  { id: "horror", name: "공포", desc: THEME_TAGLINE.horror },
  { id: "isekai", name: "이세계 탈출", desc: THEME_TAGLINE.isekai },
  { id: "detective", name: "추리", desc: THEME_TAGLINE.detective },
];

const MODES: { id: GameMode; name: string; desc: string }[] = [
  { id: "quick", name: "빠른 탈출", desc: `방 ${ROOMS.quickRooms}개` },
  { id: "full", name: "전체 범위 탈출", desc: "자료 양에 맞춰 방 개수 자동" },
];

interface Props {
  saved: Snapshot | null;
  onResume: () => void;
  onGameReady: (game: GameData) => void;
  onThemeChange?: (theme: ThemeId) => void;
}

export default function StartScreen({ saved, onResume, onGameReady, onThemeChange }: Props) {
  const [subject, setSubject] = useState("");
  const [material, setMaterial] = useState("");
  const [theme, setTheme] = useState<ThemeId>("horror");
  const [difficulty, setDifficulty] = useState<Difficulty>("normal");
  const [mode, setMode] = useState<GameMode>("quick");
  const [surprise, setSurprise] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function start() {
    setLoading(true);
    setError(null);
    try {
      const game = await createGame({ subject, material, theme, difficulty, mode, surprise });
      onGameReady(game);
    } catch (e) {
      setError(e instanceof Error ? e.message : "방을 만들지 못했어요. 잠시 후 다시 시도해 주세요.");
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <section className="screen center">
        <div className="loading-lock" aria-hidden="true">
          🔒
        </div>
        <p className="loading-text">방을 만드는 중… 문이 잠기는 소리가 들린다</p>
        <p className="tip">AI가 강의자료를 읽고 방을 짓고 있어요. 30초 정도 걸릴 수 있어요.</p>
      </section>
    );
  }

  const over = material.length > MATERIAL_MAX_CHARS;

  return (
    <section className="screen">
      <h1 className="title">시험범위에 갇혔다</h1>
      <p className="sub">강의자료를 넣으면, 그 내용이 단서가 되어 방에 숨는다.</p>

      {saved && (
        <button type="button" className="btn primary resume" onClick={onResume}>
          ▶ 이어하기 ({saved.game.subject} · 방 {Math.min((saved.progress?.roomIdx ?? saved.game.roomCount - 1) + 1, saved.game.roomCount)} / {saved.game.roomCount})
        </button>
      )}

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
          placeholder="강의자료 PDF를 열어 Ctrl+A, Ctrl+C로 복사해서 붙여넣으세요"
        />
        <small className={over ? "warn" : "tip"}>
          {material.length.toLocaleString()} / {MATERIAL_MAX_CHARS.toLocaleString()}자
          {over ? " · 넘는 부분은 잘라서 사용해요" : ""}
        </small>
      </label>

      <div className="field">
        <span>테마</span>
        <div className="theme-cards">
          {THEMES.map((t) => (
            <button key={t.id} type="button" className={`theme-card ${theme === t.id ? "selected" : ""}`} onClick={() => {
                setTheme(t.id);
                onThemeChange?.(t.id);
              }} aria-pressed={theme === t.id}>
              <strong>{t.name}</strong>
              <small>{t.desc}</small>
            </button>
          ))}
        </div>
      </div>

      <div className="field">
        <span>난이도</span>
        <div className="theme-cards">
          {(Object.keys(DIFFICULTY) as Difficulty[]).map((d) => (
            <button key={d} type="button" className={`theme-card ${difficulty === d ? "selected" : ""}`} onClick={() => setDifficulty(d)} aria-pressed={difficulty === d}>
              <strong>{DIFFICULTY[d].label}</strong>
              <small>{DIFFICULTY[d].desc}</small>
            </button>
          ))}
        </div>
      </div>

      <div className="field">
        <span>게임 길이</span>
        <div className="theme-cards two">
          {MODES.map((m) => (
            <button key={m.id} type="button" className={`theme-card ${mode === m.id ? "selected" : ""}`} onClick={() => setMode(m.id)} aria-pressed={mode === m.id}>
              <strong>{m.name}</strong>
              <small>{m.desc}</small>
            </button>
          ))}
        </div>
      </div>

      <label className="switch">
        <input type="checkbox" checked={surprise} onChange={(e) => setSurprise(e.target.checked)} />
        <span>놀람 주의: 실패하면 교수님이 나타납니다</span>
      </label>

      {error && <p className="error">{error}</p>}

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
        <button type="button" className="btn primary" disabled={!material.trim()} onClick={start}>
          입장하기
        </button>
      </div>
      <p className="note">지금은 예시 문제로 진행돼요. (AI 연결은 4단계)</p>
    </section>
  );
}
