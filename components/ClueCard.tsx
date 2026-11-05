"use client";

import type { Clue } from "@/lib/types";

// 단서를 형식에 맞는 모양으로 보여 준다.
// TODO(2단계): 타자 치듯 나타나는 말풍선, 도장·검은 줄 등 연출을 더 다듬는다.
export default function ClueCard({ clue }: { clue: Clue }) {
  if (clue.format === "code") {
    // 컴퓨터 화면에 뜬 코드: 줄 번호와 들여쓰기를 그대로 보여 준다
    return (
      <article className="clue-card clue-code">
        <h3>{clue.title}</h3>
        <pre className="code-screen" aria-label="코드">
          {clue.lines.map((l, i) => (
            <span key={i} className="code-line">
              <span className="code-no">{i + 1}</span>
              <span className="code-text">{l || " "}</span>
            </span>
          ))}
        </pre>
        <p className="code-note">코드를 실행하면 마지막에 무엇이 출력될까?</p>
      </article>
    );
  }
  return (
    <article className={`clue-card clue-${clue.format}`}>
      <h3>{clue.title}</h3>
      {clue.format === "sms" || clue.format === "chat" ? (
        <div className="bubbles">
          {clue.lines.map((l, i) => (
            <p key={i} className="bubble">
              {l}
            </p>
          ))}
        </div>
      ) : (
        clue.lines.map((l, i) => <p key={i}>{l}</p>)
      )}
    </article>
  );
}
