export type AchievementId =
  | 'perfect_hunter'
  | 'one_hit_wonder'
  | 'sniper'
  | 'fatal_one_mistake'
  | 'master_of_cynicism'
  | 'keyboard_warrior'
  | 'dawn_of_cynicism'
  | 'half_and_half'
  | 'button_masher'
  | 'keep_trying'
  | 'trigger_happy'
  | 'cold_observer'
  | 'hot_blooded';

export type AchievementDefinition = {
  id: AchievementId;
  /** 優先度（1が最も難易度・優先度が高く、数値が小さいほど優先して表示される） */
  priority: number;
  title: string;
  description: string;
};

export type PlayStatsInput = {
  score: number;
  hits: number;
  wrong: number;
  missed: number;
  timedOut: boolean;
  /** 同じ冷笑ボタンを連続でタップした最大回数 */
  maxSamePostStreak?: number;
};

export const ACHIEVEMENTS: Record<AchievementId, AchievementDefinition> = {
  perfect_hunter: {
    id: 'perfect_hunter',
    priority: 1,
    title: '俺じゃなきゃ見逃しちゃうね',
    description: 'タイムライン上の冷笑ポストを1件も見逃さずにすべて見抜いた（見逃し0）',
  },
  master_of_cynicism: {
    id: 'master_of_cynicism',
    priority: 2,
    title: '24時間冷笑監視ポリス',
    description: '誤答2件以上ありつつも、正答率80%以上の高精度で冷笑を大量摘発した（8件以上正解）',
  },
  sniper: {
    id: 'sniper',
    priority: 3,
    title: 'そこに気づくとは…やはり天才か',
    description: '誤答0（正答率100%）で2件以上冷笑を見抜いた（慎重派スナイパー）',
  },
  fatal_one_mistake: {
    id: 'fatal_one_mistake',
    priority: 4,
    title: '惜しかったですね、まあ頑張った方じゃないですか？笑',
    description: '正答率80%以上（4件以上正解）なのに、たった1回の誤答で無傷を逃した（惜しくも1ミス）',
  },
  keyboard_warrior: {
    id: 'keyboard_warrior',
    priority: 5,
    title: 'インターネットの守護神（自称）',
    description: '10件以上のポストをタップして積極的にパトロールし、正答率60%以上80%未満だった',
  },
  button_masher: {
    id: 'button_masher',
    priority: 6,
    title: '指つりそうｗ',
    description: '同じ冷笑ボタンを連続で10回以上タップした（追い冷笑連打スタイル）',
  },
  one_hit_wonder: {
    id: 'one_hit_wonder',
    priority: 7,
    title: '「ほらね、やっぱり冷笑じゃん」',
    description: '誤答0のまま1件だけ冷笑を見抜いて満足した（一撃離脱スタイル）',
  },
  dawn_of_cynicism: {
    id: 'dawn_of_cynicism',
    priority: 8,
    title: '冷笑の夜明け',
    description: '正答率60%以上80%未満で冷笑を見抜いた',
  },
  half_and_half: {
    id: 'half_and_half',
    priority: 9,
    title: '「まあ、どっちもどっちだよね笑」',
    description: '正答率が50%台（50%以上60%未満）だった',
  },
  hot_blooded: {
    id: 'hot_blooded',
    priority: 10,
    title: '熱血の申し子',
    description: '回答したポストがすべて誤答（正答率0%）だった',
  },
  trigger_happy: {
    id: 'trigger_happy',
    priority: 11,
    title: 'すべてが冷笑に見える病',
    description: '手当たり次第に疑いすぎて、正答率が0%超〜25%未満だった',
  },
  keep_trying: {
    id: 'keep_trying',
    priority: 12,
    title: '君，まだまだっすねw',
    description: '正答率が25%以上50%未満だった',
  },
  cold_observer: {
    id: 'cold_observer',
    priority: 13,
    title: '冷笑の観測者',
    description: '制限時間内に回答を1回もしなかった（ROM専スタイル）',
  },
};

/** 優先度順（難易度が高い順：priority 1 → 13）に並んだ実績リスト */
export const ACHIEVEMENT_LIST = Object.values(ACHIEVEMENTS).sort(
  (a, b) => a.priority - b.priority,
);

