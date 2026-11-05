"use client";

import type { GameData, GameResult } from "@/lib/types";

interface Props {
  game: GameData;
  result: GameResult;
  surprise: boolean; // 3단계(교수님 등장 연출)에서 사용
  onRetry: () => void;
  onStudy: () => void;
}

export default function ResultScreen({ game, result, onRetry, onStudy }: Props) {
  const failedRoom = game.rooms.find((r) => r.concept === result.failedConcept);
  const m = Math.floor(result.elapsedSec / 60);
  const s = result.elapsedSec % 60;

  return (
    <section className="screen">
      <h1 className={`title ${result.success ? "win" : "lose"}`}>
        {result.success ? "탈출 성공!" : "탈출 실패…"}
      </h1>

      {!result.success && failedRoom && <p className="professor-line">“{failedRoom.professorLine}”</p>}

      <dl className="scoreboard">
        <div>
          <dt>걸린 시간</dt>
          <dd>
            {m}분 {s}초
          </dd>
        </div>
        <div>
          <dt>힌트 사용</dt>
          <dd>{result.hintsUsed}회</dd>
        </div>
        <div>
          <dt>틀렸던 자물쇠</dt>
          <dd>{result.wrongLocks.length ? result.wrongLocks.join(", ") : "없음"}</dd>
        </div>
      </dl>

      <div className="actions">
        <button className="btn ghost" onClick={onRetry}>
          다시 도전
        </button>
        <button className="btn primary" onClick={onStudy}>
          이제 진짜 공부하기
        </button>
      </div>
    </section>
  );
}
