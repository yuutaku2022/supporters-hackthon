import { NextRequest, NextResponse } from "next/server";
import {
  ACHIEVEMENTS,
  ACHIEVEMENT_LIST,
  evaluateAchievement,
  type AchievementId,
} from "@/DB/achievement";
import {
  createPlayAchievement,
  getPlayAchievements,
} from "@/DB/achievementRepository";

/**
 * GET /api/achievements
 * クエリパラメータ:
 *   - achievementId: 特定の称号IDで絞り込み（任意）
 *   - limit: 取得件数の上限（デフォルト 50）
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const achievementIdParam = searchParams.get("achievementId");
    const limitParam = searchParams.get("limit");

    let achievementId: AchievementId | undefined;
    if (achievementIdParam) {
      if (!(achievementIdParam in ACHIEVEMENTS)) {
        return NextResponse.json(
          { error: "不正な achievementId が指定されました。" },
          { status: 400 }
        );
      }
      achievementId = achievementIdParam as AchievementId;
    }

    let limit = 50;
    if (limitParam !== null && limitParam !== "") {
      const parsed = Number(limitParam);
      if (!Number.isInteger(parsed) || parsed <= 0) {
        return NextResponse.json(
          { error: "limit パラメータには正の整数を指定してください。" },
          { status: 400 }
        );
      }
      limit = parsed;
    }

    const records = await getPlayAchievements({ achievementId, limit });
    return NextResponse.json({
      data: records,
      count: records.length,
      definitions: ACHIEVEMENT_LIST,
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "実績データの取得中に予期しないエラーが発生しました。";
    return NextResponse.json(
      { error: message, definitions: ACHIEVEMENT_LIST },
      { status: 500 }
    );
  }
}

/**
 * POST /api/achievements
 * リクエストボディ (JSON):
 *   {
 *     "score": number,
 *     "hits": number,
 *     "wrong": number,
 *     "missed": number,
 *     "timedOut"?: boolean
 *   }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null);

    if (
      !body ||
      typeof body.score !== "number" ||
      typeof body.hits !== "number" ||
      typeof body.wrong !== "number" ||
      typeof body.missed !== "number"
    ) {
      return NextResponse.json(
        {
          error:
            "score, hits, wrong, missed はすべて数値で指定してください。",
        },
        { status: 400 }
      );
    }

    const stats = {
      score: body.score,
      hits: body.hits,
      wrong: body.wrong,
      missed: body.missed,
      timedOut: Boolean(body.timedOut),
    };

    const achievement = evaluateAchievement(stats);
    const created = await createPlayAchievement(stats);

    return NextResponse.json(
      {
        data: created,
        achievement,
      },
      { status: 201 }
    );
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "実績データの保存中に予期しないエラーが発生しました。";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
