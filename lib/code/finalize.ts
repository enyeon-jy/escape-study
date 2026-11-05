import { isCorrect } from "../answer";
import { DIFFICULTY } from "../config";
import { layoutRoom, pickViews, type RoomSpec } from "../layout";
import type { LockType } from "../lock";
import { conceptsForRoom } from "../rooms";
import type { GameData, Room } from "../types";
import { answerFitsLock } from "../validate";
import { cluesSayAnswer, type CodeRoomPayload } from "../validateCode";
import { lastLine } from "./run";

// 코드를 실제로 실행한 결과(output)로 방을 완성한다. 정답은 실행 결과이고, AI가 말한 값은 비교에만 쓴다.
// 정답이 자물쇠에 맞지 않거나 단서에 정답이 그대로 적혀 있으면 Error → 부른 쪽이 일반 방으로 대체한다.

function pickLock(answer: string): LockType {
  if (/^\d{1,4}$/.test(answer)) return "dial-number";
  if (/^\d{5,6}$/.test(answer)) return "keypad";
  if (/^[A-Za-z]{1,6}$/.test(answer)) return "dial-alpha";
  throw new Error(`실행 결과(${answer.slice(0, 20)})를 자물쇠로 만들 수 없음`);
}

export function finalizeCodeRoom(game: GameData, index: number, p: CodeRoomPayload, output: string): Room {
  const cfg = DIFFICULTY[game.difficulty];
  const executed = lastLine(output);
  const lockType = pickLock(executed);
  if (!answerFitsLock(lockType, executed)) throw new Error("실행 결과가 자물쇠 형식에 맞지 않음");
  const answer = lockType === "dial-alpha" ? executed.toUpperCase() : executed;

  // 코드 말고 방에 놓일 단서에 정답이 그대로 쓰여 있으면 안 된다
  if (cluesSayAnswer(p.real, answer)) throw new Error("단서에 정답이 그대로 쓰여 있음");

  // AI가 말한 값과 다르면 실행 결과가 정답이다. 이때 AI의 힌트·설명은 틀릴 수 있어서 코드가 만든 문구로 바꾼다.
  const agreed = isCorrect(p.claimedAnswer, answer);
  if (!agreed) console.warn(`[코드방] AI 답(${p.claimedAnswer})과 실행 결과(${answer})가 달라 실행 결과를 정답으로 씀`);
  const hints = agreed
    ? p.hints
    : ["모니터의 코드를 맨 윗줄부터 한 줄씩 따라가 보자.", "변수 값이 줄마다 어떻게 바뀌는지 종이에 적어 봐.", "마지막 줄에서 출력되는 값이 비밀번호야."];
  const explanation = agreed ? p.explanation : `모니터의 코드를 한 줄씩 따라가며 변수 값을 계산하면 마지막에 ${answer}이(가) 출력된다. 그 값이 비밀번호다.`;

  const { views, lockedSlot } = pickViews(index);
  const conceptIds = conceptsForRoom(game.concepts, index, game.roomCount).map((c) => c.id);
  const spec: RoomSpec = {
    id: `room${index + 1}`,
    name: p.name,
    situation: p.situation,
    story: p.story,
    lockType,
    question: p.question,
    answer,
    units: [],
    hints,
    explanation,
    conceptIds,
    professorLine: p.professorLine,
    recap: p.recap,
    ending: p.ending,
    // 모니터에 뜨는 코드가 첫 번째 진짜 단서, 나머지는 코드를 어디에 쓰는지 알려 주는 단서
    real: [{ title: "컴퓨터 화면", format: "code" as const, lines: p.source.split("\n") }, ...p.real].slice(0, cfg.realClues[1]),
    fake: p.fake,
    views,
    lockedSlot,
    codeLang: p.lang,
  };
  return layoutRoom(spec, game.difficulty, index, game.roomCount);
}
