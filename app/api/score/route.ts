import { findPostsByIds } from '@/server/repositories/posts';
import { score } from '@/server/services/scoring';
import type { ApiErrorBody, ScoreRequest, ScoreResponse } from '@/types/game';

/**
 * POST /api/score
 * body: { pressed: string[], notCold?: string[], timeline?: string[] } → { hits, wrong, missed, score }
 * pressed は「冷笑」、notCold は「冷笑じゃない」を押したポスト
 */
export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as Partial<ScoreRequest> | null;
  if (
    !isStringArray(body?.pressed) ||
    (body.notCold !== undefined && !isStringArray(body.notCold)) ||
    (body.timeline !== undefined && (!isStringArray(body.timeline) || body.timeline.length === 0))
  ) {
    return Response.json({ error: 'pressed / notCold / timeline が不正です' } satisfies ApiErrorBody, { status: 400 });
  }
  const pressedIds = [...new Set(body.pressed)];
  const notColdIds = [...new Set(body.notCold ?? [])];
  const timelineIds = body.timeline ? [...new Set(body.timeline)] : undefined;
  if (timelineIds && [...pressedIds, ...notColdIds].some((id) => !timelineIds.includes(id))) {
    return Response.json({ error: 'pressed / notCold にタイムライン外の ID が含まれています' } satisfies ApiErrorBody, { status: 400 });
  }
  if (notColdIds.some((id) => pressedIds.includes(id))) {
    return Response.json({ error: '同じポストに「冷笑」と「冷笑じゃない」の両方が含まれています' } satisfies ApiErrorBody, { status: 400 });
  }
  try {
    // 存在しない id と重複は数えない
    const allIds = [...new Set([...pressedIds, ...notColdIds, ...(timelineIds ?? [])])];
    const records = await findPostsByIds(allIds);
    if (records.length !== allIds.length) {
      return Response.json({ error: 'ポストが見つかりません' } satisfies ApiErrorBody, { status: 400 });
    }

    const byId = new Map(records.map((post) => [post.id, post]));
    const pick = (ids: string[]) =>
      ids.flatMap((id) => {
        const post = byId.get(id);
        return post ? [post] : [];
      });
    return Response.json(score(pick(pressedIds), timelineIds && pick(timelineIds), pick(notColdIds)) satisfies ScoreResponse);
  } catch (e) {
    return Response.json({ error: e instanceof Error ? e.message : '採点できませんでした' } satisfies ApiErrorBody, { status: 500 });
  }
}

const isStringArray = (v: unknown): v is string[] => Array.isArray(v) && v.every((x) => typeof x === 'string');
