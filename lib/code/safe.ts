// 코드 자물쇠에 쓰는 코드의 형식·안전 검사. 서버(AI 응답 검사)와 브라우저(실행 직전) 양쪽에서 쓴다.
// AI가 준 코드는 믿지 않는다: 줄 수·길이를 제한하고, 파일·네트워크·가져오기 같은 위험한 말이 있으면 쓰지 않는다.

export type CodeLang = "python" | "javascript";

export const CODE_LIMITS = { minLines: 5, maxLines: 10, maxLineLen: 70, maxChars: 600 };

// 자바스크립트: 가져오기, 네트워크, 전역 객체 접근, 동적 실행 등을 막는다
const JS_BANNED =
  /\b(import|export|require|fetch|XMLHttpRequest|WebSocket|EventSource|eval|Function|constructor|prototype|__proto__|globalThis|self|window|document|process|Worker|importScripts|postMessage|localStorage|sessionStorage|indexedDB|navigator|location|setTimeout|setInterval|Promise|async|await|Reflect|Proxy|WebAssembly|Atomics|SharedArrayBuffer)\b/;

// 파이썬: 가져오기, 파일, 동적 실행, 내부 속성(__xx__), 브라우저와 이어 주는 js 모듈 등을 막는다
const PY_BANNED =
  /\b(import|from|exec|eval|compile|open|input|breakpoint|globals|locals|vars|dir|getattr|setattr|delattr|memoryview|os|sys|js|pyodide|subprocess|socket)\b|__\w+__/;

// 이 검사를 통과하면 null, 아니면 이유를 돌려준다
export function checkSource(lang: CodeLang, source: unknown): string | null {
  if (typeof source !== "string") return "코드가 글자가 아님";
  const text = source.replace(/\r\n/g, "\n").replace(/\s+$/, "");
  if (!text.trim()) return "코드가 비어 있음";
  if (text.length > CODE_LIMITS.maxChars) return `코드가 너무 김 (${text.length}자)`;
  const lines = text.split("\n");
  if (lines.length < CODE_LIMITS.minLines || lines.length > CODE_LIMITS.maxLines) return `코드 줄 수가 ${lines.length}줄 (허용 ${CODE_LIMITS.minLines}~${CODE_LIMITS.maxLines})`;
  if (lines.some((l) => l.length > CODE_LIMITS.maxLineLen)) return "한 줄이 너무 김";
  if (lines.some((l) => /\t/.test(l))) return "탭 문자가 있음 (공백만 허용)";
  const banned = (lang === "python" ? PY_BANNED : JS_BANNED).exec(text);
  if (banned) return `쓸 수 없는 말이 있음: ${banned[0]}`;
  return null;
}

export function normalizeSource(source: string): string {
  return source.replace(/\r\n/g, "\n").replace(/\s+$/, "");
}
