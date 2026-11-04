/** ゲームのルール定数（サーバーの判定とブラウザの表示で共通） */
export const TIME_LIMIT = 30; // 1問の制限時間（秒）
export const START_HINTS = 2;
export const POINT_PER_HIT = 100;
export const TIME_BONUS_PER_SEC = 5;
/** 1ゲームで出すタイムライン（問題）の数 */
export const QUESTIONS_PER_GAME = 3;

// TODO: 点数ルールの変更候補（正解ひとつにつき +10点、誤答ひとつにつき -5点）
// export const POINT_PER_HIT = 10;
// export const PENALTY_PER_WRONG = 5;
