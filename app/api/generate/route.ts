import { NextResponse } from "next/server";
import { MATERIAL_MAX_CHARS, ROOMS } from "@/lib/config";
import { layoutRoom, pickViews } from "@/lib/layout";
import { conceptsForRoom, limitMaterial } from "@/lib/rooms";
import { withRetry } from "@/lib/retry";
import { callAI, ConfigError } from "@/lib/server/ai";
import { conceptsPrompt, roomPrompt, SYSTEM_PROMPT } from "@/lib/server/prompts";
import type { Concept, Difficulty, GameMode, ThemeId } from "@/lib/types";
import { MAX_CONCEPTS, validateConcepts, validateRoom } from "@/lib/validate";

// AI는 이 서버 함수에서만 부른다. 키(OPENAI_API_KEY)는 서버 환경변수에서만 읽는다.
export const maxDuration = 60;

const THEMES: ThemeId[] = ["horror", "isekai", "detective"];
const DIFFS: Difficulty[] = ["easy", "normal", "hard"];
const MODES: GameMode[] = ["quick", "full"];

// 학교 크레딧을 아끼기 위한 아주 간단한 호출 횟수 제한 (서버 인스턴스별, IP당 10분에 40번)
const hits = new Map<string, number[]>();
function limited(ip: string): boolean {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < 10 * 60_000);
  recent.push(now);
  hits.set(ip, recent);
  return recent.length > 40;
}

function fail(status: number, error: string, code: string) {
  return NextResponse.json({ error, code }, { status });
}

export async function POST(req: Request) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  if (limited(ip)) return fail(429, "요청이 너무 많아요. 잠시 후 다시 시도해 주세요.", "RATE_LIMIT");

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return fail(400, "요청 형식이 올바르지 않아요.", "BAD_REQUEST");
  }

  const kind = body.kind;
  const material = limitMaterial(typeof body.material === "string" ? body.material : "", MATERIAL_MAX_CHARS);
  const subject = (typeof body.subject === "string" ? body.subject : "").trim().slice(0, 60);
  if (!material.trim()) return fail(400, "강의자료가 비어 있어요.", "BAD_REQUEST");

  try {
    if (kind === "concepts") {
      const mode = body.mode as GameMode;
      if (!MODES.includes(mode)) return fail(400, "요청 형식이 올바르지 않아요.", "BAD_REQUEST");
      const result = await withRetry(async () => {
        const json = await callAI(SYSTEM_PROMPT, conceptsPrompt({ subject, material, mode }));
        return validateConcepts(json, material);
      });
      return NextResponse.json(result);
    }

    if (kind === "room") {
      const theme = body.theme as ThemeId;
      const difficulty = body.difficulty as Difficulty;
      const index = Number(body.index);
      const roomCount = Number(body.roomCount);
      const concepts = body.concepts as Concept[];
      if (
        !THEMES.includes(theme) ||
        !DIFFS.includes(difficulty) ||
        !Number.isInteger(index) ||
        !Number.isInteger(roomCount) ||
        roomCount < 1 ||
        roomCount > ROOMS.maxRooms || // 방 개수 최대 8개
        index < 0 ||
        index >= roomCount ||
        !Array.isArray(concepts) ||
        concepts.length < 1 ||
        concepts.length > MAX_CONCEPTS ||
        !concepts.every((c) => c && typeof c.id === "string" && typeof c.name === "string")
      ) {
        return fail(400, "요청 형식이 올바르지 않아요.", "BAD_REQUEST");
      }
      const prevStory = typeof body.prevStory === "string" ? body.prevStory.slice(0, 200) : undefined;
      const roomConcepts = conceptsForRoom(concepts, index, roomCount);

      const payload = await withRetry(async () => {
        const json = await callAI(
          SYSTEM_PROMPT,
          roomPrompt({ subject, material, theme, difficulty, index, roomCount, roomConcepts, prevStory }),
        );
        return validateRoom(json, difficulty, material);
      });

      const { views, lockedSlot } = pickViews(index);
      const room = layoutRoom(
        {
          id: `room${index + 1}`,
          name: payload.name,
          situation: payload.situation,
          story: payload.story,
          lockType: payload.lockType,
          question: payload.question,
          answer: payload.answer,
          units: payload.units,
          hints: payload.hints,
          explanation: payload.explanation,
          conceptIds: roomConcepts.map((c) => c.id),
          professorLine: payload.professorLine,
          real: payload.real,
          fake: payload.fake,
          views,
          lockedSlot,
        },
        difficulty,
        index,
        roomCount,
      );
      return NextResponse.json({ room });
    }

    return fail(400, "요청 형식이 올바르지 않아요.", "BAD_REQUEST");
  } catch (e) {
    if (e instanceof ConfigError) {
      console.error("[api/generate] 설정 오류:", e.message);
      return fail(500, e.message, "NO_CONFIG");
    }
    console.error("[api/generate] 실패:", e instanceof Error ? e.message : e);
    return fail(502, "방을 만드는 데 실패했어요. 다시 시도해 주세요.", "AI_FAILED");
  }
}
