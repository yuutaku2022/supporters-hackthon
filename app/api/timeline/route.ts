import type { NextRequest } from 'next/server';
import { findRandomPostsPage } from '@/server/repositories/posts';
import { toPublicPost } from '@/server/services/scoring';
import type { ApiErrorBody, TimelineCursor, TimelineResponse } from '@/types/game';

/**
 * GET /api/timeline → ランダムな位置からタイムラインを25件取得
 * GET /api/timeline?offset=...&remaining=...&total=... → 続きの25件
 * 冷笑フラグは返すが、モンスター・解説は返さない。
 *
 * 開発中だけ ?delay=ミリ秒 で遅延、?status=500 などでエラーを再現できる（読み込み・エラー表示の確認用）。
 */
export async function GET(request: NextRequest) {
  if (process.env.NODE_ENV !== 'production') {
    const params = request.nextUrl.searchParams;
    const delay = Number(params.get('delay') ?? 0);
    if (delay > 0) await new Promise((r) => setTimeout(r, Math.min(delay, 10000)));
    const forced = Number(params.get('status'));
    if (forced >= 400) return Response.json({ error: 'forced error' } satisfies ApiErrorBody, { status: forced });
  }

  const params = request.nextUrl.searchParams;
  const cursorKeys = ['offset', 'remaining', 'total'] as const;
  const hasCursor = cursorKeys.some((key) => params.has(key));
  if (params.has('postId') || (hasCursor && !cursorKeys.every((key) => params.has(key)))) {
    return Response.json({ error: 'ページカーソルが不正です' } satisfies ApiErrorBody, { status: 400 });
  }

  let cursor: TimelineCursor | undefined;
  if (hasCursor) {
    const values = cursorKeys.map((key) => params.get(key)!);
    if (values.some((value) => !/^\d+$/.test(value))) {
      return Response.json({ error: 'ページカーソルは整数で指定してください' } satisfies ApiErrorBody, { status: 400 });
    }
    const [offset, remaining, total] = values.map(Number);
    if (
      !Number.isSafeInteger(offset) ||
      !Number.isSafeInteger(remaining) ||
      !Number.isSafeInteger(total) ||
      total < 1 ||
      offset >= total ||
      remaining < 1 ||
      remaining > total
    ) {
      return Response.json({ error: 'ページカーソルの範囲が不正です' } satisfies ApiErrorBody, { status: 400 });
    }
    cursor = { offset, remaining, total };
  }

  try {
    const page = await findRandomPostsPage(cursor);
    const response: TimelineResponse = {
      posts: page.posts.map(toPublicPost),
      hasMore: Boolean(page.cursor),
      ...(page.cursor ? { cursor: page.cursor } : {}),
    };
    return Response.json(response);
  } catch (e) {
    return serverError(e);
  }
}

const serverError = (e: unknown) =>
  Response.json({ error: e instanceof Error ? e.message : 'ポストを取得できませんでした' } satisfies ApiErrorBody, { status: 500 });
