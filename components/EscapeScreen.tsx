"use client";

import { useEffect, useRef, useState } from "react";
import type { GameData, GameResult } from "@/lib/types";
import { isCorrect } from "@/lib/answer";

interface Props {
  game: GameData;
  onFinish: (r: GameResult) => void;
}

function fmt(sec: number) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export default function EscapeScreen({ game, onFinish }: Props) {
  const [roomIdx, setRoomIdx] = useState(0);
  const [remaining, setRemaining] = useState(game.timeLimitSec);
  const [input, setInput] = useState("");
  const [hintsShown, setHintsShown] = useState(0); // 현재 방에서 본 힌트 수
  const [hintsUsed, setHintsUsed] = useState(0); // 전체 힌트 사용 수
  const [wrong, setWrong] = useState<string[]>([]);
  const [shake, setShake] = useState(false);
  const [opened, setOpened] = useState(false);
  const finished = useRef(false);

  const room = game.rooms[roomIdx];
  const elapsed = game.timeLimitSec - remaining;

  function finish(success: boolean) {
    if (finished.current) return;
    finished.current = true;
    onFinish({
      success,
      elapsedSec: success ? elapsed : game.timeLimitSec,
      hintsUsed,
      wrongLocks: wrong,
      failedConcept: success ? undefined : room.concept,
    });
  }

  useEffect(() => {
    const id = setInterval(() => setRemaining((r) => Math.max(0, r - 1)), 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (remaining === 0) finish(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [remaining]);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (opened || finished.current) return;
    if (isCorrect(input, room.lock.answer, room.lock.units)) {
      setOpened(true);
      setTimeout(() => {
        if (roomIdx + 1 >= game.rooms.length) {
          finish(true);
        } else {
          setRoomIdx(roomIdx + 1);
          setInput("");
          setHintsShown(0);
          setOpened(false);
        }
      }, 900);
    } else {
      setShake(true);
      setTimeout(() => setShake(false), 500);
      if (!wrong.includes(room.name)) setWrong([...wrong, room.name]);
    }
  }

  function showHint() {
    if (hintsShown >= room.lock.hints.length) return;
    setHintsShown(hintsShown + 1);
    setHintsUsed(hintsUsed + 1);
  }

  return (
    <section className="screen">
      <header className="hud">
        <span className="room-count">
          방 {roomIdx + 1} / {game.rooms.length}
        </span>
        <span className={`timer ${remaining <= 30 ? "danger" : ""}`} aria-label="남은 시간">
          {fmt(remaining)}
        </span>
      </header>

      <h2 className="room-name">{room.name}</h2>
      <p className="situation">{room.situation}</p>

      <article className={`clue clue-${room.clue.format}`}>
        <h3>{room.clue.title}</h3>
        {room.clue.lines.map((l, i) => (
          <p key={i}>{l}</p>
        ))}
      </article>

      <form onSubmit={submit} className="lock-form">
        <div className={`lock ${shake ? "shake" : ""} ${opened ? "opened" : ""}`} aria-hidden="true">
          {opened ? "🔓" : "🔒"}
        </div>
        <p className="question">{room.lock.question}</p>
        <div className="row">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="정답 입력"
            disabled={opened}
            autoComplete="off"
          />
          <button className="btn primary" type="submit" disabled={opened}>
            열기
          </button>
        </div>
        {shake && <p className="error">철컥… 열리지 않는다.</p>}
      </form>

      <div className="hints">
        <button
          type="button"
          className="btn ghost"
          onClick={showHint}
          disabled={hintsShown >= room.lock.hints.length || opened}
        >
          🔦 힌트 ({hintsUsed}회 사용)
        </button>
        <ul>
          {room.lock.hints.slice(0, hintsShown).map((h, i) => (
            <li key={i}>{h}</li>
          ))}
        </ul>
      </div>
    </section>
  );
}
