/**
 * 冷笑ハンターの API でやりとりする型（サーバー・フロント共通）
 *
 * 1問＝タイムラインに並んだポスト数件。プレイヤーは冷笑しているポストを選ぶ。
 * 答え（どのポストが冷笑か）とモンスター・解説はブラウザに先に渡さない。
 * 判定はサーバーの POST /api/questions/:id/judge で行い、そのレスポンスで明かす。
 */

/** ポスト1件（ブラウザに渡す形。冷笑かどうかは含めない） */
export type PublicPost = {
  /** 投稿者の @ハンドル */
  speaker: string;
  text: string;
};

/** 問題取得 API が返す1問（タイムライン1画面分） */
export type PublicQuestion = {
  id: string;
  /** 冷笑とふつうのポストが混ざっている */
  posts: PublicPost[];
};

/** GET /api/stages/:stageId/questions */
export type QuestionsResponse = {
  stageId: number;
  questions: PublicQuestion[];
};

export type Rating = 'PERFECT' | 'GREAT' | 'GOOD' | 'MISS';

/** POST /api/questions/:id/judge のリクエスト（問題の終わりにまとめて採点） */
export type JudgeRequest = {
  /** 冷笑ボタンを押したポストの番号（当たり・ハズレとも） */
  selected: number[];
  /** 問題が終わった時点の残り秒数 */
  timeLeft: number;
  /** この問題の前までのコンボ数 */
  combo: number;
};

/** 判定後に明かす、冷笑ポスト1件の正体 */
export type ColdPostReveal = {
  /** posts の番号 */
  index: number;
  monsterId: string;
  /** 「なぜ冷笑？」の解説 */
  explanation: string;
};

/** POST /api/questions/:id/judge のレスポンス */
export type JudgeResponse = {
  questionId: string;
  /** 当たったポスト */
  hits: number[];
  /** 見逃した冷笑ポスト */
  missed: number[];
  /** 冷笑ではないのに選んだポスト */
  wrong: number[];
  rating: Rating;
  points: number;
  /** この問題を終えた後のコンボ数 */
  combo: number;
  /** この問題の冷笑ポスト全部の正体と解説 */
  coldPosts: ColdPostReveal[];
};

/** POST /api/questions/:id/check のリクエスト（「冷笑」を押したポスト1件をその場で判定） */
export type CheckRequest = {
  /** 押したポストの番号 */
  index: number;
  /** それまでに当てたポストの番号（「残り何件」の計算に使う） */
  found: number[];
};

/** POST /api/questions/:id/check のレスポンス */
export type CheckResponse = {
  /** 押したポストが冷笑だったか */
  cold: boolean;
  /** まだ見つけていない冷笑ポストの数。0 になったらこの問題は終わり */
  remaining: number;
};

/** POST /api/questions/:id/hint のリクエスト */
export type HintRequest = { selected: number[] };

/** POST /api/questions/:id/hint のレスポンス。まだ選んでいない冷笑ポストを1つ教える（なければ null） */
export type HintResponse = { index: number | null };

export type ApiErrorBody = { error: string };
