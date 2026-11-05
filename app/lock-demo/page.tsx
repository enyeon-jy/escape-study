"use client";

import { useState } from "react";
import LockPanel from "@/components/LockPanel";
import type { LockLike } from "@/lib/lock";

// 자물쇠 4종류를 한 화면에서 눌러 보는 시험용 페이지 (게임 흐름과는 별개)
const DEMOS: { title: string; hint: string; lock: LockLike }[] = [
  { title: "숫자 다이얼", hint: "정답: 007", lock: { type: "dial-number", answer: "7" } },
  { title: "알파벳 다이얼", hint: "정답: HTTPS", lock: { type: "dial-alpha", answer: "HTTPS" } },
  { title: "키패드 도어락", hint: "정답: 32", lock: { type: "keypad", answer: "32" } },
  { title: "방향 자물쇠", hint: "정답: ↑ ↓ ← →", lock: { type: "direction", answer: "UDLR" } },
];

export default function LockDemo() {
  const [i, setI] = useState(0);
  const [round, setRound] = useState(0);
  const [msg, setMsg] = useState("");
  const d = DEMOS[i];

  return (
    <main className="app" data-theme="horror" data-mode="game">
      <div className="bg" aria-hidden="true" />
      <div className="content">
        <section className="screen">
          <h1 className="title">자물쇠 시험</h1>
          <div className="actions">
            {DEMOS.map((x, k) => (
              <button
                key={x.title}
                className={`btn ${k === i ? "primary" : "ghost"}`}
                onClick={() => {
                  setI(k);
                  setRound((r) => r + 1);
                  setMsg("");
                }}
              >
                {x.title}
              </button>
            ))}
          </div>
          <p className="tip">{d.hint}</p>
          <LockPanel
            key={`${i}-${round}`}
            lock={d.lock}
            onSolved={() => {
              setMsg("열렸다!");
              setRound((r) => r + 1);
            }}
            onWrong={() => setMsg("틀렸다…")}
            onClose={() => setMsg("닫기")}
          />
          <p>{msg}</p>
        </section>
      </div>
    </main>
  );
}
