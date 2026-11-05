"use client";

import { useEffect, useRef, useState } from "react";
import type { Clue, GameData, GameResult, Item, Progress, Room, RoomView, ViewId } from "@/lib/types";
import { DIFFICULTY, STORY_INTRO } from "@/lib/config";
import { createRoom } from "@/lib/gameFactory";
import { SPOT_LABEL, WALL_LABEL, WALL_ORDER, type WallId } from "@/lib/scenes";
import { isMuted, setMuted, sfx } from "@/lib/sound";
import RoomScene from "./RoomScene";
import ZoomView from "./ZoomView";
import ClueCard from "./ClueCard";
import LockPanel from "./LockPanel";

interface Props {
  game: GameData;
  initialProgress: Progress | null;
  onProgress: (p: Progress) => void;
  onRoomReady: (index: number, room: Room) => void;
  onFinish: (r: GameResult) => void;
}

type Modal = { type: "clue"; clue: Clue } | { type: "item"; item: Item } | { type: "lock" } | { type: "reveal" } | null;

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
    bag: [],
    unlocked: [],
    hintsShown: 0,
    hintsUsed: 0,
    revealedRooms: [],
    wrongRooms: [],
    clearedSec: [],
  };
}

interface SpotInfo {
  label: string;
  content: { clueId?: string; itemId?: string } | null;
  lockedBy?: string;
}

function findSpot(room: Room, id: string): SpotInfo | null {
  if (id in room.wallSpots) return { label: SPOT_LABEL[id] ?? id, content: room.wallSpots[id] };
  for (const v of room.views) {
    const s = v.slots.find((x) => x.id === id);
    if (s) return { label: s.label, content: s.content, lockedBy: s.lockedBy };
  }
  return null;
}

