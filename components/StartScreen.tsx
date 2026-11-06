"use client";

import { useEffect, useRef, useState } from "react";
import type { Difficulty, GameData, GameMode, ThemeId } from "@/lib/types";
import { DIFFICULTY, MATERIAL_MAX_CHARS, ROOMS } from "@/lib/config";
import { SAMPLE_MATERIAL, SAMPLE_SUBJECT } from "@/lib/sample";
import { createGame } from "@/lib/gameFactory";
import type { Snapshot } from "@/lib/save";
import { THEME_TAGLINE } from "@/lib/themes";
import { setSoundTheme, sfx } from "@/lib/sound";
import TitleDoor, { type TitlePhase } from "./TitleDoor";

const THEMES: { id: ThemeId; name: string; desc: string }[] = [
  { id: "horror", name: "공포", desc: THEME_TAGLINE.horror },
  { id: "isekai", name: "이세계 탈출", desc: THEME_TAGLINE.isekai },
  { id: "detective", name: "추리", desc: THEME_TAGLINE.detective },
];

const MODES: { id: GameMode; name: string; desc: string }[] = [
  { id: "quick", name: "빠른 탈출", desc: `방 ${ROOMS.quickRooms}개` },
  { id: "full", name: "전체 범위 탈출", desc: "자료 양에 맞춰 방 개수 자동" },
];

const TOTAL_STEPS = 6;

interface Props {
  saved: Snapshot | null;
  onResume: () => void;
  onGameReady: (game: GameData) => void;
  onThemeChange?: (theme: ThemeId) => void;
  initialTheme?: ThemeId;
}

function reducedMotion() {
  try {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  } catch {
    return false;
  }
}

