"use client";

import type { GameResult, ThemeId } from "@/lib/types";
import { WORLDS } from "@/lib/worlds";

interface Props {
  theme: ThemeId;
  result: GameResult;
  surprise: boolean; // 3단계(교수님 등장 연출)에서 사용
  onRetry: () => void;
  onStudy: () => void;
}

export default function ResultScreen({ theme, result, onRetry, onStudy }: Props) {
  const world = WORLDS[theme];
  const m = Math.floor(result.elapsedSec / 60);
  const s = result.elapsedSec % 60;

  return (
    <section className="screen">
      {result.success && (
        <figure className="escape-hero">
          <div className="escape-glow" aria-hidden="true" />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/images/escape-door.png" alt="문틈으로 빛이 새어 들어오는 열린 문" width={748} height={756} />
        </figure>
      )}
      <h1 className={`title ${result.success ? "win" : "lose"}`}>{result.success ? "탈출 성공!" : "탈출 실패…"}</h1>

      {result.success && result.ending && (
        <blockquote className="ending-box">
          <small>{world.title}</small>
          <p>{result.ending}</p>
        </blockquote>
      )}
      {!result.success && result.professorLine && (
        <p className="professor-line">
          <small className="speaker">{world.villain}</small>
          “{result.professorLine}”
        </p>
      )}
      {!result.success && result.failedConcepts && (
        <p className="tip">막힌 개념: {result.failedConcepts.join(", ")}</p>
      )}

      <dl className="scoreboard">
        <div>
          <dt>탈출한 방</dt>
          <dd>
            {result.roomsCleared} / {result.totalRooms}
          </dd>
        </div>
        <div>
          <dt>전체 걸린 시간</dt>
          <dd>
            {m}분 {s}초
          </dd>
        </div>
        <div>
          <dt>힌트 사용</dt>
          <dd>{result.hintsUsed}회</dd>
        </div>
        <div>
          <dt>정답 열람</dt>
          <dd>{result.revealedCount}회</dd>
        </div>
        <div>
          <dt>틀렸던 자물쇠</dt>
          <dd>{result.wrongLocks.length ? result.wrongLocks.join(", ") : "없음"}</dd>
        </div>
      </dl>

      {result.recaps && result.recaps.length > 0 && (
        <section className="recap-list" aria-label="스토리 속 개념 정리">
          <h3>이야기로 정리한 개념</h3>
          <ol>
            {result.recaps.map((r, i) => (
              <li key={i}>{r}</li>
            ))}
          </ol>
        </section>
      )}

      <div className="actions">
        <button className="btn ghost" onClick={onRetry}>
          다시 도전
        </button>
        <button className="btn primary" onClick={onStudy}>
          이제 진짜 공부하기
        </button>
      </div>
      {result.success && <p className="image-credit">이미지: 틸론 GPU SDXL-Turbo로 생성</p>}
    </section>
  );
}
