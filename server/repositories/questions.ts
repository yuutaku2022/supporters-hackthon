import 'server-only';
import { MOCK_QUESTIONS } from './mock-questions';

/**
 * 問題データのアクセス（DB担当とつなぐ部分）
 *
 * 今は mock-questions.ts のサンプルを返している。
 * Supabase につなぐときは、この2つの関数の中身だけを差し替える（戻り値の形は変えない）。
 */

/** DB に入っているポスト1件。cold=true が冷笑ポスト（モンスターと解説つき） */
export type PostRecord =
  | { speaker: string; text: string; cold?: false }
  | { speaker: string; text: string; cold: true; monsterId: string; explanation: string };

/** DB に入っている1問＝タイムライン1画面分（答えと解説を含む。ブラウザに直接返さない） */
export type QuestionRecord = {
  id: string;
  /** 冷笑ポストを1件以上含める */
  posts: PostRecord[];
};

/** 問題をランダムに count 件返す（件数が足りなければあるだけ） */
export async function findRandomQuestions(count: number): Promise<QuestionRecord[]> {
  return shuffle(MOCK_QUESTIONS).slice(0, count);
}

export async function findQuestionById(id: string): Promise<QuestionRecord | null> {
  return MOCK_QUESTIONS.find((q) => q.id === id) ?? null;
}

function shuffle<T>(list: T[]): T[] {
  const a = [...list];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
