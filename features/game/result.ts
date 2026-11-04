import type { JudgeResponse } from '@/types/game';

/**
 * バトルが終わったときにゲーム終了画面へ渡すデータ
 * ゲーム終了画面（担当は別メンバー）は、これと「もういちど」の onRetry だけを受け取る。
 */
export type GameResult = {
  /** 合計スコア */
  score: number;
  /** 0〜3。1=最後まで終えた、2=全問で1体以上撃破、3=全問PERFECT */
  stars: number;
  /** 問題数 */
  total: number;
  /** 1体以上撃破できた問題の数 */
  defeated: number;
  /** PERFECT だった問題の数 */
  perfect: number;
  maxCombo: number;
  /** 各問題の採点結果（judge API のレスポンスそのまま、出題順） */
  rounds: JudgeResponse[];
};
