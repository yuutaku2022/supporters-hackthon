import 'server-only';
import { MOCK_POSTS } from './mock-posts';

/**
 * ポストのデータアクセス（DB担当とつなぐ部分）
 *
 * 今は mock-posts.ts のサンプルを返している。
 * Supabase につなぐときは、この2つの関数の中身だけを差し替える（戻り値の形は変えない）。
 * 例：comments テーブルの id / content / 冷笑フラグ を PostRecord の id / text / cold に対応させる。
 */

/** DB に入っているポスト1件（cold=true が冷笑ポスト。ブラウザに直接返さない） */
export type PostRecord = {
  id: string;
  /** 投稿者の @ハンドル */
  speaker: string;
  text: string;
  cold?: boolean;
  /** 冷笑ポストのモンスターと解説（今は使っていない。解説画面用） */
  monsterId?: string;
  explanation?: string;
};

/** ポストをランダムに count 件返す（件数が足りなければあるだけ） */
export async function findRandomPosts(count: number): Promise<PostRecord[]> {
  return shuffle(MOCK_POSTS).slice(0, count);
}

/** id で指定したポストを返す（見つからない id は含めない） */
export async function findPostsByIds(ids: string[]): Promise<PostRecord[]> {
  const set = new Set(ids);
  return MOCK_POSTS.filter((p) => set.has(p.id));
}

function shuffle<T>(list: T[]): T[] {
  const a = [...list];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
