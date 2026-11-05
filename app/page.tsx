"use client";

import { useEffect, useRef, useState } from "react";
import type { GameData, GameResult, Progress, Room, ThemeId } from "@/lib/types";
import { newId, saveGame, saveLog } from "@/lib/cloud";
import { clearSnapshot, loadSnapshot, saveSnapshot, type Snapshot } from "@/lib/save";
import StartScreen from "@/components/StartScreen";
import EscapeScreen from "@/components/EscapeScreen";
import ResultScreen from "@/components/ResultScreen";
import ReviewScreen from "@/components/ReviewScreen";

type Screen = "start" | "escape" | "result" | "review";

export default function Home() {
  const [screen, setScreen] = useState<Screen>("start");
  const [game, setGame] = useState<GameData | null>(null);
  const [result, setResult] = useState<GameResult | null>(null);
  const [initialProgress, setInitialProgress] = useState<Progress | null>(null);
  const [attempt, setAttempt] = useState(0); // 바뀌면 방탈출 화면을 새로 시작한다
  const [saved, setSaved] = useState<Snapshot | null>(null);
  const [preview, setPreview] = useState<ThemeId>("horror"); // 시작 화면에서 고른 테마를 바로 보여 준다

  // 저장할 최신 상태. 방이 만들어지거나 진행이 바뀔 때마다 브라우저(localStorage)에 저장한다.
  const snap = useRef<Snapshot | null>(null);
  const logId = useRef<string | null>(null); // 이번 플레이 결과 기록의 번호 (복습 완료 때 같은 기록을 갱신한다)

  useEffect(() => {
    setSaved(loadSnapshot());
  }, []);

  function persist(patch: Partial<Snapshot>) {
    if (!snap.current) return;
    snap.current = { ...snap.current, ...patch };
    saveSnapshot(snap.current);
  }

  function onGameReady(g: GameData) {
    snap.current = { screen: "escape", game: g, result: null, progress: null };
    saveSnapshot(snap.current);
    saveGame(g); // Supabase에 저장 (실패해도 게임은 계속된다)
    setGame(g);
    setResult(null);
    setInitialProgress(null);
    setAttempt((a) => a + 1);
    setScreen("escape");
  }

  function onResume() {
    if (!saved) return;
    // 예전에 저장된 게임에는 번호가 없을 수 있어서 붙여 준다
    if (!saved.game.id) saved.game = { ...saved.game, id: newId() };
    snap.current = saved;
    setGame(saved.game);
    setResult(saved.result);
    setInitialProgress(saved.progress);
    setAttempt((a) => a + 1);
    setScreen(saved.screen);
  }

  // 방이 하나 더 만들어졌을 때 (플레이하는 동안 다음 방을 미리 만든다)
  function onRoomReady(index: number, room: Room) {
    const cur = snap.current?.game;
    if (!cur || cur.rooms[index]) return;
    const rooms = [...cur.rooms];
    rooms[index] = room;
    const g = { ...cur, rooms };
    persist({ game: g });
    setGame(g);
    saveGame(g); // 새로 만들어진 방까지 갱신
  }

  function retry() {
    persist({ screen: "escape", result: null, progress: null });
    setResult(null);
    setInitialProgress(null);
    setAttempt((a) => a + 1); // 이미 만든 방을 그대로 다시 쓴다 (AI 다시 호출 안 함)
    setScreen("escape");
  }

  function backToStart() {
    clearSnapshot();
    snap.current = null;
    setSaved(null);
    setGame(null);
    setResult(null);
    setScreen("start");
  }

  const theme = game?.theme ?? preview;
  const mode = screen === "review" ? "study" : "game";

  return (
    <main className="app" data-theme={theme} data-mode={mode} data-screen={screen}>
      <div className="bg" aria-hidden="true" />
      <div className="content">
        {screen === "start" && <StartScreen saved={saved} onResume={onResume} onGameReady={onGameReady} onThemeChange={setPreview} initialTheme={preview} />}
        {screen === "escape" && game && (
          <EscapeScreen
            key={attempt}
            game={game}
            initialProgress={initialProgress}
            onProgress={(p) => persist({ progress: p })}
            onRoomReady={onRoomReady}
            onFinish={(r) => {
              logId.current = newId();
              saveLog(logId.current, game, r, false);
              persist({ screen: "result", result: r, progress: null });
              setResult(r);
              setScreen("result");
            }}
          />
        )}
        {screen === "result" && game && result && (
          <ResultScreen
            result={result}
            surprise={game.surprise}
            onRetry={retry}
            onStudy={() => {
              persist({ screen: "review" });
              setScreen("review");
            }}
          />
        )}
        {screen === "review" && game && result && <ReviewScreen
            game={game}
            result={result}
            onBack={backToStart}
            onDone={() => {
              if (logId.current) saveLog(logId.current, game, result, true); // 복습 완료로 갱신
            }}
          />}
      </div>
    </main>
  );
}
