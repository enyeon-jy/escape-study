"use client";

import { useState } from "react";
import type { GameData } from "@/lib/types";
import { isCorrect } from "@/lib/answer";

interface Props {
  game: GameData;
  onBack: () => void;
}

export default function ReviewScreen({ game, onBack }: Props) {
  // 틀린 문제는 맞힐 때까지 다시 나오도록 큐 맨 뒤로 보낸다.
  const [queue, setQueue] = useState(() => game.review.map((_, i) => i));
  const [input, setInput] = useState("");
  const [feedback, setFeedback] = useState<"none" | "right" | "wrong">("none");

  if (queue.length === 0) {
    return (
      <section className="screen center">
        <h1 className="title">복습 완료!</h1>
        <p>모든 문제를 맞혔어요.</p>
        <p className="tip">내일 한 번 더 풀면 오래 기억에 남아요.</p>
        <button className="btn primary" onClick={onBack}>
          처음으로
        </button>
      </section>
    );
  }

  const item = game.review[queue[0]];

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (feedback !== "none") return;
    setFeedback(isCorrect(input, item.answer, item.units) ? "right" : "wrong");
  }

  function next() {
    setQueue((q) => (feedback === "right" ? q.slice(1) : [...q.slice(1), q[0]]));
    setInput("");
    setFeedback("none");
  }

  return (
    <section className="screen">
      <p className="progress">남은 문제 {queue.length}개</p>
      <h2 className="review-prompt">{item.prompt}</h2>

      <form onSubmit={submit} className="row">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="빈칸에 들어갈 말"
          disabled={feedback !== "none"}
          autoComplete="off"
        />
        <button className="btn primary" type="submit" disabled={feedback !== "none"}>
          확인
        </button>
      </form>

      {feedback !== "none" && (
        <div className={`feedback ${feedback}`}>
          <p>{feedback === "right" ? "정답이에요!" : "아쉬워요. 다시 나올 거예요."}</p>
          <p className="explain">{item.explanation}</p>
          <button className="btn primary" onClick={next}>
            다음
          </button>
        </div>
      )}
    </section>
  );
}
