// 정답 비교는 AI가 아니라 코드가 한다: 띄어쓰기·대소문자·구두점·단위를 무시한다.
const IGNORED = /[\s.,!?'"`~\-_()[\]{}:;/\\]/g;

function normalize(input: string, units: string[] = []): string {
  let s = input.normalize("NFKC").toLowerCase();
  const byLength = [...units].sort((x, y) => y.length - x.length); // 긴 단위부터 지운다 (bits → bit)
  for (const u of byLength) s = s.split(u.toLowerCase()).join("");
  return s.replace(IGNORED, "");
}

export function isCorrect(input: string, answer: string, units: string[] = []): boolean {
  const a = normalize(input, units);
  return a.length > 0 && a === normalize(answer, units);
}
