/** ゲームのルール定数（サーバーの採点とブラウザの表示で共通） */
export const TIME_LIMIT = 60; // 1ゲームの制限時間（秒）
export const TIME_BONUS_PER_SEC = 10;
export const START_HINTS = 2;
export const QUESTIONS_PER_GAME = 3;
export const POINT_PER_HIT = 100; // 当たり1件の点数
export const PENALTY_PER_MISS = 50; // ハズレ1件で引く点数（スコアは0点より下にならない）
/** タイムラインを一度に取得するポスト数 */
export const TIMELINE_PAGE_SIZE = 25;

/** 当たり・ハズレの数からスコアを出す */
export const scoreOf = (hits: number, wrong: number) => Math.max(0, hits * POINT_PER_HIT - wrong * PENALTY_PER_MISS);
