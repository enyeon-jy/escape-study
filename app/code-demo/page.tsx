"use client";

import { useEffect, useState } from "react";
import { runCode, type RunResult } from "@/lib/code/run";
import type { CodeLang } from "@/lib/code/safe";
import { finalizeCodeRoom } from "@/lib/code/finalize";
import { SAMPLE_CODE, sampleCreateGame } from "@/lib/sample";
import type { CodeRoomPayload } from "@/lib/validateCode";

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

// AI가 준 것처럼 꾸민 코드 방 내용으로, 실행 결과 → 방 완성 과정을 시험한다 (AI 호출 없음)
function fakePayload(claimed: string, realLine = "금고 번호는 모니터 프로그램이 마지막으로 출력하는 값이다."): CodeRoomPayload {
  return {
    name: "서버실",
    situation: "모니터에 코드가 떠 있고 출구 문에 자물쇠가 달려 있다.",
    story: "3 / 서버실",
    professorLine: "반복문도 못 읽나?",
    lang: SAMPLE_CODE.lang,
    source: SAMPLE_CODE.source,
    question: "코드를 실행하면 마지막에 출력되는 값은?",
    claimedAnswer: claimed,
    hints: ["AI 힌트1", "AI 힌트2", "AI 힌트3"],
    explanation: "AI 설명",
    real: [{ format: "note", title: "쪽지", lines: [realLine] }],
    fake: [],
  };
}

const OUT_9 = ["9", ""].join(String.fromCharCode(10)); // 코드가 "9"를 출력한 결과
const OUT_TEXT = ["hello world", ""].join(String.fromCharCode(10));

function roomTests(): { title: string; pass: boolean; detail: string }[] {
  const game = { ...sampleCreateGame({ subject: "파이썬", theme: "detective", difficulty: "easy", mode: "quick", surprise: true }), isSample: false, roomCount: 3 };
  const out: { title: string; pass: boolean; detail: string }[] = [];
  const t = (title: string, fn: () => string, ok: (d: string) => boolean) => {
    let d: string;
    try {
      d = fn();
    } catch (e) {
      d = "Error: " + (e instanceof Error ? e.message : e);
    }
    out.push({ title, pass: ok(d), detail: d });
  };
  t("AI 답이 맞을 때: 실행 결과 9가 정답, AI 힌트 유지", () => {
    const r = finalizeCodeRoom(game, 1, fakePayload("9"), OUT_9);
    const mon = r.views.flatMap((v) => v.slots).find((s) => s.shape === "monitor");
    return `답=${r.lock.answer} 종류=${r.lock.type} 힌트=${r.lock.hints[0]} 언어=${r.codeLang} 모니터=${mon?.content?.clueId ?? "없음"}`;
  }, (d) => d.includes("답=9 종류=dial-number 힌트=AI 힌트1 언어=python") && !d.includes("없음"));
  t("AI 답이 틀릴 때: 실행 결과가 정답, 힌트·설명은 코드가 만든 문구", () => {
    const r = finalizeCodeRoom(game, 1, fakePayload("12"), OUT_9);
    return `답=${r.lock.answer} 힌트=${r.lock.hints[0]}`;
  }, (d) => d.startsWith("답=9 힌트=모니터의 코드를"));
  t("단서에 정답이 그대로 쓰여 있으면 실패(→ 일반 방으로 대체)", () => finalizeCodeRoom(game, 1, fakePayload("9", "비밀번호는 9다"), OUT_9).lock.answer, (d) => d.startsWith("Error"));
  t("실행 결과가 문장이면 실패(→ 일반 방으로 대체)", () => finalizeCodeRoom(game, 1, fakePayload("9"), OUT_TEXT).lock.answer, (d) => d.startsWith("Error"));
  return out;
}

export default function CodeDemo() {
  const [rooms, setRooms] = useState<{ title: string; pass: boolean; detail: string }[]>([]);
  useEffect(() => setRooms(roomTests()), []);

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
          <ul id="rooms">
            {rooms.map((r) => (
              <li key={r.title} data-pass={r.pass ? "yes" : "no"}>
                {r.pass ? "PASS" : "FAIL"} · {r.title} → {r.detail}
              </li>
            ))}
          </ul>
          <p id="state">{done ? "ALL-DONE" : "running…"}</p>
        </section>
      </div>
    </main>
  );
}
