import { findPostsByIds } from '@/server/repositories/posts';
import { score } from '@/server/services/scoring';
import type { ApiErrorBody, ScoreRequest, ScoreResponse } from '@/types/game';

/**
 * POST /api/score
 * body: { pressed: string[] } → { hits, wrong, score }
 */
export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as Partial<ScoreRequest> | null;
  if (
    !isStringArray(body?.pressed) ||
    (body.timeline !== undefined && (!isStringArray(body.timeline) || body.timeline.length === 0))
  ) {
    return Response.json({ error: 'pressed / timeline が不正です' } satisfies ApiErrorBody, { status: 400 });
  }
  const pressedIds = [...new Set(body.pressed)];
  const timelineIds = body.timeline ? [...new Set(body.timeline)] : undefined;
  if (timelineIds && pressedIds.some((id) => !timelineIds.includes(id))) {
    return Response.json({ error: 'pressed にタイムライン外の ID が含まれています' } satisfies ApiErrorBody, { status: 400 });
  }
  try {
    // 存在しない id と重複は数えない
    const allIds = [...new Set([...pressedIds, ...(timelineIds ?? [])])];
    const records = await findPostsByIds(allIds);
    if (records.length !== allIds.length) {
      return Response.json({ error: 'ポストが見つかりません' } satisfies ApiErrorBody, { status: 400 });
    }

    const byId = new Map(records.map((post) => [post.id, post]));
    const pressed = pressedIds.flatMap((id) => {
      const post = byId.get(id);
      return post ? [post] : [];
    });
    const timeline = timelineIds?.flatMap((id) => {
      const post = byId.get(id);
      return post ? [post] : [];
    });
    return Response.json(score(pressed, timeline) satisfies ScoreResponse);
  } catch (e) {
    return Response.json({ error: e instanceof Error ? e.message : '採点できませんでした' } satisfies ApiErrorBody, { status: 500 });
  }
}

const isStringArray = (v: unknown): v is string[] => Array.isArray(v) && v.every((x) => typeof x === 'string');
