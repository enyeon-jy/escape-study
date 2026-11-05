import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "탈출 스터디 | 시험범위에 갇혔다",
  description: "강의자료를 넣으면 방탈출 게임이 되고, 탈출 후 복습으로 기억을 굳히는 학습 서비스",
};

export const viewport: Viewport = { width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
