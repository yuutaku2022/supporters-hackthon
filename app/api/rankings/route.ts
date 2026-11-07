import {
  createRankingEntry,
  getTopRankings,
  RankingAlreadyRegisteredError,
} from "@/server/repositories/rankings";

export async function GET() {
  try {
    const rankings = await getTopRankings();
    return Response.json({ rankings });
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "ランキングを取得できませんでした。",
      },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  const body: unknown = await request.json().catch(() => null);
  if (!isRecord(body)) {
    return Response.json({ error: "登録内容が不正です。" }, { status: 400 });
  }

  const { name, score, resultId } = body;
  const trimmedName = typeof name === "string" ? name.trim() : "";
  if (
    !trimmedName ||
    Array.from(trimmedName).length > 20 ||
    /[\u0000-\u001f\u007f]/.test(trimmedName) ||
    typeof score !== "number" ||
    !Number.isSafeInteger(score) ||
    score < 0 ||
    score > 2_147_483_647 ||
    typeof resultId !== "string" ||
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      resultId,
    )
  ) {
    return Response.json(
      { error: "名前またはスコアが不正です。" },
      { status: 400 },
    );
  }

  try {
    const entry = await createRankingEntry({
      name: trimmedName,
      score,
      resultId,
    });
    return Response.json({ entry }, { status: 201 });
  } catch (error) {
    if (error instanceof RankingAlreadyRegisteredError) {
      return Response.json({ error: error.message }, { status: 409 });
    }
    const message =
      error instanceof Error
        ? error.message
        : "ランキングに登録できませんでした。";
    return Response.json({ error: message }, { status: 500 });
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
