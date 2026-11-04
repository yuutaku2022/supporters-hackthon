/**
 * 称号（実績）の識別子
 * - perfect_hunter  : 制限時間内のノーミス → 「俺じゃなきゃ見逃しちゃうね」
 * - dawn_of_cynicism: 正答率が半分以上     → 「冷笑の夜明け」
 * - keep_trying     : 正答率が半分未満     → 「君，まだまだっすねw」
 * - cold_observer   : 制限時間内に回答を1回もしなかった → 「冷笑の観測者」
 * - hot_blooded     : 全ての回答で誤答を選んだ → 「熱血の申し子」
 */
export type AchievementId =
  | "perfect_hunter"
  | "dawn_of_cynicism"
  | "keep_trying"
  | "cold_observer"
  | "hot_blooded";

export interface AchievementDefinition {
  id: AchievementId;
  title: string;
  description: string;
}

/**
 * コード側で管理する称号（実績）の定義一覧
 */
export const ACHIEVEMENTS: Record<AchievementId, AchievementDefinition> = {
  perfect_hunter: {
    id: "perfect_hunter",
    title: "俺じゃなきゃ見逃しちゃうね",
    description: "制限時間内にノーミスで全ての冷笑を見抜いた",
  },
  dawn_of_cynicism: {
    id: "dawn_of_cynicism",
    title: "冷笑の夜明け",
    description: "正答率50%以上で冷笑を見抜いた",
  },
  keep_trying: {
    id: "keep_trying",
    title: "君，まだまだっすねw",
    description: "正答率が50%未満だった",
  },
  cold_observer: {
    id: "cold_observer",
    title: "冷笑の観測者",
    description: "制限時間内に回答を1回もしなかった",
  },
  hot_blooded: {
    id: "hot_blooded",
    title: "熱血の申し子",
    description: "全ての回答で誤答を選んだ",
  },
};

export const ACHIEVEMENT_LIST: AchievementDefinition[] = [
  ACHIEVEMENTS.perfect_hunter,
  ACHIEVEMENTS.dawn_of_cynicism,
  ACHIEVEMENTS.keep_trying,
  ACHIEVEMENTS.cold_observer,
  ACHIEVEMENTS.hot_blooded,
];

/**
 * 1ゲーム終了時のプレイ集計データ
 */
export interface PlayStatsInput {
  /** 合計スコア */
  score: number;
  /** 正解（冷笑を見抜いた）数 */
  hits: number;
  /** 誤答（冷笑ではないポストを選んだ）数 */
  wrong: number;
  /** 見逃した冷笑ポスト数 */
  missed: number;
  /** 制限時間切れがあったか */
  timedOut: boolean;
}

/**
 * DB（public.play_achievements テーブル）の1レコードを表す型
 */
export interface PlayAchievementRecord {
  id: number | string;
  score: number;
  hits: number;
  wrong: number;
  missed: number;
  timed_out: boolean;
  achievement_id: AchievementId;
  achievement_title: string;
  created_at: string;
  /** DBテーブル未作成時などのフォールバック判定用フラグ（任意） */
  persisted?: boolean;
}

/**
 * 1ゲーム分のプレイ挙動から獲得称号を判定します。
 *
 * 判定ルール:
 * 1. 制限時間内のノーミス（時間切れなし・誤答0・見逃し0・正解1以上） -> 「俺じゃなきゃ見逃しちゃうね」
 * 2. 制限時間内に回答を1回もしなかった（正解0 かつ 誤答0）           -> 「冷笑の観測者」
 * 3. 全ての回答で誤答を選んだ（誤答1以上 かつ 正解0）               -> 「熱血の申し子」
 * 4. 正答率が半分以上（正解数 / 回答数 >= 0.5）                     -> 「冷笑の夜明け」
 * 5. 正答率が半分未満（正解数 / 回答数 < 0.5）                      -> 「君，まだまだっすねw」
 */
export function evaluateAchievement(
  stats: Pick<PlayStatsInput, "hits" | "wrong" | "missed" | "timedOut">
): AchievementDefinition {
  const { hits, wrong, missed, timedOut } = stats;

  // 1. 制限時間内のノーミス
  if (!timedOut && wrong === 0 && missed === 0 && hits > 0) {
    return ACHIEVEMENTS.perfect_hunter;
  }

  // 2. 回答を1回もしなかった（選択数が0）
  if (hits === 0 && wrong === 0) {
    return ACHIEVEMENTS.cold_observer;
  }

  // 3. 全ての回答で誤答を選んだ（1回以上回答し、正解が0）
  if (wrong > 0 && hits === 0) {
    return ACHIEVEMENTS.hot_blooded;
  }

  // 4 & 5. 正答率（正解数 / 回答数）による判定
  const totalAnswered = hits + wrong;
  const accuracy = totalAnswered > 0 ? hits / totalAnswered : 0;

  if (accuracy >= 0.5) {
    return ACHIEVEMENTS.dawn_of_cynicism;
  }

  return ACHIEVEMENTS.keep_trying;
}

/**
 * 称号IDから定義を取得します（不正な値や未指定時は keep_trying にフォールバック）
 */
export function getAchievementById(
  id: string | null | undefined
): AchievementDefinition {
  if (id && id in ACHIEVEMENTS) {
    return ACHIEVEMENTS[id as AchievementId];
  }
  return ACHIEVEMENTS.keep_trying;
}

// TODO: 点数ルールの変更候補（正解ひとつにつき +10点、誤答ひとつにつき -5点）
// export function calculateSimpleScore(hits: number, wrong: number): number {
//   return hits * 10 - wrong * 5;
// }
