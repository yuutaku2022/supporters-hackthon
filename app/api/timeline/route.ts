import type { NextRequest } from 'next/server';
import { TIMELINE_SIZE } from '@/features/game/rules';
import { findRandomPosts } from '@/server/repositories/posts';
import { toPublicPost } from '@/server/services/scoring';
import type { ApiErrorBody, TimelineResponse } from '@/types/game';

/**
 * GET /api/timeline → { posts: PublicPost[] }（1ゲーム分のタイムラインをランダムに）
 * どのポストが冷笑かは返さない。
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

  try {
    const posts = await findRandomPosts(TIMELINE_SIZE);
    return Response.json({ posts: posts.map(toPublicPost) } satisfies TimelineResponse);
  } catch (e) {
    return serverError(e);
  }
}

const serverError = (e: unknown) =>
  Response.json({ error: e instanceof Error ? e.message : 'ポストを取得できませんでした' } satisfies ApiErrorBody, { status: 500 });
