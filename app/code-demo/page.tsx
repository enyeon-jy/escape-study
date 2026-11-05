"use client";

import { useEffect, useState } from "react";
import { runCode, type RunResult } from "@/lib/code/run";
import type { CodeLang } from "@/lib/code/safe";
import { SAMPLE_CODE } from "@/lib/sample";

// 코드 실행기를 눌러 보는 시험용 페이지 (게임 흐름과는 별개). 정상 코드, 무한 반복, 막혀야 하는 코드를 차례로 돌려 본다.
const CASES: { title: string; lang: CodeLang; source: string; expect: string }[] = [
  { title: "예시 파이썬(방에 쓰는 코드)", lang: SAMPLE_CODE.lang, source: SAMPLE_CODE.source, expect: SAMPLE_CODE.answer },
  { title: "자바스크립트 정상", lang: "javascript", source: "let sum = 0;\nfor (let i = 1; i <= 4; i++) {\n  sum += i * i;\n}\nconst label = sum > 20 ? 'big' : 'small';\nconsole.log(label);\nconsole.log(sum);", expect: "30" },
  { title: "자바스크립트 무한 반복 → 시간 초과", lang: "javascript", source: "let n = 0;\nwhile (true) {\n  n = n + 1;\n}\nconsole.log(n);\n// 끝", expect: "실패" },
  { title: "자바스크립트 네트워크 → 막힘", lang: "javascript", source: "const a = 1;\nconst b = 2;\nfetch('https://example.com');\nconsole.log(a);\nconsole.log(b);", expect: "실패" },
  { title: "파이썬 가져오기 → 막힘", lang: "python", source: "import os\nx = 1\ny = 2\nz = x + y\nprint(z)", expect: "실패" },
  { title: "파이썬 오류 → 실패", lang: "python", source: "x = 1\ny = 2\nz = x + y\nprint(undefined_name)\nprint(z)", expect: "실패" },
  { title: "파이썬 무한 반복 → 시간 초과", lang: "python", source: "n = 0\nwhile True:\n    n = n + 1\nprint(n)\n# 끝", expect: "실패" },
];

export default function CodeDemo() {
  const [rows, setRows] = useState<{ title: string; res: string; ok: boolean; ms: number }[]>([]);
  const [done, setDone] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      for (const c of CASES) {
        const t = performance.now();
        const r: RunResult = await runCode(c.lang, c.source);
        const ms = Math.round(performance.now() - t);
        const got = r.ok ? r.output.trim().split("\n").pop()! : "실패";
        const res = r.ok ? `출력 ${got}` : `실패: ${r.reason}`;
        if (!alive) return;
        setRows((x) => [...x, { title: c.title, res, ok: got === c.expect, ms }]);
      }
      if (alive) setDone(true);
    })();
    return () => {
      alive = false;
    };
  }, []);

  return (
    <main className="app" data-theme="horror" data-mode="game">
      <div className="bg" aria-hidden="true" />
      <div className="content">
        <section className="screen">
          <h1 className="title">코드 실행 시험</h1>
          <p className="tip">파이썬은 처음에 실행 도구를 내려받아 시간이 걸려요.</p>
          <ul id="results">
            {rows.map((r) => (
              <li key={r.title} data-pass={r.ok ? "yes" : "no"}>
                {r.ok ? "PASS" : "FAIL"} · {r.title} → {r.res} ({r.ms}ms)
              </li>
            ))}
          </ul>
          <p id="state">{done ? "ALL-DONE" : "running…"}</p>
        </section>
      </div>
    </main>
  );
}
