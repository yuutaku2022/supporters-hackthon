import { getSupabaseServerClient } from "@/DB/server";

export type RankingEntry = {
  id: number;
  name: string;
  score: number;
  result_id: string;
  created_at: string;
};

const TABLE_NAME = "rankings";

export class RankingAlreadyRegisteredError extends Error {}

export async function getTopRankings(limit = 100): Promise<RankingEntry[]> {
  const { data, error } = await getSupabaseServerClient()
    .from(TABLE_NAME)
    .select("id, name, score, result_id, created_at")
    .order("score", { ascending: false })
    .order("created_at", { ascending: true })
    .limit(limit);

  if (error) {
    throw new Error(`ランキングの取得に失敗しました: ${error.message}`);
  }

  return (data ?? []) as RankingEntry[];
}

export async function createRankingEntry(input: {
  name: string;
  score: number;
  resultId: string;
}): Promise<RankingEntry> {
  const { data, error } = await getSupabaseServerClient()
    .from(TABLE_NAME)
    .insert({
      name: input.name,
      score: input.score,
      result_id: input.resultId,
    })
    .select("id, name, score, result_id, created_at")
    .single();

  if (error) {
    if (error.code === "23505") {
      throw new RankingAlreadyRegisteredError(
        "この結果はすでにランキングに登録されています。",
      );
    }
    throw new Error(`ランキングの登録に失敗しました: ${error.message}`);
  }

  return data as RankingEntry;
}
