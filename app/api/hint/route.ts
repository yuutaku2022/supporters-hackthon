import { findPostsByIds } from '@/server/repositories/posts';
import { hint } from '@/server/services/scoring';
import type { ApiErrorBody, HintRequest, HintResponse } from '@/types/game';

/**
 * POST /api/hint
 * body: { timeline: string[], pressed: string[] } → { postId: string | null }（まだ押していない冷笑ポストを1つ）
 */
export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as Partial<HintRequest> | null;
  if (!isStringArray(body?.timeline) || !isStringArray(body?.pressed)) {
    return Response.json({ error: 'timeline / pressed が不正です' } satisfies ApiErrorBody, { status: 400 });
  }
  const timeline = await findPostsByIds(body.timeline);
  return Response.json({ postId: hint(timeline, body.pressed) } satisfies HintResponse);
}

const isStringArray = (v: unknown): v is string[] => Array.isArray(v) && v.every((x) => typeof x === 'string');