type EvalStats = Pick<
  PlayStatsInput,
  'hits' | 'wrong' | 'missed' | 'timedOut' | 'maxSamePostStreak'
>;

/**
 * 各実績の解除条件定義
 * 複数同時に満たした場合は ACHIEVEMENTS[id].priority が最も高い（数値が小さい）ものが選ばれる
 */
const ACHIEVEMENT_CONDITIONS: Record<
  AchievementId,
  (stats: EvalStats) => boolean
> = {
  // 優先度1: 見逃し0でタイムライン上の冷笑ポストをすべて見抜いた
  perfect_hunter: ({ hits, missed }) => hits > 0 && missed === 0,

  // 優先度2: 誤答2件以上ありつつ正答率80%以上（＝最低でも8件以上正解が必要）
  master_of_cynicism: ({ hits, wrong }) =>
    hits > 0 && wrong >= 2 && hits / (hits + wrong) >= 0.8,

  // 優先度3: 誤答0（正答率100%）で2件以上正解
  sniper: ({ hits, wrong }) => hits >= 2 && wrong === 0,

  // 優先度4: 正答率80%以上（4件以上正解）で誤答がたった1回だけ
  fatal_one_mistake: ({ hits, wrong }) =>
    hits > 0 && wrong === 1 && hits / (hits + wrong) >= 0.8,

  // 優先度5: 合計10件以上タップ かつ 正答率60%以上80%未満
  keyboard_warrior: ({ hits, wrong }) => {
    const total = hits + wrong;
    if (hits === 0 || total < 10) return false;
    const accuracy = hits / total;
    return accuracy >= 0.6 && accuracy < 0.8;
  },

  // 優先度6: 同じ冷笑ボタンを連続10回以上タップ
  button_masher: ({ maxSamePostStreak = 0 }) => maxSamePostStreak >= 10,

  // 優先度7: 誤答0で1件だけ正解して終了
  one_hit_wonder: ({ hits, wrong }) => hits === 1 && wrong === 0,

  // 優先度8: 正答率60%以上80%未満
  dawn_of_cynicism: ({ hits, wrong }) => {
    const total = hits + wrong;
    if (hits === 0 || total === 0) return false;
    const accuracy = hits / total;
    return accuracy >= 0.6 && accuracy < 0.8;
  },

  // 優先度9: 正答率50%台（50%以上60%未満）
  half_and_half: ({ hits, wrong }) => {
    const total = hits + wrong;
    if (hits === 0 || total === 0) return false;
    const accuracy = hits / total;
    return accuracy >= 0.5 && accuracy < 0.6;
  },

  // 優先度10: 回答したポストがすべて誤答（正答率0%）
  hot_blooded: ({ hits, wrong }) => hits === 0 && wrong > 0,

  // 優先度11: 正答率0%超〜25%未満
  trigger_happy: ({ hits, wrong }) => {
    const total = hits + wrong;
    if (hits === 0 || total === 0) return false;
    const accuracy = hits / total;
    return accuracy < 0.25;
  },

  // 優先度12: 正答率25%以上50%未満
  keep_trying: ({ hits, wrong }) => {
    const total = hits + wrong;
    if (hits === 0 || total === 0) return false;
    const accuracy = hits / total;
    return accuracy >= 0.25 && accuracy < 0.5;
  },

  // 優先度13: 1回も回答しなかった
  cold_observer: ({ hits, wrong }) => hits === 0 && wrong === 0,
};

/**
 * 1プレイの成績から、解除条件を満たした実績のうち最も優先度（難易度）が高い1つを返す
 */
export function evaluateAchievement(stats: EvalStats): AchievementDefinition {
  for (const achievement of ACHIEVEMENT_LIST) {
    if (ACHIEVEMENT_CONDITIONS[achievement.id](stats)) {
      return achievement;
    }
  }
  return ACHIEVEMENTS.cold_observer;
}

export function getAchievementById(
  id: string | null | undefined,
): AchievementDefinition | null {
  return id && Object.hasOwn(ACHIEVEMENTS, id)
    ? ACHIEVEMENTS[id as AchievementId]
    : null;
}
