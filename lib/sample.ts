import type { GameData } from "./types";

export const SAMPLE_SUBJECT = "컴퓨터 네트워크";

export const SAMPLE_MATERIAL = `[컴퓨터 네트워크 기초]
1. OSI 참조 모델은 네트워크 통신 과정을 7개의 계층으로 나눈 모델이다.
2. HTTPS는 HTTP에 암호화를 더한 프로토콜이며, 기본 포트 번호는 443이다.
3. IPv4 주소는 32비트로 이루어져 있고, 8비트씩 4덩어리로 나누어 표기한다.`;

// 1단계용 예시 데이터. 4단계에서 AI가 같은 모양의 JSON을 만들어 준다.
export function sampleGame(theme: GameData["theme"]): GameData {
  return {
    subject: SAMPLE_SUBJECT,
    theme,
    timeLimitSec: 180,
    rooms: [
      {
        name: "폐교 과학실",
        concept: "OSI 모델의 계층 수",
        situation: "문이 잠겼다. 책상 위에 누군가 급히 남긴 쪽지가 있다.",
        clue: {
          format: "note",
          title: "경고 쪽지",
          lines: [
            "여기서 나가려면 잘 들어.",
            "통신은 한 덩어리가 아니야. 7개의 계층으로 쪼개서 움직여.",
            "계층의 수가 곧 첫 번째 자물쇠의 숫자야.",
          ],
        },
        lock: {
          question: "OSI 참조 모델은 통신을 몇 개의 계층으로 나누는가?",
          answer: "7",
          units: ["계층", "개"],
          hints: ["쪽지 두 번째 줄에 숫자가 있다.", "정답은 한 자리 숫자다."],
        },
        professorLine: "자네, 아직도 OSI 모델이 몇 계층인지 모르나?",
      },
      {
        name: "어두운 복도",
        concept: "HTTPS 기본 포트",
        situation: "복도 끝 방송실에서 이상한 소리가 새어 나온다. 문자가 도착했다.",
        clue: {
          format: "sms",
          title: "수상한 문자",
          lines: [
            "[발신: 알 수 없음]",
            "HTTP에 암호화를 입힌 게 HTTPS야.",
            "그 문은 포트 443번으로만 열려.",
            "다음 문 비밀번호도 그 번호야.",
          ],
        },
        lock: {
          question: "HTTPS의 기본 포트 번호는?",
          answer: "443",
          units: ["번", "포트"],
          hints: ["문자 세 번째 줄을 읽어 봐.", "세 자리 숫자다."],
        },
        professorLine: "HTTPS 기본 포트도 모르면서 탈출하겠다고?",
      },
      {
        name: "방송실",
        concept: "IPv4 주소의 비트 수",
        situation: "마지막 문이다. 녹음기에서 목소리가 흘러나온다.",
        clue: {
          format: "recording",
          title: "녹음 파일 받아쓰기",
          lines: [
            "…주소는 네 덩어리로 나뉜다…",
            "…한 덩어리는 8비트…",
            "…네 덩어리를 합치면 총 32비트…",
            "…그 숫자를 입력하면 문이 열린다…",
          ],
        },
        lock: {
          question: "IPv4 주소는 총 몇 비트인가?",
          answer: "32",
          units: ["비트", "bit", "bits"],
          hints: ["8비트씩 4덩어리다.", "8 × 4 를 계산해 보자."],
        },
        professorLine: "IPv4 주소가 몇 비트인지도 모르나? 다시 공부해 오게!",
      },
    ],
    review: [
      {
        prompt: "OSI 참조 모델은 통신 과정을 ____개의 계층으로 나눈다.",
        answer: "7",
        units: ["계층", "개"],
        explanation: "OSI 참조 모델은 네트워크 통신을 7개의 계층으로 나눈 모델이다.",
      },
      {
        prompt: "HTTPS의 기본 포트 번호는 ____ 이다.",
        answer: "443",
        units: ["번", "포트"],
        explanation: "HTTPS는 HTTP에 암호화를 더한 프로토콜이며 기본 포트는 443이다.",
      },
      {
        prompt: "IPv4 주소는 ____비트로 이루어져 있다.",
        answer: "32",
        units: ["비트", "bit", "bits"],
        explanation: "IPv4 주소는 8비트씩 4덩어리, 총 32비트로 표기한다.",
      },
    ],
  };
}