export default function StartScreen({ saved, onResume, onGameReady, onThemeChange, initialTheme }: Props) {
  const [step, setStep] = useState(0); // 0 = 타이틀 화면, 1~6 = 설정 화면
  const [phase, setPhase] = useState<TitlePhase>("idle");
  const [subject, setSubject] = useState("");
  const [material, setMaterial] = useState("");
  const [theme, setTheme] = useState<ThemeId>(initialTheme ?? "horror");
  const [difficulty, setDifficulty] = useState<Difficulty>("normal");
  const [mode, setMode] = useState<GameMode>("quick");
  const [surprise, setSurprise] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stage, setStage] = useState<"concepts" | "room">("concepts");
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    const t = timers.current;
    return () => t.forEach(clearTimeout);
  }, []);

  // [시작하기]: 자물쇠가 철컥 풀리고 → 문이 열리며 → 첫 설정 화면으로
  function begin() {
    if (phase !== "idle") return;
    setSoundTheme(theme);
    const quick = reducedMotion();
    setPhase("unlocking");
    sfx.unlock();
    timers.current.push(
      setTimeout(
        () => {
          setPhase("opening");
          sfx.door();
          timers.current.push(
            setTimeout(
              () => {
                setStep(1);
                setPhase("idle");
              },
              quick ? 200 : 1400,
            ),
          );
        },
        quick ? 200 : 1000,
      ),
    );
  }

  function pickTheme(t: ThemeId) {
    setTheme(t);
    onThemeChange?.(t); // 고른 테마의 배경과 분위기로 바로 바뀐다
  }

  // useSample: AI를 부르지 않고 예시 자료로 체험 (테마·난이도 등 고른 설정은 그대로 쓴다)
  async function start(useSample = false) {
    setLoading(true);
    setError(null);
    setStage("concepts");
    try {
      const game = await createGame({
        subject: useSample ? SAMPLE_SUBJECT : subject,
        material: useSample ? SAMPLE_MATERIAL : material,
        theme,
        difficulty,
        mode,
        surprise,
        onStage: setStage,
      });
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
        <p className="loading-text">{stage === "concepts" ? "개념 추출 중…" : "방 만드는 중…"}</p>
        <ol className="load-steps" aria-label="진행 단계">
          <li className={stage === "concepts" ? "now" : "done"}>{stage === "concepts" ? "▶" : "✓"} 1. 개념 추출 중</li>
          <li className={stage === "room" ? "now" : ""}>{stage === "room" ? "▶" : "·"} 2. 방 만드는 중</li>
        </ol>
        <p className="tip">AI가 강의자료를 읽고 방을 짓고 있어요. 30초 정도 걸릴 수 있어요.</p>
      </section>
    );
  }

  // ── 방 생성 실패 화면: 입력한 자료·설정은 그대로 남아 있다 ─────────────────
  if (error) {
    return (
      <section className="screen center" role="alert">
        <h2 className="fail-title">방을 만들지 못했어요</h2>
        <p className="error">{error}</p>
        <p className="tip">입력한 자료와 설정은 그대로 남아 있어요.</p>
        <div className="title-actions">
          <button type="button" className="btn primary big" onClick={() => void start()}>
            다시 시도
          </button>
          <button type="button" className="btn big" onClick={() => void start(true)}>
            예시 자료로 체험하기
          </button>
          <button type="button" className="btn ghost" onClick={() => setError(null)}>
            설정으로 돌아가기
          </button>
        </div>
        <p className="tip">예시 자료 체험은 AI 없이 바로 시작돼요.</p>
      </section>
    );
  }

  // ── 타이틀 화면 ───────────────────────────────────────────────
  if (step === 0) {
    return (
      <section className="screen center title-screen">
        <h1 className="title big-title">시험범위에 갇혔다</h1>
        <p className="sub">강의자료를 넣으면, 그 내용이 단서가 되어 방에 숨는다.</p>
        <TitleDoor phase={phase} />
        <div className="title-actions">
          <button type="button" className="btn primary big" onClick={begin} disabled={phase !== "idle"}>
            시작하기
          </button>
          {saved && (
            <button type="button" className="btn big" onClick={onResume} disabled={phase !== "idle"}>
              ▶ 이어하기 ({saved.game.subject} · 방 {Math.min((saved.progress?.roomIdx ?? saved.game.roomCount - 1) + 1, saved.game.roomCount)} / {saved.game.roomCount})
            </button>
          )}
        </div>
      </section>
    );
  }

  // ── 설정 화면 (한 화면에 하나씩) ────────────────────────────────
  const over = material.length > MATERIAL_MAX_CHARS;
  const valid = step === 1 ? material.trim().length > 0 : step === 2 ? subject.trim().length > 0 : true;
  const last = step === TOTAL_STEPS;
  const themeName = THEMES.find((t) => t.id === theme)?.name;

  function next() {
    if (!valid) return;
    if (last) void start();
    else setStep(step + 1);
  }

  return (
    <section className="screen wizard" data-step={step}>
      <header className="wiz-top">
        <button type="button" className="btn ghost wiz-back" onClick={() => setStep(step - 1)}>
          ← 이전
        </button>
        <span className="wiz-count" aria-label={`${TOTAL_STEPS}단계 중 ${step}단계`}>
          {step} / {TOTAL_STEPS}
        </span>
      </header>
      <div className="wiz-bar" aria-hidden="true">
        <span style={{ width: `${(step / TOTAL_STEPS) * 100}%` }} />
      </div>

      <div className="wiz-card" key={step}>
        {step === 1 && (
          <>
            <h2>강의자료를 붙여넣어 주세요</h2>
            <textarea
              rows={8}
              value={material}
              onChange={(e) => setMaterial(e.target.value)}
              placeholder="강의자료 PDF를 열어 Ctrl+A, Ctrl+C로 복사해서 붙여넣으세요"
              aria-label="강의자료"
            />
            <small className={over ? "warn" : "tip"}>
              {material.length.toLocaleString()} / {MATERIAL_MAX_CHARS.toLocaleString()}자{over ? " · 넘는 부분은 잘라서 사용해요" : ""}
            </small>
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
            <ul className="wiz-help">
              <li>강의자료 PDF를 열어 Ctrl+A, Ctrl+C로 복사해 붙여넣으세요.</li>
              <li>{MATERIAL_MAX_CHARS.toLocaleString()}자까지 사용돼요. 넘는 부분은 잘려요.</li>
              <li>처음이라면 &quot;예시 자료로 해 보기&quot;로 먼저 체험해 보세요.</li>
            </ul>
          </>
        )}

        {step === 2 && (
          <>
            <h2>과목 이름을 알려 주세요</h2>
            <input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="예: 컴퓨터 네트워크" aria-label="과목 이름" autoFocus />
            <ul className="wiz-help">
              <li>방의 이야기와 단서에 과목 이름이 쓰여요.</li>
              <li>프로그래밍 과목(파이썬·자바스크립트)이면 코드를 읽어야 열리는 방이 하나 나와요.</li>
            </ul>
          </>
        )}

        {step === 3 && (
          <>
            <h2>어떤 공간에 갇힐까요?</h2>
            <div className="choice-list">
              {THEMES.map((t) => (
                <button key={t.id} type="button" className={`choice theme-choice tc-${t.id} ${theme === t.id ? "selected" : ""}`} onClick={() => pickTheme(t.id)} aria-pressed={theme === t.id}>
                  <strong>{t.name}</strong>
                  <small>{t.desc}</small>
                </button>
              ))}
            </div>
            <ul className="wiz-help">
              <li>카드를 고르면 배경이 바로 바뀌어요.</li>
              <li>테마에 따라 그림, 소리, 단서 모양이 달라져요. 문제는 항상 내 강의자료에서만 나와요.</li>
            </ul>
          </>
        )}

        {step === 4 && (
          <>
            <h2>난이도를 골라 주세요</h2>
            <div className="choice-list">
              {(Object.keys(DIFFICULTY) as Difficulty[]).map((d) => (
                <button key={d} type="button" className={`choice ${difficulty === d ? "selected" : ""}`} onClick={() => setDifficulty(d)} aria-pressed={difficulty === d}>
                  <strong>{DIFFICULTY[d].label}</strong>
                  <small>{DIFFICULTY[d].desc}</small>
                </button>
              ))}
            </div>
            <ul className="wiz-help">
              <li>어려울수록 단서가 돌려 말해지고, 시간과 힌트가 줄어요.</li>
              <li>힌트를 다 쓰면 &quot;정답 보기&quot;를 누를 수 있어요. (결과에 기록돼요)</li>
            </ul>
          </>
        )}

        {step === 5 && (
          <>
            <h2>게임 길이를 골라 주세요</h2>
            <div className="choice-list">
              {MODES.map((m) => (
                <button key={m.id} type="button" className={`choice ${mode === m.id ? "selected" : ""}`} onClick={() => setMode(m.id)} aria-pressed={mode === m.id}>
                  <strong>{m.name}</strong>
                  <small>{m.desc}</small>
                </button>
              ))}
            </div>
            <ul className="wiz-help">
              <li>빠른 탈출은 방 {ROOMS.quickRooms}개, 전체 범위 탈출은 자료 양에 맞춰 {ROOMS.minRooms}~{ROOMS.maxRooms}개예요.</li>
              <li>다음 방은 플레이하는 동안 미리 만들어 둬서 기다리지 않아요.</li>
            </ul>
          </>
        )}

        {step === 6 && (
          <>
            <h2>놀람 연출을 켤까요?</h2>
            <label className="switch big-switch">
              <input type="checkbox" checked={surprise} onChange={(e) => setSurprise(e.target.checked)} />
              <span>놀람 주의: 공포 테마에서 귀신 실루엣이 나타납니다</span>
            </label>
            <dl className="wiz-summary">
              <div>
                <dt>과목</dt>
                <dd>{subject.trim() || "내 강의자료"}</dd>
              </div>
              <div>
                <dt>테마</dt>
                <dd>{themeName}</dd>
              </div>
              <div>
                <dt>난이도</dt>
                <dd>{DIFFICULTY[difficulty].label}</dd>
              </div>
              <div>
                <dt>길이</dt>
                <dd>{MODES.find((m) => m.id === mode)?.name}</dd>
              </div>
            </dl>
            <ul className="wiz-help">
              <li>끄면 갑자기 튀어나오지 않고 조용히 등장해요. 공포 테마의 귀신 실루엣도 나오지 않아요.</li>
              <li>휴대폰·노트북 모두 사용할 수 있어요.</li>
            </ul>
            {error && <p className="error">{error}</p>}
          </>
        )}

        <button type="button" className="btn primary big wiz-next" disabled={!valid} onClick={next}>
          {last ? "입장하기" : "다음"}
        </button>
        {!valid && <p className="tip wiz-need">{step === 1 ? "강의자료를 붙여넣어야 다음으로 갈 수 있어요." : "과목 이름을 입력해 주세요."}</p>}
      </div>
    </section>
  );
}
