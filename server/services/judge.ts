import 'server-only';
import { POINT_PER_HIT, TIME_BONUS_PER_SEC, TIME_LIMIT } from '@/features/game/rules';
import type { QuestionRecord } from '@/server/repositories/questions';
import type { CheckResponse, ColdPostReveal, JudgeResponse, PublicQuestion, Rating } from '@/types/game';

const coldIndexes = (q: QuestionRecord): number[] =>
  q.posts.flatMap((r, i) => (r.cold ? [i] : []));

/** ブラウザに返す形にする（冷笑かどうか・モンスター・解説を落とす） */
export function toPublicQuestion(q: QuestionRecord): PublicQuestion {
  return {
    id: q.id,
    posts: q.posts.map((p) => ({ speaker: p.speaker, text: p.text })),
  };
}

/**
 * こうげき（決定）時の判定
 *
 * TODO: timeLeft と combo は今はブラウザの申告値。セッション管理（DB担当）ができたら、
 * 出題時刻とコンボをサーバー側で持って改ざんできないようにする。
 */
export function judge(question: QuestionRecord, selected: number[], timeLeft: number, prevCombo: number): JudgeResponse {
  const cold = coldIndexes(question);
  // 範囲外・重複の番号は無視する。冷笑ではないポストを選んだ分はハズレになる
  const picked = [...new Set(selected)].filter((i) => Number.isInteger(i) && i >= 0 && i < question.posts.length);
  const time = clamp(Math.floor(timeLeft), 0, TIME_LIMIT);
  const combo0 = clamp(Math.floor(prevCombo), 0, 9999);

  const hits = picked.filter((i) => cold.includes(i));
  const wrong = picked.filter((i) => !cold.includes(i));
  const missed = cold.filter((i) => !picked.includes(i));

  let rating: Rating;
  if (hits.length === cold.length && wrong.length === 0) rating = 'PERFECT';
  else if (hits.length > 0 && wrong.length === 0) rating = 'GREAT';
  else if (hits.length > 0) rating = 'GOOD';
  else rating = 'MISS';

  const combo = rating === 'PERFECT' || rating === 'GREAT' ? combo0 + 1 : 0;
  const multiplier = 1 + Math.max(0, combo - 1) * 0.1;
  const base = hits.length * POINT_PER_HIT + (hits.length > 0 ? time * TIME_BONUS_PER_SEC : 0);
  const points = Math.round(base * multiplier);

  const coldPosts: ColdPostReveal[] = question.posts.flatMap((r, index) =>
    r.cold ? [{ index, monsterId: r.monsterId, explanation: r.explanation }] : [],
  );

  return { questionId: question.id, hits, missed, wrong, rating, points, combo, coldPosts };
}

/** 「冷笑」を押したポスト1件をその場で判定する */
export function check(question: QuestionRecord, index: number, found: number[]): CheckResponse {
  const cold = coldIndexes(question);
  const isCold = cold.includes(index);
  const foundNow = new Set(found.filter((i) => cold.includes(i)));
  if (isCold) foundNow.add(index);
  return { cold: isCold, remaining: cold.length - foundNow.size };
}

/** まだ選んでいない冷笑ポストを1つ返す（なければ null） */
export function hint(question: QuestionRecord, selected: number[]): number | null {
  return coldIndexes(question).find((i) => !selected.includes(i)) ?? null;
}

const clamp = (n: number, min: number, max: number) => (Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : min);