export default function EscapeScreen({ game, initialProgress, onProgress, onRoomReady, onFinish }: Props) {
  const cfg = DIFFICULTY[game.difficulty];
  const [p, setP] = useState<Progress>(() => initialProgress ?? freshProgress(game));
  const pRef = useRef(p);
  const gameRef = useRef(game);
  gameRef.current = game;

  const [wall, setWall] = useState<WallId>("front");
  const [zoom, setZoom] = useState<ViewId | null>(null);
  const [selected, setSelected] = useState<string | null>(null); // 가방에서 고른 아이템
  const [toast, setToast] = useState<string | null>(null);
  const [modal, setModal] = useState<Modal>(null);
  const [opened, setOpened] = useState(false);
  const openedRef = useRef(false);
  const finished = useRef(false);
  const [intro, setIntro] = useState(initialProgress === null); // 새 게임이면 세계관 소개부터
  const introRef = useRef(intro);
  const [tipOpen, setTipOpen] = useState(true);
  const [muted, setMutedState] = useState(false);

  useEffect(() => setMutedState(isMuted()), []);

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

  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(null), 2600);
    return () => clearTimeout(id);
  }, [toast]);

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
      revealedCount: cur.revealedRooms.length,
      revealedConceptIds: Array.from(new Set(g.rooms.filter((x) => cur.revealedRooms.includes(x.id)).flatMap((x) => x.conceptIds))),
      roomsCleared: cur.clearedSec.length + (success ? 1 : 0),
      totalRooms: g.roomCount,
      playedConceptIds: Array.from(new Set(played)),
      failedConcepts: success ? undefined : r.conceptIds.map(conceptName),
      professorLine: success ? undefined : r.professorLine,
    });
  }

  // 방 타이머: 방이 준비되어 있고, 소개 중이 아니며, 문이 열리는 중이 아닐 때만 흐른다
  useEffect(() => {
    const id = setInterval(() => {
      if (finished.current || openedRef.current || introRef.current) return;
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

  function reveal(id: string, info: SpotInfo) {
    const cur = pRef.current;
    const already = cur.inspected.includes(id);
    update((prev) => ({ ...prev, inspected: prev.inspected.includes(id) ? prev.inspected : [...prev.inspected, id] }));
    const c = info.content;
    const clue = c?.clueId ? room?.clues.find((x) => x.id === c.clueId) : undefined;
    const item = c?.itemId ? room?.items.find((x) => x.id === c.itemId) : undefined;
    if (clue) {
      update((prev) => ({ ...prev, foundClueIds: prev.foundClueIds.includes(clue.id) ? prev.foundClueIds : [...prev.foundClueIds, clue.id] }));
      setModal({ type: "clue", clue });
    } else if (item) {
      if (already) {
        setToast("이미 가져왔다.");
      } else {
        sfx.pickup();
        update((prev) => ({ ...prev, bag: [...prev.bag, item.id] }));
        setModal({ type: "item", item });
      }
    } else {
      setToast(`${info.label}… 아무것도 없다.`);
    }
  }

  function pressSpot(id: string) {
    if (!room || opened || finished.current) return;
    const info = findSpot(room, id);
    if (!info) {
      setToast("아무것도 없다.");
      return;
    }
    const cur = pRef.current;
    if (info.lockedBy && !cur.unlocked.includes(id)) {
      if (selected === info.lockedBy) {
        sfx.unlock();
        update((prev) => ({ ...prev, unlocked: [...prev.unlocked, id], bag: prev.bag.filter((b) => b !== info.lockedBy) }));
        setSelected(null);
        setToast(`열쇠로 ${info.label}을(를) 열었다!`);
        reveal(id, info);
      } else {
        sfx.error();
        setToast(`${info.label}은(는) 잠겨 있다. 가방에서 아이템을 고른 뒤 눌러 보세요.`);
      }
      return;
    }
    reveal(id, info);
  }

  function solved() {
    if (!room) return;
    openedRef.current = true;
    setOpened(true);
    setModal(null);
    setZoom(null);
    setWall("front");
    sfx.door();
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
          bag: [],
          unlocked: [],
          hintsShown: 0,
          clearedSec: [...prev.clearedSec, spent],
        }));
        setSelected(null);
        openedRef.current = false;
        setOpened(false);
      }
    }, 2200);
  }

  function wrong() {
    if (!room) return;
    if (!pRef.current.wrongRooms.includes(room.name)) {
      update((prev) => ({ ...prev, wrongRooms: [...prev.wrongRooms, room.name] }));
    }
  }

  const hintLimit = room ? Math.min(cfg.hintsPerRoom, room.lock.hints.length) : 0;

  function showHint() {
    if (!room || p.hintsShown >= hintLimit || opened) return;
    update((prev) => ({ ...prev, hintsShown: prev.hintsShown + 1, hintsUsed: prev.hintsUsed + 1 }));
  }

  // 정답 보기: 그 방의 힌트를 다 쓴 뒤에만. 열람 기록을 남기고 정답과 이유를 보여 준다.
  const canReveal = !!room && p.hintsShown >= hintLimit && !opened;

  function openReveal() {
    if (!room || !canReveal) return;
    update((prev) => ({
      ...prev,
      revealedRooms: prev.revealedRooms.includes(room.id) ? prev.revealedRooms : [...prev.revealedRooms, room.id],
    }));
    setModal({ type: "reveal" });
  }

  function turn(d: number) {
    const i = WALL_ORDER.indexOf(wall) + d;
    if (i >= 0 && i < WALL_ORDER.length) setWall(WALL_ORDER[i]);
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

  if (intro) {
    return (
      <section className="screen center intro">
        <h1 className="title">시험범위에 갇혔다</h1>
        <p className="intro-story">{STORY_INTRO[game.theme]}</p>
        <p className="tip">방마다 제한 시간이 있어요. 지금부터 시간이 흘러요.</p>
        <button
          className="btn primary"
          onClick={() => {
            introRef.current = false;
            setIntro(false);
          }}
        >
          눈을 뜬다
        </button>
      </section>
    );
  }

  const found = room.clues.filter((c) => p.foundClueIds.includes(c.id));
  const bagItems = room.items.filter((it) => p.bag.includes(it.id));
  const zoomView: RoomView | undefined = zoom ? room.views.find((v) => v.id === zoom) : undefined;
  const idx = WALL_ORDER.indexOf(wall);

  return (
    <section className="screen">
      <header className="hud">
        <span className="room-count">
          방 {p.roomIdx + 1} / {game.roomCount}
          {room.isFinal ? " · 최종 방" : ""}
        </span>
        <button
          type="button"
          className="btn ghost mute"
          onClick={() => {
            setMuted(!muted);
            setMutedState(!muted);
          }}
          aria-label={muted ? "소리 켜기" : "소리 끄기"}
        >
          {muted ? "🔇" : "🔊"}
        </button>
        <span className={`timer ${p.remaining <= 30 ? "danger" : ""}`} aria-label="이 방의 남은 시간">
          {fmt(p.remaining)}
        </span>
      </header>

      <h2 className="room-name">{room.name}</h2>
      <p className="story">{room.story}</p>
      <p className="situation">{room.situation}</p>

      <div className={`scene-wrap ${opened ? "unlocked" : ""}`}>
        {zoomView ? (
          <ZoomView
            view={zoomView}
            inspected={p.inspected}
            unlocked={p.unlocked}
            onSlot={(s) => pressSpot(s.id)}
            onBack={() => setZoom(null)}
          />
        ) : (
          <>
            <RoomScene
              wall={wall}
              views={room.views.map((v) => v.id)}
              inspected={p.inspected}
              doorOpened={opened}
              onSpot={pressSpot}
              onZoom={(v) => setZoom(v)}
              onDoor={() => !opened && setModal({ type: "lock" })}
            />
            <button type="button" className="turn-btn left" onClick={() => turn(-1)} disabled={idx === 0} aria-label="왼쪽으로 돌아보기">
              ←
            </button>
            <button type="button" className="turn-btn right" onClick={() => turn(1)} disabled={idx === WALL_ORDER.length - 1} aria-label="오른쪽으로 돌아보기">
              →
            </button>
            <span className="wall-label">{WALL_LABEL[wall]}</span>
          </>
        )}
        {opened && <div className="unlock-msg">철컥! {room.isFinal ? "탈출구가 열렸다!" : "다음 방으로…"}</div>}
        {toast && <div className="toast">{toast}</div>}
      </div>

      {p.roomIdx === 0 && tipOpen && (
        <div className="tutorial" role="note">
          <p>
            <strong>조작법</strong>
          </p>
          <ul>
            <li>화면 양옆 ← → 로 고개를 돌려 벽을 둘러봐요.</li>
            <li>책상·책장·캐비닛은 눌러서 가까이 볼 수 있어요. ↓ 로 돌아와요.</li>
            <li>찾은 단서는 단서 수첩에 모여요. 앞 벽의 문을 눌러 자물쇠를 풀어 보세요.</li>
          </ul>
          <button type="button" className="btn ghost" onClick={() => setTipOpen(false)}>
            알겠어요
          </button>
        </div>
      )}

      <section className="bag" aria-label="가방">
        <h3>🎒 가방</h3>
        {bagItems.length === 0 ? (
          <p className="tip">비어 있어요. 열쇠 같은 아이템을 찾으면 여기에 들어가요.</p>
        ) : (
          <ul>
            {bagItems.map((it) => (
              <li key={it.id}>
                <button type="button" className={selected === it.id ? "selected" : ""} onClick={() => setSelected(selected === it.id ? null : it.id)} aria-pressed={selected === it.id}>
                  {it.icon} {it.name}
                </button>
              </li>
            ))}
          </ul>
        )}
        {selected && <p className="tip">잠긴 곳을 눌러 아이템을 써 보세요.</p>}
      </section>

      <div className="hints">
        <button type="button" className="btn ghost" onClick={showHint} disabled={p.hintsShown >= hintLimit || opened}>
          🔦 힌트 ({hintLimit - p.hintsShown}번 남음 · 총 {p.hintsUsed}회 사용)
        </button>
        <ul>
          {room.lock.hints.slice(0, p.hintsShown).map((h, i) => (
            <li key={i}>{h}</li>
          ))}
        </ul>
        {canReveal && (
          <button type="button" className="btn ghost reveal-btn" onClick={openReveal}>
            📖 정답 보기 (결과에 기록돼요)
          </button>
        )}
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
        <div className="modal" role="dialog" aria-modal="true" onClick={() => modal.type !== "lock" && modal.type !== "reveal" && setModal(null)}>
          <div className="modal-body" onClick={(e) => e.stopPropagation()}>
            {modal.type === "clue" && <ClueCard clue={modal.clue} />}
            {modal.type === "item" && (
              <p className="empty-msg">
                {modal.item.icon} <strong>{modal.item.name}</strong>을(를) 찾았다! 가방에 넣었다.
              </p>
            )}
            {modal.type === "reveal" && (
              <div className="reveal-box">
                <p className="tip">정답과 이유를 확인하고 이해한 뒤 넘어가요.</p>
                <p className="reveal-answer">
                  정답: <strong>{room.lock.type === "direction" ? room.lock.answer.toUpperCase().split("").map((c) => ({ U: "↑", D: "↓", L: "←", R: "→" }[c] ?? c)).join(" ") : room.lock.answer}</strong>
                </p>
                <p className="reveal-why">{room.lock.explanation}</p>
                <button type="button" className="btn primary" onClick={solved}>
                  문을 열고 나간다
                </button>
              </div>
            )}
            {modal.type === "lock" && <LockPanel lock={room.lock} onSolved={solved} onWrong={wrong} onClose={() => setModal(null)} />}
            {modal.type !== "lock" && (
              <button type="button" className="btn ghost close" onClick={() => setModal(null)}>
                닫기
              </button>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
