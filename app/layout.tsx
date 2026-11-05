import type { Metadata, Viewport } from "next";
import "./globals.css";
import "./theme-base.css";
import "./theme-common.css";
import "./theme-horror.css";
import "./theme-detective.css";
import "./theme-isekai.css";
import "./theme-code.css";
import "./theme-start.css";
import "./theme-start-bg.css";
import "./theme-space.css";
import "./theme-story.css";
import "./theme-result.css";

// 테마마다 다른 무료 웹폰트(Google Fonts): 공포=긁힌 붓글씨, 추리=타자기, 이세계=고대 문서·룬 문자
const FONTS =
  "https://fonts.googleapis.com/css2?family=East+Sea+Dokdo&family=Nanum+Gothic+Coding:wght@400;700&family=Special+Elite&family=Song+Myung&family=Noto+Sans+Runic&family=Black+Han+Sans&family=Nanum+Pen+Script&display=swap";

export const metadata: Metadata = {
  title: "탈출 스터디 | 시험범위에 갇혔다",
  description: "강의자료를 넣으면 방탈출 게임이 되고, 탈출 후 복습으로 기억을 굳히는 학습 서비스",
};

export const viewport: Viewport = { width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link rel="stylesheet" href={FONTS} />
      </head>
      <body>{children}</body>
    </html>
  );
}
