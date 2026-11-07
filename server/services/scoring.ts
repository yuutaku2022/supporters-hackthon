import 'server-only';
import { scoreOf } from '@/features/game/rules';
import type { PostRecord } from '@/server/repositories/posts';
import type { PublicPost, ScoreResponse } from '@/types/game';

/** ブラウザに返す形にする（モンスター・解説を落とす） */
export const toPublicPost = (p: PostRecord): PublicPost => ({
  id: p.id,
  speaker: p.speaker,
  text: p.text,
  cold: Boolean(p.cold),
});

/**
 * 押したポストから最終スコアを計算する
 *
 * - 「冷笑」を押した投稿が冷笑なら正解、そうでなければハズレ
 * - 「冷笑じゃない」を押した投稿が冷笑でなければ正解、冷笑ならハズレ
 * - hits = 正解の数（両方のボタンの合計）、wrong = ハズレの数、missed = 「冷笑」で見抜けなかった冷笑投稿の数
 *
 * TODO: どのポストを出したかは今はブラウザの申告。セッション管理（DB担当）ができたら、
 * 出したタイムラインと押した時刻をサーバー側で持って改ざんできないようにする。
 */
export function score(pressed: PostRecord[], timeline?: PostRecord[], notCold: PostRecord[] = []): ScoreResponse {
  const coldHits = pressed.filter((p) => p.cold).length;
  const notColdHits = notCold.filter((p) => !p.cold).length;
  const hits = coldHits + notColdHits;
  const wrong = pressed.length + notCold.length - hits;
  const coldInTimeline = timeline?.filter((p) => p.cold).length ?? coldHits;
  const missed = Math.max(0, coldInTimeline - coldHits);
  return { hits, wrong, missed, score: scoreOf(hits, wrong) };
}

/** タイムラインの中で、まだ押していない冷笑ポストを1つ返す（なければ null） */
export function hint(timeline: PostRecord[], pressedIds: string[]): string | null {
  return timeline.find((p) => p.cold && !pressedIds.includes(p.id))?.id ?? null;
}
