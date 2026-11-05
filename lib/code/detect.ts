import type { CodeLang } from "./safe";

// 프로그래밍 과목인지 판별한다. AI가 아니라 코드가 과목명과 강의자료의 글자를 보고 정한다.
// 지원하는 언어(파이썬, 자바스크립트)가 아니면 null → 코드 자물쇠는 나오지 않는다. (SQL·자바 등은 아직 미지원)
const THRESHOLD = 3;

const PY_NAME = /파이썬|python|파이선/i;
const PY_CODE = [/\bdef\s+\w+\s*\(/, /\bprint\s*\(/, /\bfor\s+\w+\s+in\s+/, /\belif\b/, /\brange\s*\(/, /\bimport\s+\w+/, /:\s*$/m];

const JS_NAME = /자바스크립트|javascript|node\.?js|\bjs\b/i;
const JS_CODE = [/console\.log\s*\(/, /\b(const|let)\s+\w+\s*=/, /=>/, /\bfunction\s+\w*\s*\(/, /===/, /\.(map|filter|reduce|forEach)\s*\(/];

function score(subject: string, material: string, name: RegExp, code: RegExp[]): number {
  let s = 0;
  if (name.test(subject)) s += 3;
  if (name.test(material)) s += 2;
  for (const re of code) if (re.test(material)) s += 1;
  return s;
}

export function detectCodeLang(subject: string, material: string): CodeLang | null {
  const py = score(subject, material, PY_NAME, PY_CODE);
  const js = score(subject, material, JS_NAME, JS_CODE);
  const best = Math.max(py, js);
  if (best < THRESHOLD) return null;
  return py >= js ? "python" : "javascript";
}

// 코드 방을 몇 번째 방에 둘지 (첫 방은 튜토리얼이라 제외). 방은 딱 하나만 만든다.
export function codeRoomIndex(roomCount: number): number {
  return Math.max(1, Math.min(roomCount - 1, Math.floor(roomCount / 2)));
}
