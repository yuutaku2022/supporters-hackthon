import { findQuestionById } from '@/server/repositories/questions';
import { judge } from '@/server/services/judge';
import type { ApiErrorBody, JudgeRequest, JudgeResponse } from '@/types/game';

/**
 * POST /api/questions/:questionId/judge
 * body: { selected: number[], timeLeft: number, combo: number } → JudgeResponse
 */
export async function POST(request: Request, ctx: RouteContext<'/api/questions/[questionId]/judge'>) {
  const { questionId } = await ctx.params;

  const body = (await request.json().catch(() => null)) as Partial<JudgeRequest> | null;
  if (!body || !isNumberArray(body.selected) || typeof body.timeLeft !== 'number' || typeof body.combo !== 'number') {
    return Response.json({ error: 'selected / timeLeft / combo が不正です' } satisfies ApiErrorBody, { status: 400 });
  }

  const question = await findQuestionById(questionId);
  if (!question) return Response.json({ error: 'question not found' } satisfies ApiErrorBody, { status: 404 });

  return Response.json(judge(question, body.selected, body.timeLeft, body.combo) satisfies JudgeResponse);
}

const isNumberArray = (v: unknown): v is number[] => Array.isArray(v) && v.every((x) => typeof x === 'number');
