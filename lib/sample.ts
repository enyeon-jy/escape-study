import type { LockType } from "./lock";
import { computeRoomCount } from "./rooms";
import { layoutRoom, type ClueSrc, type RoomSpec } from "./layout";
import type { Concept, Difficulty, GameData, GameMode, ReviewItem, Room, ThemeId, ViewId } from "./types";

export const SAMPLE_SUBJECT = "컴퓨터 네트워크";

export const SAMPLE_MATERIAL = `[컴퓨터 네트워크 기초]
1. OSI 참조 모델은 네트워크 통신 과정을 7개의 계층으로 나눈 모델이다.
2. HTTPS는 HTTP에 암호화를 더한 프로토콜이며, 기본 포트 번호는 443이다.
3. IPv4 주소는 32비트로 이루어져 있고, 8비트씩 4덩어리로 나누어 표기한다.`;

// 예시 데이터. 4단계에서 AI가 같은 모양의 JSON을 만들어 준다.
// 규칙: 단서 하나만으로는 답이 안 나오고, 정답은 단서에 직접 쓰지 않는다 (개념을 알아야 답으로 이어짐).
// 자료에 순서형 개념이 없어서 예시에는 방향 자물쇠가 나오지 않는다. (/lock-demo 에서 따로 볼 수 있다)

const CONCEPTS: Concept[] = [
  { id: "osi", name: "OSI 참조 모델의 계층 수" },
  { id: "https", name: "HTTPS (HTTP에 암호화를 더한 프로토콜)" },
  { id: "ipv4", name: "IPv4 주소의 비트 수" },
];

interface RoomTemplate {
  id: string;
  name: string;
  situation: string;
  story: string;
  lockType: LockType;
  question: string;
  answer: string;
  units: string[];
  hints: string[]; // 난이도별 힌트 횟수만큼 앞에서부터 사용
  explanation: string;
  conceptId: string;
  professorLine: string;
  views: ViewId[]; // 클로즈업 화면 (2~3개)
  lockedSlot?: string; // 열쇠로 여는 칸
  clues: Record<Difficulty, { real: ClueSrc[]; fake: ClueSrc[] }>;
}

