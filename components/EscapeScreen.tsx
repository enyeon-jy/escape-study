"use client";

import { useEffect, useRef, useState } from "react";
import type { Clue, GameData, GameResult, Progress, Room } from "@/lib/types";
import { DIFFICULTY } from "@/lib/config";
import { isCorrect } from "@/lib/answer";
import { createRoom } from "@/lib/gameFactory";
import { SCENE_OBJECTS } from "@/lib/scenes";
import RoomScene from "./RoomScene";
import ClueCard from "./ClueCard";

interface Props {
  game: GameData;
  initialProgress: Progress | null;
  onProgress: (p: Progress) => void;
  onRoomReady: (index: number, room: Room) => void;
  onFinish: (r: GameResult) => void;
}

type Modal = { type: "clue"; clue: Clue } | { type: "empty"; label: string } | { type: "lock" } | null;

function fmt(sec: number) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function freshProgress(game: GameData): Progress {
  return {
    roomIdx: 0,
    remaining: DIFFICULTY[game.difficulty].roomSec,
    foundClueIds: [],
    inspected: [],
    hintsShown: 0,
    hintsUsed: 0,
    wrongRooms: [],
    clearedSec: [],
  };
}

export default function EscapeScreen({ game, initialProgress, onProgress, onRoomReady, onFinish }: Props) {
  const cfg = DIFFICULTY[game.difficulty];
  const [p, setP] = useState<Progress>(() => initialProgress ?? freshProgress(game));
  const pRef = useRef(p);
  const gameRef = useRef(game);
  gameRef.current = game;

  const [input, setInput] = useState("");
  const [modal, setModal] = useState<Modal>(null);
  const [shake, setShake] = useState(false);
  const [opened, setOpened] = useState(false);
  const openedRef = useRef(false);
  const finished = useRef(false);

  // 방 미리 만들기 상태
  const loadingIdx = useRef<number | null>(null);
  const [blockedIdx, setBlockedIdx] = useState<number | null>(null);
  const [roomError, setRoomError] = useState<string | null>(null);

  const room: Room | undefined = game.rooms[p.roomIdx];

  function update(fn: (prev: Progress) => Progress) {
    const next = fn(pRef.current);
    pRef.current = next;
    setP(next);
  }

  useEffect(() => {
    onProgress(p);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [p]);

  function finish(success: boolean, lastSpent: number) {
    if (finished.current) return;
    finished.current = true;
    const cur = pRef.current;
    const g = gameRef.current;
    const r = g.rooms[cur.roomIdx];
    const played = g.rooms.slice(0, cur.roomIdx + 1).flatMap((x) => x.conceptIds);
    const conceptName = (id: string) => g.concepts.find((c) => c.id === id)?.name ?? id;
    onFinish({
      success,
      elapsedSec: cur.clearedSec.reduce((a, b) => a + b, 0) + (success ? lastSpent : cfg.roomSec),
      hintsUsed: cur.hintsUsed,
      wrongLocks: cur.wrongRooms,
      roomsCleared: cur.clearedSec.length + (success ? 1 : 0),
      totalRooms: g.roomCount,
      playedConceptIds: Array.from(new Set(played)),
      failedConcepts: success ? undefined : r.conceptIds.map(conceptName),
      professorLine: success ? undefined : r.professorLine,
    });
  }

  // 방 타이머 (방이 준비되어 있고 문이 열리는 중이 아닐 때만 흐른다)
  useEffect(() => {
    const id = setInterval(() => {
      if (finished.current || openedRef.current) return;
      if (!gameRef.current.rooms[pRef.current.roomIdx]) return;
      const next = Math.max(0, pRef.current.remaining - 1);
      update((prev) => ({ ...prev, remaining: next }));
      if (next === 0) finish(false, 0);
    }, 1000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 지금 방과 다음 방을 미리 만든다. 실패하면 멈추고 "다시 시도" 버튼을 보여 준다 (자동 재시도 없음).
  useEffect(() => {
    const need = [p.roomIdx, p.roomIdx + 1].find((i) => i < game.roomCount && !game.rooms[i]);
    if (need === undefined || loadingIdx.current !== null || blockedIdx === need) return;
    loadingIdx.current = need;
    createRoom(game, need)
      .then((r) => {
        loadingIdx.current = null;
        setRoomError(null);
        onRoomReady(need, r);
      })
      .catch((e: Error) => {
        loadingIdx.current = null;
        setRoomError(e.message);
        setBlockedIdx(need);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [game, p.roomIdx, blockedIdx]);

  function inspect(objId: string) {
    if (!room || opened) return;
    const clueId = room.placements[objId];
    const clue = room.clues.find((c) => c.id === clueId);
    update((prev) => ({
      ...prev,
      inspected: prev.inspected.includes(objId) ? prev.inspected : [...prev.inspected, objId],
      foundClueIds: clue && !prev.foundClueIds.includes(clue.id) ? [...prev.foundClueIds, clue.id] : prev.foundClueIds,
    }));
    const label = SCENE_OBJECTS[game.theme].find((o) => o.id === objId)?.label ?? objId;
    setModal(clue ? { type: "clue", clue } : { type: "empty", label });
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!room || opened || finished.current) return;
    if (isCorrect(input, room.lock.answer, room.lock.units)) {
      openedRef.current = true;
      setOpened(true);
      setModal(null);
      setTimeout(() => {
        const cur = pRef.current;
        const spent = cfg.roomSec - cur.remaining;
        if (room.isFinal || cur.roomIdx + 1 >= gameRef.current.roomCount) {
          finish(true, spent);
        } else {
          update((prev) => ({
            ...prev,
            roomIdx: prev.roomIdx + 1,
            remaining: cfg.roomSec,
            foundClueIds: [],
            inspected: [],
            hintsShown: 0,
            clearedSec: [...prev.clearedSec, spent],
          }));
          openedRef.current = false;
          setOpened(false);
          setInput("");
        }
      }, 1400);
    } else {
      setShake(true);
      setTimeout(() => setShake(false), 500);
      if (!pRef.current.wrongRooms.includes(room.name)) {
        update((prev) => ({ ...prev, wrongRooms: [...prev.wrongRooms, room.name] }));
      }
    }
  }

  const hintLimit = room ? Math.min(cfg.hintsPerRoom, room.lock.hints.length) : 0;

  function showHint() {
    if (!room || p.hintsShown >= hintLimit || opened) return;
    update((prev) => ({ ...prev, hintsShown: prev.hintsShown + 1, hintsUsed: prev.hintsUsed + 1 }));
  }

  // 방을 아직 못 만들었을 때
  if (!room) {
    return (
      <section className="screen center">
        {roomError ? (
          <>
            <p className="error">{roomError}</p>
            <button
              className="btn primary"
              onClick={() => {
                setRoomError(null);
                setBlockedIdx(null);
              }}
            >
              다시 시도
            </button>
          </>
        ) : (
          <>
            <div className="loading-lock" aria-hidden="true">
              🔒
            </div>
            <p className="loading-text">다음 방을 준비하는 중… (시간은 흐르지 않아요)</p>
          </>
        )}
      </section>
    );
  }

  const found = room.clues.filter((c) => p.foundClueIds.includes(c.id));

  return (
    <section className="screen">
      <header className="hud">
        <span className="room-count">
          방 {p.roomIdx + 1} / {game.roomCount}
          {room.isFinal ? " · 최종 방" : ""}
        </span>
        <span className={`timer ${p.remaining <= 30 ? "danger" : ""}`} aria-label="이 방의 남은 시간">
          {fmt(p.remaining)}
        </span>
      </header>

      <h2 className="room-name">{room.name}</h2>
      <p className="story">{room.story}</p>
      <p className="situation">{room.situation}</p>

      <div className={`scene-wrap ${opened ? "unlocked" : ""}`}>
        <RoomScene
          theme={game.theme}
          lockKind={room.lock.kind}
          lockOpened={opened}
          inspected={p.inspected}
          onObject={inspect}
          onLock={() => !opened && setModal({ type: "lock" })}
        />
        {opened && <div className="unlock-msg">철컥! {room.isFinal ? "탈출구가 열렸다!" : "다음 방으로…"}</div>}
      </div>
      <p className="tip">물건을 눌러 조사해 보세요. {room.lock.kind === "door" ? "문" : "금고"}을 누르면 답을 입력할 수 있어요.</p>

      <div className="hints">
        <button type="button" className="btn ghost" onClick={showHint} disabled={p.hintsShown >= hintLimit || opened}>
          🔦 힌트 ({hintLimit - p.hintsShown}번 남음 · 총 {p.hintsUsed}회 사용)
        </button>
        <ul>
          {room.lock.hints.slice(0, p.hintsShown).map((h, i) => (
            <li key={i}>{h}</li>
          ))}
        </ul>
      </div>

      <section className="notebook" aria-label="단서 수첩">
        <h3>📓 단서 수첩 ({found.length}개)</h3>
        {found.length === 0 ? (
          <p className="tip">아직 찾은 단서가 없어요.</p>
        ) : (
          <ul>
            {found.map((c) => (
              <li key={c.id}>
                <button type="button" onClick={() => setModal({ type: "clue", clue: c })}>
                  {c.title}
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      {modal && (
        <div className="modal" role="dialog" aria-modal="true" onClick={() => setModal(null)}>
          <div className="modal-body" onClick={(e) => e.stopPropagation()}>
            {modal.type === "clue" && <ClueCard clue={modal.clue} />}
            {modal.type === "empty" && <p className="empty-msg">{modal.label}… 아무것도 없다.</p>}
            {modal.type === "lock" && (
              <form onSubmit={submit} className="lock-form">
                <div className={`lock ${shake ? "shake" : ""}`} aria-hidden="true">
                  🔒
                </div>
                <p className="question">{room.lock.question}</p>
                <div className="row">
                  <input value={input} onChange={(e) => setInput(e.target.value)} placeholder="정답 입력" autoComplete="off" autoFocus />
                  <button className="btn primary" type="submit">
                    열기
                  </button>
                </div>
                {shake && <p className="error">철컥… 열리지 않는다.</p>}
                <p className="tip">수첩의 단서를 조합해 보세요.</p>
              </form>
            )}
            <button type="button" className="btn ghost close" onClick={() => setModal(null)}>
              닫기
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
