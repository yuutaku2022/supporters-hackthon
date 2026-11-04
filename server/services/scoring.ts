import 'server-only';
import { scoreOf } from '@/features/game/rules';
import type { PostRecord } from '@/server/repositories/posts';
import type { PublicPost, ScoreResponse } from '@/types/game';

/** ブラウザに返す形にする（冷笑かどうか・モンスター・解説を落とす） */
export const toPublicPost = (p: PostRecord): PublicPost => ({ id: p.id, speaker: p.speaker, text: p.text });

/**
 * 押したポストから最終スコアを計算する
 *
 * TODO: どのポストを出したかは今はブラウザの申告。セッション管理（DB担当）ができたら、
 * 出したタイムラインと押した時刻をサーバー側で持って改ざんできないようにする。
 */
export function score(pressed: PostRecord[]): ScoreResponse {
  const hits = pressed.filter((p) => p.cold).length;
  const wrong = pressed.length - hits;
  return { hits, wrong, score: scoreOf(hits, wrong) };
}

/** タイムラインの中で、まだ押していない冷笑ポストを1つ返す（なければ null） */
export function hint(timeline: PostRecord[], pressedIds: string[]): string | null {
  return timeline.find((p) => p.cold && !pressedIds.includes(p.id))?.id ?? null;
}
