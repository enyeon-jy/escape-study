import type { ThemeId } from "./types";

// 테마별 세계관과 방 공간. 이야기의 뼈대는 코드에 두고, AI는 이 틀 안에서 방마다 개념을 장치·사건으로 바꿔 쓴다.
// 공간은 테마마다 4개이고, 방 순서대로 돌아가며 쓴다 (1번 방=공간 1, 5번 방=다시 공간 1).

export type FxKind = "dust" | "bubbles" | "fog" | "steam" | "rain" | "sparkle" | "stars" | "embers";

export interface Space {
  name: string; // 공간 이름 (방 이름과 AI 지시문에 쓰임)
  board: string; // 앞 벽의 대표 소품 이름 (조사할 수 있는 물건)
  tint: string; // 배경 색조
  tintOpacity: number;
  fx: FxKind; // 분위기 효과
  mood: string; // AI에게 알려 줄 분위기 한 줄
}

export interface World {
  title: string; // 세계관 이름
  villain: string; // 방을 가둔 존재 (실패 화면에서 말하는 이)
  recapLabel: string; // 탈출 직후 정리 한 줄의 머리말 (예: "감독관의 메모")
  intro: string; // 왜 갇혔고, 왜 개념을 풀어야 나가고, 나가면 뭐가 해결되는지
  premise: string; // AI에게 주는 세계관 설명
  ending: string; // 마지막 방을 탈출했을 때 결말 (AI가 못 만들었을 때 쓰는 기본 문장)
  spaces: Space[];
}

