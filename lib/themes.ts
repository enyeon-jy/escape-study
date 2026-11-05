import type { SlotShape, ThemeId, ViewId } from "./types";
import type { WallId } from "./scenes";

// 테마별로 달라지는 "이름표". 데이터(벽·물건 id, 자물쇠 종류)는 그대로이고 화면에 보이는 이름만 바뀐다.
// 방 데이터는 브라우저에 저장되므로, 이름은 저장하지 않고 그릴 때 테마를 보고 정한다.

interface ThemeNames {
  view: Record<ViewId, string>; // 클로즈업하는 큰 물건
  spot: Record<string, string>; // 벽에 놓인 작은 물건
  shape: Record<SlotShape, string>; // 클로즈업 안의 작은 물건
  wall: Record<WallId, string>;
  lockName: { dial: string; keypad: string; direction: string };
  lockTip: string;
  openLabel: string; // 자물쇠 확인 버튼
  openMsg: string; // 문이 열릴 때 문구
  doorLabel: string;
  bag: string;
  notebook: string;
}

export const THEME_NAMES: Record<ThemeId, ThemeNames> = {
  horror: {
    view: { shelf: "표본 선반", desk: "녹슨 수술대", cabinet: "약품 캐비닛" },
    spot: { frame: "빛바랜 사진", board: "금 간 칠판", trash: "깨진 약병 상자" },
    shape: { drawer: "녹슨 서랍", notebook: "실험 일지", cup: "비커", box: "표본병", book: "낡은 교본", monitor: "낡은 모니터" },
    wall: { left: "왼쪽 벽", front: "앞 벽", right: "오른쪽 벽" },
    lockName: { dial: "녹슨 다이얼 자물쇠", keypad: "비상 도어락", direction: "방향 자물쇠" },
    lockTip: "위아래로 쓸어서 돌려요.",
    openLabel: "열기",
    openMsg: "철컥!",
    doorLabel: "출구 철문",
    bag: "🎒 가방",
    notebook: "📓 단서 수첩",
  },
  detective: {
    view: { shelf: "서류 캐비닛", desk: "낡은 책상", cabinet: "금고" },
    spot: { frame: "액자", board: "사건 보드", trash: "휴지통" },
    shape: { drawer: "책상 서랍", notebook: "사건 파일", cup: "머그컵", box: "증거 상자", book: "장부", monitor: "사무실 컴퓨터" },
    wall: { left: "왼쪽 벽", front: "앞 벽", right: "오른쪽 벽" },
    lockName: { dial: "금고 다이얼", keypad: "사무실 도어락", direction: "방향 자물쇠" },
    lockTip: "위아래로 쓸어서 돌려요.",
    openLabel: "열기",
    openMsg: "딸깍!",
    doorLabel: "사무실 출구",
    bag: "🧳 증거 가방",
    notebook: "📓 탐정 수첩",
  },
  isekai: {
    view: { shelf: "떠다니는 고서대", desk: "마법진 제단", cabinet: "수정 상자" },
    spot: { frame: "별 거울", board: "룬 석판", trash: "빛나는 수정" },
    shape: { drawer: "봉인 상자", notebook: "두루마리", cup: "물약병", box: "수정함", book: "마법서", monitor: "마법 수정 화면" },
    wall: { left: "왼쪽 하늘", front: "정면 하늘", right: "오른쪽 하늘" },
    lockName: { dial: "룬 마법 다이얼", keypad: "룬 문양 판", direction: "방향 봉인" },
    lockTip: "위아래로 쓸어서 룬을 맞춰요.",
    openLabel: "봉인 풀기",
    openMsg: "봉인이 풀렸다!",
    doorLabel: "차원의 문",
    bag: "🎒 마법 주머니",
    notebook: "📜 퀘스트 노트",
  },
};

export const viewLabel = (t: ThemeId, v: ViewId) => THEME_NAMES[t].view[v];
export const spotLabel = (t: ThemeId, id: string) => THEME_NAMES[t].spot[id] ?? id;
export const shapeLabel = (t: ThemeId, s: SlotShape) => THEME_NAMES[t].shape[s];
export const wallLabel = (t: ThemeId, w: WallId) => THEME_NAMES[t].wall[w];

// 테마 미리보기용 한 줄 설명 (시작 화면 카드)
export const THEME_TAGLINE: Record<ThemeId, string> = {
  horror: "불 꺼진 폐교 실험실",
  isekai: "별 위에 떠 있는 마법 세계",
  detective: "비 오는 밤의 탐정 사무실",
};
