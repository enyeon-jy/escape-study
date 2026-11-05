// 브라우저에서 코드를 실제로 실행해 정답을 정한다. AI가 말한 값은 믿지 않는다.
// - 자바스크립트: 제한된 Web Worker에서 실행 (네트워크·전역 접근을 막고, 시간이 지나면 강제 종료)
// - 파이썬: 무료 오픈소스 Pyodide(브라우저용 파이썬)를 Web Worker에서 실행. 처음 한 번 내려받는다 (jsDelivr CDN, 무료)
// 서버는 코드를 실행하지 않는다. 실행이 안 되거나 오래 걸리면 실패로 돌려주고, 부른 쪽이 일반 방으로 대체한다.
import { checkSource, normalizeSource, type CodeLang } from "./safe";

export type RunResult = { ok: true; output: string } | { ok: false; reason: string };

export const RUN_LIMITS = {
  jsMs: 2_000, // 자바스크립트 실행 제한
  pyRunMs: 6_000, // 파이썬 코드 실행 제한 (내려받기가 끝난 뒤)
  pyLoadMs: 30_000, // 파이썬 실행 도구를 내려받는 제한
  maxOutput: 200,
};

export const PYODIDE_URL = "https://cdn.jsdelivr.net/pyodide/v0.26.4/full/pyodide.js";

function makeWorker(src: string): Worker {
  const url = URL.createObjectURL(new Blob([src], { type: "text/javascript" }));
  const w = new Worker(url);
  URL.revokeObjectURL(url);
  return w;
}

// 실행 결과의 마지막 줄을 정답 후보로 쓴다
export function lastLine(output: string): string {
  const lines = output.split("\n").map((l) => l.trim()).filter(Boolean);
  return lines[lines.length - 1] ?? "";
}

// ── 자바스크립트 ────────────────────────────────────────────────────
const JS_WORKER = `
const post = self.postMessage.bind(self);
const BLOCK = ["fetch","XMLHttpRequest","WebSocket","EventSource","importScripts","indexedDB","caches","navigator","location","postMessage","setTimeout","setInterval","close","Worker","SharedWorker"];
self.onmessage = (e) => {
  const out = [];
  const log = (...a) => { out.push(a.map(String).join(" ")); if (out.length > 200) throw new Error("출력이 너무 많음"); };
  const fake = { log, info: log };
  for (const k of BLOCK) { try { Object.defineProperty(self, k, { value: undefined, configurable: false, writable: false }); } catch (_) {} }
  try {
    const f = new Function("console", '"use strict";\\n' + e.data.source);
    f(fake);
    post({ ok: true, output: out.join("\\n") });
  } catch (err) {
    post({ ok: false, reason: String(err && err.message || err).slice(0, 120) });
  }
};
`;

function runJavaScript(source: string): Promise<RunResult> {
  return new Promise((resolve) => {
    let worker: Worker;
    try {
      worker = makeWorker(JS_WORKER);
    } catch {
      resolve({ ok: false, reason: "Worker를 만들 수 없음" });
      return;
    }
    const done = (r: RunResult) => {
      clearTimeout(timer);
      worker.terminate();
      resolve(r);
    };
    const timer = setTimeout(() => done({ ok: false, reason: "실행 시간 초과" }), RUN_LIMITS.jsMs);
    worker.onmessage = (e: MessageEvent<RunResult>) => done(e.data);
    worker.onerror = () => done({ ok: false, reason: "실행 중 오류" });
    worker.postMessage({ source });
  });
}

// ── 파이썬 (Pyodide) ────────────────────────────────────────────────
const PY_WORKER = `
let pyodide = null;
self.onmessage = async (e) => {
  const m = e.data;
  if (m.type === "init") {
    try {
      importScripts(m.url);
      pyodide = await loadPyodide();
      self.postMessage({ type: "ready" });
    } catch (err) {
      self.postMessage({ type: "initfail", reason: String(err && err.message || err).slice(0, 120) });
    }
    return;
  }
  if (m.type === "run") {
    let out = "";
    try {
      pyodide.setStdout({ batched: (s) => { out += s + "\\n"; } });
      pyodide.setStderr({ batched: () => {} });
      const g = pyodide.globals.get("dict")();
      pyodide.runPython(m.source, { globals: g });
      g.destroy();
      self.postMessage({ type: "result", id: m.id, ok: true, output: out });
    } catch (err) {
      self.postMessage({ type: "result", id: m.id, ok: false, reason: String(err && err.message || err).split("\\n").slice(-2).join(" ").slice(0, 120) });
    }
  }
};
`;

interface PyHandle {
  worker: Worker;
  ready: Promise<boolean>;
}
let py: PyHandle | null = null;
let pyRun = 0;

function startPython(): PyHandle {
  if (py) return py;
  const worker = makeWorker(PY_WORKER);
  const ready = new Promise<boolean>((resolve) => {
    const timer = setTimeout(() => {
      resolve(false);
      resetPython();
    }, RUN_LIMITS.pyLoadMs);
    worker.addEventListener("message", function onMsg(e: MessageEvent<{ type: string }>) {
      if (e.data.type === "ready" || e.data.type === "initfail") {
        clearTimeout(timer);
        worker.removeEventListener("message", onMsg);
        if (e.data.type === "initfail") resetPython();
        resolve(e.data.type === "ready");
      }
    });
    worker.addEventListener("error", () => {
      clearTimeout(timer);
      resolve(false);
      resetPython();
    });
  });
  worker.postMessage({ type: "init", url: PYODIDE_URL });
  py = { worker, ready };
  return py;
}

function resetPython() {
  py?.worker.terminate();
  py = null;
}

// 방을 만들기 전에 미리 내려받아 두면 기다리지 않는다 (실패해도 조용히 넘어감)
export function warmPython() {
  try {
    startPython();
  } catch {
    // 무시
  }
}

async function runPython(source: string): Promise<RunResult> {
  let h: PyHandle;
  try {
    h = startPython();
  } catch {
    return { ok: false, reason: "Worker를 만들 수 없음" };
  }
  if (!(await h.ready)) return { ok: false, reason: "파이썬 실행 도구를 불러오지 못함" };
  const worker = h.worker;
  const id = ++pyRun;
  return new Promise<RunResult>((resolve) => {
    const timer = setTimeout(() => {
      worker.removeEventListener("message", onMsg);
      resetPython(); // 무한 반복일 수 있어 작업자를 통째로 끝낸다
      resolve({ ok: false, reason: "실행 시간 초과" });
    }, RUN_LIMITS.pyRunMs);
    function onMsg(e: MessageEvent<{ type: string; id: number; ok: boolean; output?: string; reason?: string }>) {
      if (e.data.type !== "result" || e.data.id !== id) return;
      clearTimeout(timer);
      worker.removeEventListener("message", onMsg);
      resolve(e.data.ok ? { ok: true, output: e.data.output ?? "" } : { ok: false, reason: e.data.reason ?? "실행 오류" });
    }
    worker.addEventListener("message", onMsg);
    worker.postMessage({ type: "run", id, source });
  });
}

// ── 공통 입구 ───────────────────────────────────────────────────────
export async function runCode(lang: CodeLang, source: string): Promise<RunResult> {
  const bad = checkSource(lang, source); // 실행 직전에 한 번 더 검사
  if (bad) return { ok: false, reason: bad };
  const text = normalizeSource(source);
  const r = lang === "python" ? await runPython(text) : await runJavaScript(text);
  if (r.ok && (r.output.length > RUN_LIMITS.maxOutput || !lastLine(r.output))) return { ok: false, reason: "출력이 없거나 너무 김" };
  return r;
}