export const WORLDS: Record<ThemeId, World> = {
  horror: {
    title: "낙제 감독관",
    villain: "낙제 감독관",
    recapLabel: "감독관의 메모",
    intro:
      "시험 기간마다 나타난다는 괴담 속 ‘낙제 감독관’. 시험 전날 밤 도서관에서 잠든 나는, 눈을 떠 보니 불 꺼진 시험장에 갇혀 있다. 감독관이 속삭인다. “공부 안 한 학생은 나갈 수 없다.” 문마다 그가 건 문제가 있고, 풀어야만 다음 문이 열린다. 마지막 문제까지 풀면 아침이 오고, 나는 시험장에 설 수 있다.",
    premise:
      "시험 기간마다 나타나는 괴담 속 '낙제 감독관'이 공부 안 한 학생을 폐교 시험장에 가둔다. 문마다 감독관이 건 문제가 있고, 풀어야만 나갈 수 있다. 마지막 문제를 풀면 감독관이 '합격이다' 하고 사라지며 아침이 온다. 감독관은 방마다 쪽지·메모·속삭임으로 등장한다. 분위기 연출은 괴담 수준까지만, 상처·신체 훼손 묘사는 금지.",
    ending: "마지막 문이 열리자 감독관이 낮게 웃었다. “합격이다.” 그는 먼지처럼 흩어졌고, 창으로 아침 햇살이 들어왔다.",
    spaces: [
      { name: "교실", board: "금 간 칠판", tint: "#3a3020", tintOpacity: 0.12, fx: "dust", mood: "불 꺼진 낡은 교실, 칠판과 책상, 떠다니는 먼지" },
      { name: "과학실", board: "실험 수칙 게시판", tint: "#0f3a2a", tintOpacity: 0.22, fx: "bubbles", mood: "곰팡이 냄새 나는 과학실, 표본병과 약병, 부글거리는 액체" },
      { name: "끝없는 복도", board: "녹슨 사물함", tint: "#0a1030", tintOpacity: 0.3, fx: "fog", mood: "끝이 보이지 않는 복도, 같은 장면이 반복되고 안개가 낌" },
      { name: "지하 보일러실", board: "압력 계기판", tint: "#5a2008", tintOpacity: 0.28, fx: "steam", mood: "뜨거운 지하 보일러실, 낡은 파이프와 수증기, 붉은 불빛" },
    ],
  },
  detective: {
    title: "시험지 유출 사건",
    villain: "시험지 도둑",
    recapLabel: "탐정 수첩",
    intro:
      "시험 전날 밤, 시험지가 사라졌다. 범인은 강의 내용을 암호로 바꿔 단서를 남겼다. 학교 탐정인 나는 그 암호를 풀어야만 시험지가 있는 곳에 닿는다. 방마다 남겨진 암호를 하나씩 풀어 가면 범인과 시험지의 위치가 드러나고, 시험은 무사히 치러진다.",
    premise:
      "시험지가 사라진 '시험지 유출 사건'. 범인은 강의 내용을 암호로 써서 단서를 남겼다. 주인공은 학교 탐정이다. 방마다 범인이 남긴 암호(자물쇠)를 풀면 다음 장소로 간다. 마지막 암호를 풀면 범인과 시험지 위치가 밝혀진다. 범인은 가상의 인물이고 방마다 쪽지·녹음·문서로 흔적을 남긴다.",
    ending: "범인은 시험지를 숨긴 곳에서 붙잡혔고, 시험지는 무사히 돌아왔다. 사건 해결!",
    spaces: [
      { name: "탐정 사무실", board: "사건 보드", tint: "#5a3a10", tintOpacity: 0.08, fx: "dust", mood: "비 오는 밤의 탐정 사무실, 나무 책상과 타자기, 사건 보드" },
      { name: "사건 현장(연구실)", board: "증거 번호판", tint: "#1a2a3a", tintOpacity: 0.2, fx: "dust", mood: "폴리스라인이 쳐진 연구실, 증거 표식과 차가운 조명" },
      { name: "기록 보관소", board: "서류 서랍장", tint: "#4a3a1a", tintOpacity: 0.18, fx: "dust", mood: "먼지 쌓인 기록 보관소, 끝없는 서류 서랍과 오래된 장부" },
      { name: "옥상", board: "옥상 물탱크", tint: "#0a1a3a", tintOpacity: 0.3, fx: "rain", mood: "비 내리는 밤의 옥상, 난간과 도시 불빛, 물탱크" },
    ],
  },
  isekai: {
    title: "망각의 마왕",
    villain: "망각의 마왕",
    recapLabel: "정령의 속삭임",
    intro:
      "시험범위가 하나의 세계가 된 이세계. 망각의 마왕이 이 세계의 지식을 하나씩 지우고 있다. 방마다 봉인된 ‘지식의 정령’(개념)이 잠들어 있고, 정령을 깨워야 길이 열린다. 마왕성까지 가서 마왕을 쓰러뜨리면 지워진 지식이 돌아오고, 나는 현실로 돌아간다.",
    premise:
      "시험범위가 세계가 된 이세계. '망각의 마왕'이 지식을 지우고 있다. 방마다 봉인된 '지식의 정령'(= 개념)이 있고, 문제를 풀어 정령을 깨우면 길이 열린다. 마지막 방은 마왕성이고, 마왕을 쓰러뜨리면 지식이 돌아오며 현실로 돌아온다. 정령은 방마다 속삭임·두루마리·마법서로 단서를 준다.",
    ending: "마왕이 쓰러지고 지워진 지식이 돌아왔다. 눈을 뜨니 현실, 시험 아침이다.",
    spaces: [
      { name: "떠 있는 섬", board: "룬 석판", tint: "#1a2a5a", tintOpacity: 0, fx: "sparkle", mood: "하늘에 떠 있는 섬, 거꾸로 흐르는 폭포와 오로라" },
      { name: "수정 동굴", board: "수정 벽", tint: "#0a3a4a", tintOpacity: 0.3, fx: "sparkle", mood: "청록 수정이 빛나는 동굴, 메아리와 반짝이는 가루" },
      { name: "별의 도서관", board: "별자리 두루마리", tint: "#2a1a5a", tintOpacity: 0.25, fx: "stars", mood: "별이 쏟아지는 도서관, 떠다니는 책과 별자리" },
      { name: "마왕성", board: "마왕의 문양", tint: "#4a0a2a", tintOpacity: 0.35, fx: "embers", mood: "불씨가 날리는 마왕성, 검붉은 하늘과 날카로운 첨탑" },
    ],
  },
};

export const SPACE_COUNT = 4;
export const spaceIndex = (roomIndex: number) => ((roomIndex % SPACE_COUNT) + SPACE_COUNT) % SPACE_COUNT;
export const spaceOf = (theme: ThemeId, roomIndex: number): Space => WORLDS[theme].spaces[spaceIndex(roomIndex)];

// 방을 탈출한 직후 보이는 개념 정리 한 줄. AI가 못 만들었으면 정답 설명의 첫 문장으로 대신한다.
export function recapOf(room: { recap?: string; lock: { explanation: string } }, theme: ThemeId): string {
  if (room.recap) return room.recap;
  const first = room.lock.explanation.split(/(?<=[.!?。])\s+/)[0] ?? "";
  return `${WORLDS[theme].recapLabel}: ${first.slice(0, 90)}`;
}

// 마지막 방을 탈출했을 때의 결말. AI가 못 만들었으면 세계관의 기본 결말을 쓴다.
export function endingOf(room: { ending?: string }, theme: ThemeId): string {
  return room.ending ?? WORLDS[theme].ending;
}
