"use client";

import { useEffect, useRef, useState } from "react";
import { DIRECTION_SYMBOL, LOCK_NAME, checkLock, cleanAnswer, dialWheels, type LockLike } from "@/lib/lock";
import { sfx } from "@/lib/sound";

interface Props {
  lock: LockLike;
  onSolved: () => void;
  onWrong: () => void;
  onClose: () => void;
}

type Status = "idle" | "wrong" | "ok";

const DIGITS = "0123456789".split("");
const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
const STEP_PX = 26; // 이만큼 쓸어야 한 칸 돌아간다

// 위아래로 쓸거나 ▲▼ 버튼, 마우스 휠로 돌리는 숫자/글자 바퀴
function Wheel({ symbols, index, onStep, disabled }: { symbols: string[]; index: number; onStep: (d: number) => void; disabled: boolean }) {
  const startY = useRef<number | null>(null);
  const n = symbols.length;
  const at = (i: number) => symbols[(i + n) % n];

  function down(e: React.PointerEvent) {
    if (disabled) return;
    startY.current = e.clientY;
    e.currentTarget.setPointerCapture(e.pointerId);
  }
  function move(e: React.PointerEvent) {
    if (startY.current === null || disabled) return;
    const d = startY.current - e.clientY; // 위로 쓸면 +
    const steps = Math.trunc(d / STEP_PX);
    if (steps !== 0) {
      onStep(steps);
      startY.current -= steps * STEP_PX;
    }
  }
  function up() {
    startY.current = null;
  }

  return (
    <div className="wheel-col">
      <button type="button" className="wheel-btn" aria-label="위로" disabled={disabled} onClick={() => onStep(1)}>
        ▲
      </button>
      <div
        className="wheel"
        onPointerDown={down}
        onPointerMove={move}
        onPointerUp={up}
        onPointerCancel={up}
        onWheel={(e) => !disabled && onStep(e.deltaY > 0 ? 1 : -1)}
        role="spinbutton"
        aria-valuetext={at(index)}
      >
        <span className="wheel-side">{at(index - 1)}</span>
        <span className="wheel-cur">{at(index)}</span>
        <span className="wheel-side">{at(index + 1)}</span>
      </div>
      <button type="button" className="wheel-btn" aria-label="아래로" disabled={disabled} onClick={() => onStep(-1)}>
        ▼
      </button>
    </div>
  );
}

export default function LockPanel({ lock, onSolved, onWrong, onClose }: Props) {
  const answer = cleanAnswer(lock.type, lock.answer);
  const isDial = lock.type === "dial-number" || lock.type === "dial-alpha";
  const wheels = isDial ? dialWheels(lock) : 0;
  const symbols = lock.type === "dial-alpha" ? LETTERS : DIGITS;

  const [vals, setVals] = useState<number[]>(() => Array(wheels).fill(0));
  const [seq, setSeq] = useState(""); // 키패드·방향 자물쇠에서 지금까지 누른 것
  const [status, setStatus] = useState<Status>("idle");
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    const t = timers.current;
    return () => t.forEach(clearTimeout);
  }, []);

  function later(fn: () => void, ms: number) {
    timers.current.push(setTimeout(fn, ms));
  }

  function judge(value: string) {
    if (status !== "idle") return;
    if (checkLock(lock, value)) {
      setStatus("ok");
      sfx.unlock();
      later(onSolved, 1000);
    } else {
      setStatus("wrong");
      sfx.error();
      onWrong();
      later(() => {
        setStatus("idle");
        setSeq("");
      }, 800);
    }
  }

  function step(i: number, d: number) {
    sfx.tick();
    setVals((v) => v.map((x, j) => (j === i ? (((x + d) % symbols.length) + symbols.length) % symbols.length : x)));
  }

  function press(ch: string) {
    if (status !== "idle") return;
    sfx.beep();
    const next = seq + ch;
    setSeq(next);
    if (next.length >= answer.length) judge(next);
  }

  const dialValue = vals.map((v) => symbols[v]).join("");

  return (
    <div className={`lockpanel type-${lock.type} ${status}`}>
      <h3>{LOCK_NAME[lock.type]}</h3>

      {isDial && (
        <>
          <div className={`padlock ${status === "ok" ? "open" : ""} ${status === "wrong" ? "shake" : ""}`}>
            <div className="shackle" />
            <div className="padlock-body">
              {vals.map((v, i) => (
                <Wheel key={i} symbols={symbols} index={v} onStep={(d) => step(i, d)} disabled={status !== "idle"} />
              ))}
            </div>
          </div>
          <p className="tip">
            위아래로 쓸어서 돌려요.
            {lock.type === "dial-number" ? " 빈 앞자리는 0으로 두세요." : ""}
          </p>
          <button type="button" className="btn primary" disabled={status !== "idle"} onClick={() => judge(dialValue)}>
            열기
          </button>
        </>
      )}

      {lock.type === "keypad" && (
        <div className={`keypad ${status === "wrong" ? "shake" : ""}`}>
          <div className="keypad-top">
            <span className={`led red ${status === "wrong" ? "on" : ""}`} />
            <span className="keypad-display">{seq.padEnd(answer.length, "·")}</span>
            <span className={`led green ${status === "ok" ? "on" : ""}`} />
          </div>
          <div className="keys">
            {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((k) => (
              <button key={k} type="button" className="key" onClick={() => press(k)}>
                {k}
              </button>
            ))}
            <button type="button" className="key small" onClick={() => setSeq("")}>
              지움
            </button>
            <button type="button" className="key" onClick={() => press("0")}>
              0
            </button>
            <span />
          </div>
          <p className="tip">번호를 누르면 자동으로 확인돼요.</p>
        </div>
      )}

      {lock.type === "direction" && (
        <div className={`dirlock ${status === "wrong" ? "shake" : ""}`}>
          <div className="keypad-top">
            <span className={`led red ${status === "wrong" ? "on" : ""}`} />
            <span className="keypad-display">
              {Array.from({ length: answer.length }, (_, i) => (seq[i] ? DIRECTION_SYMBOL[seq[i]] : "·")).join(" ")}
            </span>
            <span className={`led green ${status === "ok" ? "on" : ""}`} />
          </div>
          <div className="dirpad">
            <button type="button" className="key up" onClick={() => press("U")} aria-label="위">
              ↑
            </button>
            <button type="button" className="key left" onClick={() => press("L")} aria-label="왼쪽">
              ←
            </button>
            <button type="button" className="key right" onClick={() => press("R")} aria-label="오른쪽">
              →
            </button>
            <button type="button" className="key down" onClick={() => press("D")} aria-label="아래">
              ↓
            </button>
          </div>
          <p className="tip">순서대로 눌러요. ({answer.length}번)</p>
        </div>
      )}

      <button type="button" className="btn ghost" onClick={onClose}>
        닫기
      </button>
    </div>
  );
}
