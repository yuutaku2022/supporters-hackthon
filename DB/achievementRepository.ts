import { getSupabaseServerClient } from '@/DB/server';
import { evaluateAchievement, type PlayStatsInput } from '@/DB/achievement';

export async function createPlayAchievement(input: PlayStatsInput): Promise<void> {
  const achievement = evaluateAchievement(input);
  const { error } = await getSupabaseServerClient()
    .from('play_achievements')
    .insert({
      score: input.score,
      hits: input.hits,
      wrong: input.wrong,
      missed: input.missed,
      timed_out: input.timedOut,
      achievement_id: achievement.id,
      achievement_title: achievement.title,
    });

  if (error) {
    throw new Error(`実績データの保存に失敗しました: ${error.message}`);
  }
}
