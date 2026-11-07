export type AchievementId =
  | 'perfect_hunter'
  | 'sniper'
  | 'master_of_cynicism'
  | 'dawn_of_cynicism'
  | 'half_and_half'
  | 'keep_trying'
  | 'trigger_happy'
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
    description: '冷笑ポストをすべて見抜き、誤答0・見逃し0で完全クリアした',
  },
  sniper: {
    id: 'sniper',
    title: 'そこに気づくとは…やはり天才か',
    description: '見逃しはあったが、誤答0（正答率100%）で冷笑だけを見抜いた',
  },
  master_of_cynicism: {
    id: 'master_of_cynicism',
    title: '24時間冷笑監視ポリス',
    description: '正答率80%以上100%未満の高精度で冷笑を見抜いた',
  },
  dawn_of_cynicism: {
    id: 'dawn_of_cynicism',
    title: '冷笑の夜明け',
    description: '正答率60%以上80%未満で冷笑を見抜いた',
  },
  half_and_half: {
    id: 'half_and_half',
    title: '「まあ、どっちもどっちだよね笑」',
    description: '正答率が50%台（50%以上60%未満）だった',
  },
  keep_trying: {
    id: 'keep_trying',
    title: '君，まだまだっすねw',
    description: '正答率が25%以上50%未満だった',
  },
  trigger_happy: {
    id: 'trigger_happy',
    title: 'すべてが冷笑に見える病',
    description: '手当たり次第に疑いすぎて、正答率が0%超〜25%未満だった',
  },
  cold_observer: {
    id: 'cold_observer',
    title: '冷笑の観測者',
    description: '制限時間内に回答を1回もしなかった',
  },
  hot_blooded: {
    id: 'hot_blooded',
    title: '熱血の申し子',
    description: '回答したポストがすべて誤答（正答率0%）だった',
  },
};

export const ACHIEVEMENT_LIST = Object.values(ACHIEVEMENTS);

export function evaluateAchievement(
  stats: Pick<PlayStatsInput, 'hits' | 'wrong' | 'missed' | 'timedOut'>,
): AchievementDefinition {
  const { hits, wrong, missed } = stats;

  // 1. 回答なし (hits = 0, wrong = 0)
  if (hits === 0 && wrong === 0) {
    return ACHIEVEMENTS.cold_observer;
  }

  // 2. 全問誤答・正答率 0% (hits = 0, wrong > 0)
  if (hits === 0) {
    return ACHIEVEMENTS.hot_blooded;
  }

  // 3. 正答率 100% かつ 見逃し 0 (hits > 0, wrong = 0, missed = 0)
  if (wrong === 0 && missed === 0) {
    return ACHIEVEMENTS.perfect_hunter;
  }

  // 4. 正答率 100% かつ 見逃しあり (hits > 0, wrong = 0, missed > 0)
  if (wrong === 0) {
    return ACHIEVEMENTS.sniper;
  }

  const accuracy = hits / (hits + wrong);

  // 5. 正答率 80%以上〜100%未満
  if (accuracy >= 0.8) {
    return ACHIEVEMENTS.master_of_cynicism;
  }

  // 6. 正答率 60%以上〜80%未満
  if (accuracy >= 0.6) {
    return ACHIEVEMENTS.dawn_of_cynicism;
  }

  // 7. 正答率 50%台（50%以上〜60%未満）
  if (accuracy >= 0.5) {
    return ACHIEVEMENTS.half_and_half;
  }

  // 8. 正答率 25%以上〜50%未満
  if (accuracy >= 0.25) {
    return ACHIEVEMENTS.keep_trying;
  }

  // 9. 正答率 0%超〜25%未満
  return ACHIEVEMENTS.trigger_happy;
}

export function getAchievementById(
  id: string | null | undefined,
): AchievementDefinition | null {
  return id && Object.hasOwn(ACHIEVEMENTS, id)
    ? ACHIEVEMENTS[id as AchievementId]
    : null;
}
