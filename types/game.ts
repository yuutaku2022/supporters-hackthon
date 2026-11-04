/**
 * 冷笑ハンターの API でやりとりする型（サーバー・フロント共通）
 *
 * 1ゲーム＝1本の長いタイムライン。制限時間内に、冷笑しているポストをできるだけ多く見つける。
 * どのポストが冷笑かはブラウザに渡さない。判定・採点はサーバーで行う。
 */

/** ポスト1件（ブラウザに渡す形。冷笑かどうかは含めない） */
export type PublicPost = {
  id: string;
  /** 投稿者の @ハンドル */
  speaker: string;
  text: string;
};

/** GET /api/timeline */
export type TimelineResponse = {
  posts: PublicPost[];
};

/** POST /api/posts/:postId/check のレスポンス（「冷笑」を押したポスト1件をその場で判定） */
export type CheckResponse = {
  cold: boolean;
};

/** POST /api/score のリクエスト（時間切れのとき、押したポストからスコアを計算） */
export type ScoreRequest = {
  /** 「冷笑」を押したポストの id（当たり・ハズレとも） */
  pressed: string[];
};

/** POST /api/score のレスポンス */
export type ScoreResponse = {
  /** 当たりの数 */
  hits: number;
  /** ハズレの数 */
  wrong: number;
  score: number;
};

/** POST /api/hint のリクエスト */
export type HintRequest = {
  /** タイムラインに出ているポストの id */
  timeline: string[];
  /** もう「冷笑」を押したポストの id */
  pressed: string[];
};

/** POST /api/hint のレスポンス。まだ押していない冷笑ポストを1つ教える（なければ null） */
export type HintResponse = { postId: string | null };

export type ApiErrorBody = { error: string };
