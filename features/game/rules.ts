/** ゲームのルール定数（サーバーの採点とブラウザの表示で共通） */
export const TIME_LIMIT = 60; // 1ゲームの制限時間（秒）
export const START_HINTS = 2;
export const POINT_PER_HIT = 100; // 当たり1件の点数
export const PENALTY_PER_MISS = 50; // ハズレ1件で引く点数（スコアは0点より下にならない）
/** タイムラインに並べるポストの数（データが足りなければあるだけ） */
export const TIMELINE_SIZE = 30;

/** 当たり・ハズレの数からスコアを出す */
export const scoreOf = (hits: number, wrong: number) => Math.max(0, hits * POINT_PER_HIT - wrong * PENALTY_PER_MISS);
