import { NextRequest, NextResponse } from "next/server";
import {
  createComment,
  createCommentsBulk,
  deleteAllComments,
  deleteComment,
  getComments,
  updateComment,
} from "@/DB/commentRepository";
import { INITIAL_COMMENTS_100 } from "@/DB/seedData";
import type { CommentFlag, CreateCommentInput } from "@/DB/comment";

/**
 * GET /api/comments
 * クエリパラメータ:
 *   - random: "true" または "1" を指定するとランダム順序で取得（デフォルト50件）
 *   - limit: 取得件数の上限（random=true のとき省略すると 50 件、通常時は全件）
 *   - flag: "0" (冷笑している文章) | "1" (冷笑していない文章) （省略時は両方）
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const flagParam = searchParams.get("flag");
    const limitParam = searchParams.get("limit");
    const randomParam = searchParams.get("random");

    const isRandom = randomParam === "true" || randomParam === "1";

    let flag: CommentFlag | undefined;
    if (flagParam !== null && flagParam !== "") {
      if (flagParam !== "0" && flagParam !== "1") {
        return NextResponse.json(
          {
            error:
              "flag パラメータには 0（冷笑している文章）または 1（冷笑していない文章）を指定してください。",
          },
          { status: 400 }
        );
      }
      flag = Number(flagParam) as CommentFlag;
    }

    let limit: number | undefined = isRandom ? 50 : undefined;
    if (limitParam !== null && limitParam !== "") {
      const parsedLimit = Number(limitParam);
      if (!Number.isInteger(parsedLimit) || parsedLimit <= 0) {
        return NextResponse.json(
          { error: "limit パラメータには正の整数を指定してください。" },
          { status: 400 }
        );
      }
      limit = parsedLimit;
    }

    const comments = await getComments({
      flag,
      limit,
      random: isRandom,
    });

    return NextResponse.json({
      data: comments,
      count: comments.length,
      random: isRandom,
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "文章データの取得中に予期しないエラーが発生しました。";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * POST /api/comments
 * リクエストボディ (JSON):
 *   パターン1（1件登録）: { "content": string, "flag": 0 | 1 }
 *   パターン2（初期データ100件一括投入）: { "seed": true, "replace"?: boolean }
 *   パターン3（配列で一括登録）: { "items": [{ "content": string, "flag": 0 | 1 }, ...] }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // 初期データ100件の一括投入（replace: true の場合は既存データをクリアしてから投入）
    if (body?.seed === true) {
      if (body?.replace === true) {
        await deleteAllComments();
      }
      const created = await createCommentsBulk(INITIAL_COMMENTS_100);
      return NextResponse.json(
        { data: created, count: created.length },
        { status: 201 }
      );
    }

    // 任意配列の一括登録
    if (Array.isArray(body?.items)) {
      const validItems: CreateCommentInput[] = [];
      for (const item of body.items) {
        const content =
          typeof item?.content === "string" ? item.content.trim() : "";
        const flag = item?.flag;
        if (!content || (flag !== 0 && flag !== 1)) {
          return NextResponse.json(
            {
              error:
                "items 内の各要素には content（文字列）と flag（0 または 1）が必要です。",
            },
            { status: 400 }
          );
        }
        validItems.push({ content, flag });
      }
      const created = await createCommentsBulk(validItems);
      return NextResponse.json(
        { data: created, count: created.length },
        { status: 201 }
      );
    }

    // 1件登録
    const content = typeof body?.content === "string" ? body.content.trim() : "";
    const rawFlag = body?.flag;

    if (!content) {
      return NextResponse.json(
        { error: "content（文章テキスト）は必須です。" },
        { status: 400 }
      );
    }

    if (rawFlag !== 0 && rawFlag !== 1) {
      return NextResponse.json(
        {
          error:
            "flag には 0（冷笑している文章）または 1（冷笑していない文章）を指定してください。",
        },
        { status: 400 }
      );
    }

    const created = await createComment({
      content,
      flag: rawFlag as CommentFlag,
    });

    return NextResponse.json({ data: created }, { status: 201 });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "文章データの保存中に予期しないエラーが発生しました。";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * PATCH /api/comments
 * リクエストボディ (JSON):
 *   { "id": number | string, "content"?: string, "flag"?: 0 | 1 }
 */
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const id = body?.id;
    const content =
      typeof body?.content === "string" ? body.content.trim() : undefined;
    const rawFlag = body?.flag;

    if (id === undefined || id === null || id === "") {
      return NextResponse.json(
        { error: "更新対象の id が指定されていません。" },
        { status: 400 }
      );
    }

    if (content !== undefined && content.length === 0) {
      return NextResponse.json(
        { error: "content（文章テキスト）を空にすることはできません。" },
        { status: 400 }
      );
    }

    if (rawFlag !== undefined && rawFlag !== 0 && rawFlag !== 1) {
      return NextResponse.json(
        { error: "flag には 0 または 1 を指定してください。" },
        { status: 400 }
      );
    }

    const updated = await updateComment({
      id,
      content,
      flag: rawFlag as CommentFlag | undefined,
    });

    return NextResponse.json({ data: updated });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "文章データの更新中に予期しないエラーが発生しました。";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * DELETE /api/comments
 * クエリパラメータ:
 *   - id: 削除対象のID（例: /api/comments?id=12）
 *   - all=true: 全件削除（例: /api/comments?all=true）
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const id = searchParams.get("id");
    const all = searchParams.get("all");

    if (all === "true") {
      await deleteAllComments();
      return NextResponse.json({ success: true });
    }

    if (!id) {
      return NextResponse.json(
        { error: "削除対象の id パラメータを指定してください。" },
        { status: 400 }
      );
    }

    await deleteComment(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "文章データの削除中に予期しないエラーが発生しました。";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