const TEMPLATES: RoomTemplate[] = [
  {
    id: "lab",
    name: "폐교 과학실",
    situation: "눈을 뜨니 불 꺼진 과학실이다. 앞 벽의 출구 문이 숫자 자물쇠로 잠겨 있다.",
    story: "1 / 시험 전날 밤, 도서관에서 졸다 눈을 떴더니 시험범위 속 폐교에 갇혀 있다. 아침 9시 시험 전에 나가야 한다.",
    lockType: "dial-number",
    question: "출구 문의 숫자를 맞춰 보세요.",
    answer: "7",
    units: ["계층", "개", "층"],
    hints: [
      "수첩의 단서들을 함께 읽어 보자. 어떤 모델이 등장하지?",
      "문이 묻는 건 그 모델이 나눈 것의 '개수'야.",
      "강의자료 첫 번째 줄을 떠올려 봐.",
    ],
    explanation: "OSI 참조 모델은 통신 과정을 7개의 계층으로 나눈 모델이다. 단서가 가리킨 모델이 OSI이고, 문이 물은 것은 계층의 수라서 답은 7이다.",
    conceptId: "osi",
    professorLine: "자네, 아직도 OSI 모델이 몇 계층인지 모르나?",
    views: ["shelf", "desk"],
    clues: {
      easy: {
        real: [
          { title: "경고 쪽지", format: "note", lines: ["이 문의 비밀번호는 'OSI 참조 모델'과 관련이 있어.", "나머지는 일기장에 적어 뒀다."] },
          { title: "찢어진 일기장", format: "diary", lines: ["…문이 묻는 건 그 모델이 통신을 나눈 '계층'의 수였다…", "…한 칸도 빼먹지 말고 세어야 한다…"] },
        ],
        fake: [],
      },
      normal: {
        real: [
          { title: "경고 쪽지", format: "note", lines: ["통신 과정을 역할별로 층층이 나눠 놓은 국제 표준 모델.", "문은 그 모델을 알아야 열려."] },
          { title: "찢어진 일기장", format: "diary", lines: ["…문이 요구한 건 그 모델이 몇 층으로 쌓였는지였다…", "…층 하나가 맡는 일은 딱 하나뿐이라고…"] },
          { title: "실험 일지 메모", format: "document", lines: ["입력 형식: 숫자만. 단위는 쓰지 말 것."] },
        ],
        fake: [{ title: "구겨진 시간표", format: "note", lines: ["방과 후 보충 - 금요일 4교시", "급식: 월요일 김치찌개"] }],
      },
      hard: {
        real: [
          { title: "경고 쪽지", format: "note", lines: ["영어 약자 세 글자. 통신을 층층이 나눈 그 표준 모델."] },
          { title: "찢어진 일기장", format: "diary", lines: ["…문이 원한 건 이름이 아니라 '층의 총수'였다…"] },
          { title: "실험 일지 메모", format: "document", lines: ["입력은 한 자리 숫자. 단위 없이."] },
        ],
        fake: [
          { title: "구겨진 시간표", format: "note", lines: ["방과 후 보충 - 금요일 4교시", "급식: 월요일 김치찌개"] },
          { title: "고장 신고서", format: "document", lines: ["3번 형광등 교체 요망", "과학실 수도꼭지 2개 누수"] },
        ],
      },
    },
  },
  {
    id: "hall",
    name: "어두운 복도",
    situation: "과학실을 빠져나와 복도에 왔다. 앞 벽의 문에 알파벳 자물쇠가 달려 있다. 서랍 하나는 잠겨 있다.",
    story: "2 / 복도 끝에서 알 수 없는 방송 소리가 새어 나온다. 저 문 너머가 출구에 가까워진다.",
    lockType: "dial-alpha",
    question: "문이 요구하는 영문 약자를 맞춰 보세요.",
    answer: "HTTPS",
    units: [],
    hints: [
      "문자와 메모를 같이 읽어 보자. 어떤 통신이 나오지?",
      "자물쇠는 알파벳 다섯 글자를 원해.",
      "HTTP 뒤에 한 글자를 붙인 약자야.",
    ],
    explanation: "HTTP에 암호화를 더한 프로토콜이 HTTPS다. 주소창에 자물쇠가 뜨는 안전한 웹 통신이므로 답은 HTTPS이다.",
    conceptId: "https",
    professorLine: "HTTPS가 무슨 뜻인지도 모르면서 탈출하겠다고?",
    views: ["shelf", "desk", "cabinet"],
    lockedSlot: "desk-0",
    clues: {
      easy: {
        real: [
          { title: "벽에 붙은 메모", format: "note", lines: ["문 비밀번호는 알파벳 대문자 다섯 글자야."] },
          { title: "수상한 문자", format: "sms", lines: ["[발신: 알 수 없음]", "HTTP에 암호화(Secure)를 더한 프로토콜의 약자를 써."] },
        ],
        fake: [],
      },
      normal: {
        real: [
          { title: "수상한 문자", format: "sms", lines: ["[발신: 알 수 없음]", "주소창에 자물쇠 모양이 뜨는, HTTP를 암호화로 지킨 통신을 떠올려."] },
          { title: "벽에 붙은 메모", format: "note", lines: ["비밀번호는 그 통신의 영어 약자야."] },
          { title: "경고 쪽지", format: "note", lines: ["대문자 다섯 글자."] },
        ],
        fake: [{ title: "열쇠함 번호표", format: "document", lines: ["호실 204 / 보관: 방송부"] }],
      },
      hard: {
        real: [
          { title: "수상한 문자", format: "sms", lines: ["[발신: 알 수 없음]", "주소창의 자물쇠 모양. 그 안전한 웹 통신 말이야."] },
          { title: "벽에 붙은 메모", format: "note", lines: ["문이 원하는 건 그 통신의 영문 약자."] },
          { title: "경고 쪽지", format: "note", lines: ["대문자, 다섯 글자."] },
        ],
        fake: [
          { title: "열쇠함 번호표", format: "document", lines: ["호실 204 / 보관: 방송부"] },
          { title: "종소리 기록", format: "note", lines: ["점심 종: 12시 40분"] },
        ],
      },
    },
  },
  {
    id: "studio",
    name: "방송실",
    situation: "마지막 방이다. 앞 벽의 출구 문에 키패드 도어락이 달려 있다. 캐비닛의 상자가 잠겨 있다.",
    story: "3 / 마지막 방송실. 저 문만 열면 학교 밖이다. 아침 9시가 코앞이다!",
    lockType: "keypad",
    question: "도어락 번호를 눌러 보세요.",
    answer: "32",
    units: ["비트", "bit", "bits"],
    hints: [
      "녹음 파일들을 이어서 들어 보자. 어떤 주소 체계가 나오지?",
      "문이 묻는 건 그 주소 전체를 비트로 센 길이야.",
      "한 덩어리가 몇 비트인지, 덩어리는 몇 개인지 자료에 있어.",
    ],
    explanation: "IPv4 주소는 8비트씩 4덩어리로 이루어져 있다. 8비트 × 4 = 32비트라서 답은 32이다.",
    conceptId: "ipv4",
    professorLine: "IPv4 주소가 몇 비트인지도 모르나? 다시 공부해 오게!",
    views: ["desk", "cabinet"],
    lockedSlot: "cabinet-0",
    clues: {
      easy: {
        real: [
          { title: "녹음 파일 받아쓰기 ①", format: "recording", lines: ["…마지막 문은 IPv4 주소와 관련이 있다…"] },
          { title: "녹음 파일 받아쓰기 ②", format: "recording", lines: ["…그 주소가 전체 몇 비트인지를 누르라…"] },
        ],
        fake: [],
      },
      normal: {
        real: [
          { title: "녹음 파일 받아쓰기 ①", format: "recording", lines: ["…네 칸으로 나눠 적는 옛 방식의 인터넷 주소…"] },
          { title: "녹음 파일 받아쓰기 ②", format: "recording", lines: ["…그 한 칸은 8비트였던가…"] },
          { title: "녹음 파일 받아쓰기 ③", format: "recording", lines: ["…문이 요구하는 건 주소 전체의 비트 수…"] },
        ],
        fake: [{ title: "방송 편성표", format: "document", lines: ["오후 3시 점심 방송 / 오후 5시 종료 안내"] }],
      },
      hard: {
        real: [
          { title: "녹음 파일 받아쓰기 ①", format: "recording", lines: ["…네 칸으로 나눠 적는 옛 방식의 인터넷 주소 체계…"] },
          { title: "녹음 파일 받아쓰기 ②", format: "recording", lines: ["…문이 원하는 건 그 주소의 전체 길이, 단위는 비트…"] },
          { title: "녹음 파일 받아쓰기 ③", format: "recording", lines: ["…두 자리 숫자다. 그게 마지막 열쇠다…"] },
        ],
        fake: [
          { title: "방송 편성표", format: "document", lines: ["오후 3시 점심 방송 / 오후 5시 종료 안내"] },
          { title: "장비 점검표", format: "document", lines: ["마이크 4대 / 스피커 2대 점검 완료"] },
        ],
      },
    },
  },
];

