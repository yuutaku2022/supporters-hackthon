import type { NextRequest } from 'next/server';
import { QUESTIONS_PER_GAME } from '@/features/game/rules';
import { findRandomQuestions } from '@/server/repositories/questions';
import { toPublicQuestion } from '@/server/services/judge';
import type { ApiErrorBody, QuestionsResponse } from '@/types/game';

/**
 * GET /api/questions → { questions: PublicQuestion[] }（1ゲーム分をランダムに）
 * どのポストが冷笑か・モンスター・解説は返さない。
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

  const questions = await findRandomQuestions(QUESTIONS_PER_GAME);
  return Response.json({ questions: questions.map(toPublicQuestion) } satisfies QuestionsResponse);
}
