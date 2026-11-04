export type AchievementId =
  | 'perfect_hunter'
  | 'dawn_of_cynicism'
  | 'keep_trying'
  | 'cold_observer'
  | 'hot_blooded';

export type AchievementDefinition = {
  id: AchievementId;
  title: string;
  description: string;
};

export type PlayStatsInput = {
  score: number;
  hits: number;
  wrong: number;
  missed: number;
  timedOut: boolean;
};

export const ACHIEVEMENTS: Record<AchievementId, AchievementDefinition> = {
  perfect_hunter: {
    id: 'perfect_hunter',
    title: '俺じゃなきゃ見逃しちゃうね',
    description: '冷笑ポストをすべて見抜き、誤答なしでクリアした',
  },
  dawn_of_cynicism: {
    id: 'dawn_of_cynicism',
    title: '冷笑の夜明け',
    description: '正答率50%以上で冷笑を見抜いた',
  },
  keep_trying: {
    id: 'keep_trying',
    title: '君，まだまだっすねw',
    description: '正答率が50%未満だった',
  },
  cold_observer: {
    id: 'cold_observer',
    title: '冷笑の観測者',
    description: '制限時間内に回答を1回もしなかった',
  },
  hot_blooded: {
    id: 'hot_blooded',
    title: '熱血の申し子',
    description: '回答したポストがすべて誤答だった',
  },
};

export const ACHIEVEMENT_LIST = Object.values(ACHIEVEMENTS);

export function evaluateAchievement(
  stats: Pick<PlayStatsInput, 'hits' | 'wrong' | 'missed' | 'timedOut'>,
): AchievementDefinition {
  const { hits, wrong, missed } = stats;

  if (hits > 0 && wrong === 0 && missed === 0) {
    return ACHIEVEMENTS.perfect_hunter;
  }
  if (hits === 0 && wrong === 0) {
    return ACHIEVEMENTS.cold_observer;
  }
  if (hits === 0) {
    return ACHIEVEMENTS.hot_blooded;
  }
  if (hits / (hits + wrong) >= 0.5) {
    return ACHIEVEMENTS.dawn_of_cynicism;
  }
  return ACHIEVEMENTS.keep_trying;
}

export function getAchievementById(
  id: string | null | undefined,
): AchievementDefinition | null {
  return id && Object.hasOwn(ACHIEVEMENTS, id)
    ? ACHIEVEMENTS[id as AchievementId]
    : null;
}
