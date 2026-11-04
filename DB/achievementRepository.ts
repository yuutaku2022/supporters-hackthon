import { getSupabaseServerClient } from "@/DB/server";
import {
  evaluateAchievement,
  type AchievementId,
  type PlayAchievementRecord,
  type PlayStatsInput,
} from "@/DB/achievement";

const TABLE_NAME = "play_achievements";

export interface GetPlayAchievementsOptions {
  achievementId?: AchievementId;
  limit?: number;
}

interface RawPlayAchievementRow {
  id: number | string;
  score: number;
  hits: number;
  wrong: number;
  missed: number;
  timed_out: boolean;
  achievement_id: AchievementId;
  achievement_title: string;
  created_at: string;
}

function mapRowToRecord(row: RawPlayAchievementRow): PlayAchievementRecord {
  return {
    id: row.id,
    score: row.score,
    hits: row.hits,
    wrong: row.wrong,
    missed: row.missed,
    timed_out: row.timed_out,
    achievement_id: row.achievement_id,
    achievement_title: row.achievement_title,
    created_at: row.created_at,
    persisted: true,
  };
}

/**
 * 1プレイの結果と獲得した称号を play_achievements テーブルに保存します。
 * 万が一 Supabase 上にテーブルが未作成の場合でも、ゲーム進行を止めないよう判定結果を返します。
 */
export async function createPlayAchievement(
  input: PlayStatsInput
): Promise<PlayAchievementRecord> {
  const achievement = evaluateAchievement(input);

  const payload = {
    score: Math.floor(input.score),
    hits: Math.max(0, Math.floor(input.hits)),
    wrong: Math.max(0, Math.floor(input.wrong)),
    missed: Math.max(0, Math.floor(input.missed)),
    timed_out: Boolean(input.timedOut),
    achievement_id: achievement.id,
    achievement_title: achievement.title,
  };

  try {
    const supabase = getSupabaseServerClient();
    const { data, error } = await supabase
      .from(TABLE_NAME)
      .insert(payload)
      .select(
        "id, score, hits, wrong, missed, timed_out, achievement_id, achievement_title, created_at"
      )
      .single();

    if (error || !data) {
      return {
        id: `local-${Date.now()}`,
        ...payload,
        created_at: new Date().toISOString(),
        persisted: false,
      };
    }

    return mapRowToRecord(data as RawPlayAchievementRow);
  } catch {
    return {
      id: `local-${Date.now()}`,
      ...payload,
      created_at: new Date().toISOString(),
      persisted: false,
    };
  }
}

/**
 * play_achievements テーブルから獲得実績・プレイ履歴の一覧を取得します。
 */
export async function getPlayAchievements(
  options: GetPlayAchievementsOptions = {}
): Promise<PlayAchievementRecord[]> {
  const supabase = getSupabaseServerClient();

  let query = supabase
    .from(TABLE_NAME)
    .select(
      "id, score, hits, wrong, missed, timed_out, achievement_id, achievement_title, created_at"
    )
    .order("created_at", { ascending: false });

  if (options.achievementId) {
    query = query.eq("achievement_id", options.achievementId);
  }

  if (options.limit && options.limit > 0) {
    query = query.limit(options.limit);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`DBからの実績履歴取得に失敗しました: ${error.message}`);
  }

  return ((data ?? []) as RawPlayAchievementRow[]).map(mapRowToRecord);
}

/**
 * 指定した id のプレイ実績レコードを1件取得します。
 */
export async function getPlayAchievementById(
  id: number | string
): Promise<PlayAchievementRecord | null> {
  try {
    const supabase = getSupabaseServerClient();
    const { data, error } = await supabase
      .from(TABLE_NAME)
      .select(
        "id, score, hits, wrong, missed, timed_out, achievement_id, achievement_title, created_at"
      )
      .eq("id", id)
      .single();

    if (error || !data) return null;
    return mapRowToRecord(data as RawPlayAchievementRow);
  } catch {
    return null;
  }
}
