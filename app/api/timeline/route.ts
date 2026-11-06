import type { NextRequest } from 'next/server';
import { TIMELINE_PAGE_SIZE } from '@/features/game/rules';
import { findPostsByIds, findRandomPosts } from '@/server/repositories/posts';
import { toPublicPost } from '@/server/services/scoring';
import type { ApiErrorBody, TimelineResponse } from '@/types/game';

/**
 * GET /api/timeline → ランダムなタイムラインの最初の25件と、そのゲーム内の投稿順
 * GET /api/timeline?postId=... → 投稿順に沿った追加の25件
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

  const requestedIds = request.nextUrl.searchParams.getAll('postId');
  if (
    requestedIds.some((id) => !id) ||
    new Set(requestedIds).size !== requestedIds.length ||
    requestedIds.length > TIMELINE_PAGE_SIZE + 1
  ) {
    return Response.json({ error: 'postId は重複のない投稿IDを最大26件指定してください' } satisfies ApiErrorBody, { status: 400 });
  }

  try {
    let response: TimelineResponse;
    if (requestedIds.length > 0) {
      const posts = await findPostsByIds(requestedIds.slice(0, TIMELINE_PAGE_SIZE));
      response = {
        posts: posts.map(toPublicPost),
        hasMore: requestedIds.length > TIMELINE_PAGE_SIZE,
      };
    } else {
      const posts = await findRandomPosts();
      response = {
        posts: posts.slice(0, TIMELINE_PAGE_SIZE).map(toPublicPost),
        postIds: posts.map((post) => post.id),
        hasMore: posts.length > TIMELINE_PAGE_SIZE,
      };
    }
    return Response.json(response);
  } catch (e) {
    return serverError(e);
  }
}

const serverError = (e: unknown) =>
  Response.json({ error: e instanceof Error ? e.message : 'ポストを取得できませんでした' } satisfies ApiErrorBody, { status: 500 });
