import type { NextRequest } from 'next/server';
import { findQuestionsByStage } from '@/server/repositories/questions';
import { toPublicQuestion } from '@/server/services/judge';
import type { ApiErrorBody, QuestionsResponse } from '@/types/game';

/**
 * GET /api/stages/:stageId/questions → { stageId, questions: PublicQuestion[] }
 * 答え（cold）と解説は返さない。
 *
 * 開発中だけ ?delay=ミリ秒 で遅延、?status=500 などでエラーを再現できる（読み込み・エラー表示の確認用）。
 */
export async function GET(request: NextRequest, ctx: RouteContext<'/api/stages/[stageId]/questions'>) {
  const { stageId } = await ctx.params;

  if (process.env.NODE_ENV !== 'production') {
    const params = request.nextUrl.searchParams;
    const delay = Number(params.get('delay') ?? 0);
    if (delay > 0) await new Promise((r) => setTimeout(r, Math.min(delay, 10000)));
    const forced = Number(params.get('status'));
    if (forced >= 400) return Response.json({ error: 'forced error' } satisfies ApiErrorBody, { status: forced });
  }

  const id = Number(stageId);
  const questions = Number.isInteger(id) ? await findQuestionsByStage(id) : null;
  if (!questions) return Response.json({ error: 'stage not found' } satisfies ApiErrorBody, { status: 404 });

  return Response.json({ stageId: id, questions: questions.map(toPublicQuestion) } satisfies QuestionsResponse);
}
