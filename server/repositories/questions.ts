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
  stageId: number;
  /** 冷笑ポストを1件以上含める */
  posts: PostRecord[];
};

/** ステージの問題を出題順で返す。ステージが存在しなければ null */
export async function findQuestionsByStage(stageId: number): Promise<QuestionRecord[] | null> {
  if (!MOCK_STAGE_IDS.includes(stageId)) return null;
  return MOCK_QUESTIONS.filter((q) => q.stageId === stageId);
}

export async function findQuestionById(id: string): Promise<QuestionRecord | null> {
  return MOCK_QUESTIONS.find((q) => q.id === id) ?? null;
}

/** モックで「存在する」扱いにするステージ（4・5・6 は問題 0 件の準備中） */
const MOCK_STAGE_IDS = [1, 2, 3, 4, 5, 6];
