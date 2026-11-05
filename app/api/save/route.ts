import { NextResponse } from "next/server";
import { checkGame, checkLog } from "@/lib/saveCheck";
import { NotConfigured, upsert } from "@/lib/server/supabase";

// Supabase 저장은 이 서버 함수에서만 한다. 저장이 실패해도 게임은 계속되므로, 실패는 로그만 남기고 조용히 돌려보낸다.
// 저장하는 것: 게임(과목명·테마·난이도·방 JSON), 플레이 결과(성공 여부·시간·힌트·정답 열람·복습 완료).
// 저장하지 않는 것: 이름·이메일 등 개인정보, 강의자료 원문, IP.
export const maxDuration = 15;

// 아주 간단한 호출 횟수 제한 (서버 인스턴스별, IP당 10분에 60번)
const hits = new Map<string, number[]>();
function limited(ip: string): boolean {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < 10 * 60_000);
  recent.push(now);
  hits.set(ip, recent);
  return recent.length > 60;
}

export async function POST(req: Request) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  if (limited(ip)) return NextResponse.json({ ok: false, code: "RATE_LIMIT" }, { status: 429 });

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, code: "BAD_REQUEST" }, { status: 400 });
  }

  try {
    if (body.kind === "game") {
      await upsert("games", checkGame(body));
    } else if (body.kind === "log") {
      await upsert("play_logs", checkLog(body));
    } else {
      return NextResponse.json({ ok: false, code: "BAD_REQUEST" }, { status: 400 });
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    if (e instanceof NotConfigured) {
      console.warn("[save] Supabase 미설정 — 저장을 건너뜀");
      return NextResponse.json({ ok: false, code: "NO_CONFIG" });
    }
    console.error("[save] 저장 실패:", e instanceof Error ? e.message : e);
    return NextResponse.json({ ok: false, code: "SAVE_FAILED" });
  }
}
