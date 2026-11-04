import { findQuestionById } from '@/server/repositories/questions';
import { hint } from '@/server/services/judge';
import type { ApiErrorBody, HintRequest, HintResponse } from '@/types/game';

/**
 * POST /api/questions/:questionId/hint
 * body: { selected: number[] } → { index: number | null }（まだ選んでいない弱点を1つ）
 */
export async function POST(request: Request, ctx: RouteContext<'/api/questions/[questionId]/hint'>) {
  const { questionId } = await ctx.params;

  const body = (await request.json().catch(() => null)) as Partial<HintRequest> | null;
  const selected = body?.selected;
  if (!Array.isArray(selected) || !selected.every((x) => typeof x === 'number')) {
    return Response.json({ error: 'selected が不正です' } satisfies ApiErrorBody, { status: 400 });
  }

  const question = await findQuestionById(questionId);
  if (!question) return Response.json({ error: 'question not found' } satisfies ApiErrorBody, { status: 404 });

  return Response.json({ index: hint(question, selected) } satisfies HintResponse);
}
