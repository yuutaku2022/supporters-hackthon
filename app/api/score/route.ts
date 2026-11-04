import { findPostsByIds } from '@/server/repositories/posts';
import { score } from '@/server/services/scoring';
import type { ApiErrorBody, ScoreRequest, ScoreResponse } from '@/types/game';

/**
 * POST /api/score
 * body: { pressed: string[] } → { hits, wrong, score }
 */
export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as Partial<ScoreRequest> | null;
  if (!isStringArray(body?.pressed)) {
    return Response.json({ error: 'pressed が不正です' } satisfies ApiErrorBody, { status: 400 });
  }
  try {
    // 存在しない id と重複は数えない
    const pressed = await findPostsByIds([...new Set(body.pressed)]);
    return Response.json(score(pressed) satisfies ScoreResponse);
  } catch (e) {
    return Response.json({ error: e instanceof Error ? e.message : '採点できませんでした' } satisfies ApiErrorBody, { status: 500 });
  }
}

const isStringArray = (v: unknown): v is string[] => Array.isArray(v) && v.every((x) => typeof x === 'string');