const REVIEW: ReviewItem[] = [
  {
    conceptId: "osi",
    prompt: "OSI 참조 모델은 통신 과정을 ____개의 계층으로 나눈다.",
    answer: "7",
    units: ["계층", "개"],
    explanation: "OSI 참조 모델은 네트워크 통신을 7개의 계층으로 나눈 모델이다.",
  },
  {
    conceptId: "https",
    prompt: "HTTP에 암호화를 더한 프로토콜의 이름(영어 약자)은 ____ 이다.",
    answer: "HTTPS",
    explanation: "HTTPS는 HTTP에 암호화를 더한 프로토콜이다.",
  },
  {
    conceptId: "https",
    prompt: "HTTPS의 기본 포트 번호는 ____ 이다.",
    answer: "443",
    units: ["번", "포트"],
    explanation: "HTTPS의 기본 포트는 443이다.",
  },
  {
    conceptId: "ipv4",
    prompt: "IPv4 주소는 ____비트로 이루어져 있다.",
    answer: "32",
    units: ["비트", "bit", "bits"],
    explanation: "IPv4 주소는 8비트씩 4덩어리, 총 32비트로 표기한다.",
  },
];

// 예시 방 템플릿을 방 내용(RoomSpec)으로 바꿔 코드가 물건 배치를 정하게 한다 (AI가 만든 방과 같은 경로)
function buildRoom(theme: ThemeId, difficulty: Difficulty, index: number, roomCount: number): Room {
  void theme;
  const tpl = TEMPLATES[index % TEMPLATES.length];
  const set = tpl.clues[difficulty];
  const spec: RoomSpec = {
    id: tpl.id + (index >= TEMPLATES.length ? `-${index}` : ""),
    name: tpl.name,
    situation: tpl.situation,
    story: tpl.story,
    lockType: tpl.lockType,
    question: tpl.question,
    answer: tpl.answer,
    units: tpl.units,
    hints: tpl.hints,
    explanation: tpl.explanation,
    conceptIds: [tpl.conceptId],
    professorLine: tpl.professorLine,
    real: set.real,
    fake: set.fake,
    views: tpl.views,
    lockedSlot: index > 0 ? tpl.lockedSlot : undefined,
  };
  return layoutRoom(spec, difficulty, index, roomCount);
}

export interface SampleOptions {
  subject: string;
  theme: ThemeId;
  difficulty: Difficulty;
  mode: GameMode;
  surprise: boolean;
}

export function sampleCreateGame(o: SampleOptions): GameData {
  const roomCount = computeRoomCount(CONCEPTS.length, o.mode);
  const game: GameData = {
    subject: o.subject.trim() || SAMPLE_SUBJECT,
    theme: o.theme,
    difficulty: o.difficulty,
    mode: o.mode,
    surprise: o.surprise,
    concepts: CONCEPTS,
    roomCount,
    rooms: [],
    review: REVIEW,
    material: SAMPLE_MATERIAL,
    isSample: true,
  };
  game.rooms = [buildRoom(o.theme, o.difficulty, 0, roomCount)]; // 첫 방만 먼저 만든다
  return game;
}

export function sampleCreateRoom(game: GameData, index: number): Room {
  return buildRoom(game.theme, game.difficulty, index, game.roomCount);
}
