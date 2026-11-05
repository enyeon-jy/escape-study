import type { ThemeId } from "../types";
import { WORLDS, spaceOf } from "../worlds";

// AI에게 주는 세계관·공간·스토리 규칙 (서버에서만 사용). 일반 방과 코드 방이 함께 쓴다.
// 이야기의 틀(세계관, 공간, 인물)은 코드가 정하고, AI는 그 안에서 개념을 장치·사건으로 바꿔 쓴다.
export function worldBlock(a: { theme: ThemeId; index: number; roomCount: number }): string {
  const w = WORLDS[a.theme];
  const space = spaceOf(a.theme, a.index);
  const isFirst = a.index === 0;
  const isFinal = a.index === a.roomCount - 1;
  return `[세계관: ${w.title}] ${w.premise}
[이 방의 공간] ${space.name} — ${space.mood}. 방 이름과 단서·소품은 이 공간에 어울리게 만든다.

[스토리 규칙]
- 개념을 이 공간의 '장치'나 '사건'으로 바꿔서 표현한다. 단서와 상황이 그 장치를 거쳐 개념으로 이어져야 한다.
  예) TCP 3-way handshake → "세 번 노크해야 열리는 문", 스택 → "마지막에 쌓은 접시부터 치워야 보이는 금고".
  장치는 이해를 돕는 비유일 뿐이고, 정답은 반드시 강의자료에서 나와야 한다. 자료에 없는 개념을 지어내지 않는다.
- situation: ${isFirst ? "세계관이 시작되는 장면" : "이전 방에서 이어지는 상황 1~2문장"} + 이 공간의 모습 + 앞 벽 출구 문에 자물쇠가 달려 있다는 내용. 120자 이내.
- story: ${w.villain}이(가) 등장하거나 흔적을 남기는 진행 한 줄. 80자 이내.
- recap: 이 방을 탈출한 직후 보이는 정리 한 줄. 이 방의 개념을 장치 이야기로 풀어 "${w.recapLabel}: ..." 형식으로 쓴다. 90자 이내.
- professorLine: 탈출에 실패했을 때 ${w.villain}이(가) 하는 한 줄. 이 방의 개념과 연결한다. 실제 인물이 아니라 가상의 존재의 말투다.${isFinal ? `\n- ending: 이 방이 마지막 방이다. 문제를 풀고 이야기가 끝나는 결말 2문장 이내(120자 이내). 세계관의 마무리(예: ${w.ending})를 이 방의 개념과 엮어 쓴다.` : ""}`;
}

export const WORLD_JSON_FIELDS = (isFinal: boolean) => `  "recap": "${"탈출 직후 보이는 개념 정리 한 줄 (머리말 포함)"}",${isFinal ? '\n  "ending": "마지막 방의 결말 문장",' : ""}`;
