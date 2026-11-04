import { findPostsByIds } from '@/server/repositories/posts';
import type { ApiErrorBody, CheckResponse } from '@/types/game';

/**
 * POST /api/posts/:postId/check → { cold: boolean }
 * 「冷笑」を押したポスト1件が冷笑かどうかをその場で返す。
 */
export async function POST(_request: Request, ctx: RouteContext<'/api/posts/[postId]/check'>) {
  const { postId } = await ctx.params;
  try {
    const [post] = await findPostsByIds([postId]);
    if (!post) return Response.json({ error: 'post not found' } satisfies ApiErrorBody, { status: 404 });
    return Response.json({ cold: Boolean(post.cold) } satisfies CheckResponse);
  } catch (e) {
    return Response.json({ error: e instanceof Error ? e.message : '判定できませんでした' } satisfies ApiErrorBody, { status: 500 });
  }
}
