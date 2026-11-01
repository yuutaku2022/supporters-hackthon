import { findQuestionById } from '@/server/repositories/questions';
import { check } from '@/server/services/judge';
import type { ApiErrorBody, CheckRequest, CheckResponse } from '@/types/game';

/**
 * POST /api/questions/:questionId/check
 * body: { index: number, found: number[] } → { cold: boolean, remaining: number }
 */
export async function POST(request: Request, ctx: RouteContext<'/api/questions/[questionId]/check'>) {
  const { questionId } = await ctx.params;

  const body = (await request.json().catch(() => null)) as Partial<CheckRequest> | null;
  const found = body?.found;
  if (
    !body ||
    !Number.isInteger(body.index) ||
    !Array.isArray(found) ||
    !found.every((x) => typeof x === 'number')
  ) {
    return Response.json({ error: 'index / found が不正です' } satisfies ApiErrorBody, { status: 400 });
  }

  const question = await findQuestionById(questionId);
  if (!question) return Response.json({ error: 'question not found' } satisfies ApiErrorBody, { status: 404 });
  if (body.index! < 0 || body.index! >= question.posts.length) {
    return Response.json({ error: 'index が範囲外です' } satisfies ApiErrorBody, { status: 400 });
  }

  return Response.json(check(question, body.index!, found) satisfies CheckResponse);
}
