"use client";

import { useEffect, useState } from "react";
import ClueCard from "@/components/ClueCard";
import LockPanel from "@/components/LockPanel";
import RoomScene from "@/components/RoomScene";
import ZoomView from "@/components/ZoomView";
import GhostLayer from "@/components/GhostLayer";
import Particles from "@/components/Particles";
import { WALL_ORDER } from "@/lib/scenes";
import { THEME_TAGLINE } from "@/lib/themes";
import type { Clue, RoomView, ThemeId } from "@/lib/types";

// 테마 그림을 한 화면에서 훑어보는 시험용 페이지 (게임 흐름과는 별개). 주소 끝에 ?theme=horror|detective|isekai
const CLUES: Clue[] = [
  { id: "a", kind: "real", format: "note", title: "경고 쪽지", lines: ["비밀번호는 그 계층의 번호다.", "데이터를 나눠 길을 찾아 주는 곳."] },
  { id: "b", kind: "real", format: "document", title: "유출된 문서", lines: ["보안 등급 3", "접근 기록을 확인할 것."] },
  { id: "c", kind: "real", format: "diary", title: "찢어진 일기", lines: ["오늘도 그 소리가 들렸다…"] },
  { id: "d", kind: "real", format: "sms", title: "수상한 문자", lines: ["지금 어디야?", "빨리 나와."] },
  { id: "e", kind: "real", format: "recording", title: "녹음 받아쓰기", lines: ["…들리나?", "답은 세 번째 층이다."] },
];

const VIEWS: RoomView[] = (["shelf", "desk", "cabinet"] as const).map((id) => ({
  id,
  slots: [
    { id: `${id}-0`, label: "x", shape: id === "shelf" ? "book" : id === "desk" ? "drawer" : "box", content: null, lockedBy: id === "cabinet" ? "k" : undefined },
    { id: `${id}-1`, label: "x", shape: id === "shelf" ? "box" : id === "desk" ? "notebook" : "notebook", content: null },
    { id: `${id}-2`, label: "x", shape: "cup", content: null },
  ],
}));

export default function ThemePreview() {
  const [theme, setTheme] = useState<ThemeId>("horror");
  const [showLock, setShowLock] = useState(true);

  useEffect(() => {
    const t = new URLSearchParams(window.location.search).get("theme");
    if (t === "horror" || t === "detective" || t === "isekai") setTheme(t);
  }, []);

  const noop = () => {};
  return (
    <main className="app" data-theme={theme} data-mode="game" data-screen="escape">
      <div className="bg" aria-hidden="true" />
      <div className="content">
        <section className="screen" data-theme={theme}>
          <div className="actions">
            {(["horror", "detective", "isekai"] as ThemeId[]).map((t) => (
              <button key={t} type="button" className="btn" onClick={() => setTheme(t)}>
                {t} · {THEME_TAGLINE[t]}
              </button>
            ))}
            <button type="button" className="btn" onClick={() => setShowLock(!showLock)}>
              자물쇠 {showLock ? "숨기기" : "보이기"}
            </button>
          </div>

          {WALL_ORDER.map((w) => (
            <div className="scene-wrap" key={w}>
              <RoomScene theme={theme} wall={w} views={["shelf", "desk", "cabinet"]} inspected={["frame"]} doorOpened={false} onSpot={noop} onZoom={noop} onDoor={noop} />
              {theme === "isekai" && <Particles />}
              {w === "front" && <GhostLayer enabled={theme === "horror"} ratio={0} />}
            </div>
          ))}

          {VIEWS.map((v) => (
            <div className="scene-wrap" key={v.id}>
              <ZoomView theme={theme} view={v} inspected={[`${v.id}-1`]} unlocked={[]} onSlot={noop} onBack={noop} />
            </div>
          ))}

          <div className="scene-wrap" style={{ background: "#000", padding: 12 }}>
            <RoomScene theme={theme} wall="front" views={["shelf"]} inspected={[]} doorOpened={true} onSpot={noop} onZoom={noop} onDoor={noop} />
          </div>

          {CLUES.map((c) => (
            <ClueCard key={c.id} clue={c} />
          ))}

          {showLock && (
            <>
              <LockPanel theme={theme} lock={{ type: "dial-number", answer: "7" }} onSolved={noop} onWrong={noop} onClose={noop} />
              <LockPanel theme={theme} lock={{ type: "keypad", answer: "32" }} onSolved={noop} onWrong={noop} onClose={noop} />
            </>
          )}
        </section>
      </div>
    </main>
  );
}
