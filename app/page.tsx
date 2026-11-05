"use client";

import { useState } from "react";
import type { GameData, GameResult, ThemeId } from "@/lib/types";
import { sampleGame } from "@/lib/sample";
import StartScreen from "@/components/StartScreen";
import EscapeScreen from "@/components/EscapeScreen";
import ResultScreen from "@/components/ResultScreen";
import ReviewScreen from "@/components/ReviewScreen";

type Screen = "start" | "escape" | "result" | "review";

export default function Home() {
  const [screen, setScreen] = useState<Screen>("start");
  const [game, setGame] = useState<GameData | null>(null);
  const [result, setResult] = useState<GameResult | null>(null);
  const [surprise, setSurprise] = useState(true);
  const [attempt, setAttempt] = useState(0); // 다시 도전할 때 EscapeScreen을 새로 시작하기 위한 값

  // 1단계: AI 없이 예시 데이터로 게임을 만든다. (4단계에서 AI 호출로 교체)
  function enter(opts: { subject: string; theme: ThemeId; surprise: boolean }) {
    const data = sampleGame(opts.theme);
    if (opts.subject.trim()) data.subject = opts.subject.trim();
    setGame(data);
    setSurprise(opts.surprise);
    setAttempt((a) => a + 1);
    setScreen("escape");
  }

  const theme = game?.theme ?? "horror";
  const mode = screen === "review" ? "study" : "game";

  return (
    <main className="app" data-theme={theme} data-mode={mode}>
      <div className="bg" aria-hidden="true" />
      <div className="content">
        {screen === "start" && <StartScreen onEnter={enter} />}
        {screen === "escape" && game && (
          <EscapeScreen
            key={attempt}
            game={game}
            onFinish={(r) => {
              setResult(r);
              setScreen("result");
            }}
          />
        )}
        {screen === "result" && game && result && (
          <ResultScreen
            game={game}
            result={result}
            surprise={surprise}
            onRetry={() => {
              setAttempt((a) => a + 1);
              setScreen("escape");
            }}
            onStudy={() => setScreen("review")}
          />
        )}
        {screen === "review" && game && (
          <ReviewScreen game={game} onBack={() => setScreen("start")} />
        )}
      </div>
    </main>
  );
}
