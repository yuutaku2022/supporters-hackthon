import type { CommentFlag, CommentRecord } from "@/DB/comment";
import type {
  AchievementDefinition,
  PlayAchievementRecord,
  PlayStatsInput,
} from "@/DB/achievement";

/**
 * フロントエンド（画面・ゲームコンポーネント）からランダムに文章を取得するためのヘルパー関数
 *
 * 使い方（フロントエンド側）:
 *   import { fetchRandomComments } from "@/DB/frontendClient";
 *   const comments = await fetchRandomComments(50);
 */
export async function fetchRandomComments(
  limit: number = 50,
  flag?: CommentFlag
): Promise<CommentRecord[]> {
  const params = new URLSearchParams({
    random: "true",
    limit: String(limit),
  });

  if (flag === 0 || flag === 1) {
    params.set("flag", String(flag));
  }

  const response = await fetch(`/api/comments?${params.toString()}`, {
    cache: "no-store",
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(
      result?.error || "ランダムな文章データの取得に失敗しました。"
    );
  }

  return (result.data ?? []) as CommentRecord[];
}

/**
 * 1ゲーム終了時にプレイ結果と獲得称号を DB（/api/achievements）へ保存するヘルパー関数
 */
export async function savePlayAchievement(input: PlayStatsInput): Promise<{
  record: PlayAchievementRecord;
  achievement: AchievementDefinition;
}> {
  const response = await fetch("/api/achievements", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result?.error || "実績データの保存に失敗しました。");
  }

  return {
    record: result.data as PlayAchievementRecord,
    achievement: result.achievement as AchievementDefinition,
  };
}

/**
 * 獲得した称号の履歴を DB（/api/achievements）から取得するヘルパー関数
 */
export async function fetchPlayAchievements(
  limit: number = 50
): Promise<PlayAchievementRecord[]> {
  const params = new URLSearchParams({ limit: String(limit) });
  const response = await fetch(`/api/achievements?${params.toString()}`, {
    cache: "no-store",
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result?.error || "実績データの取得に失敗しました。");
  }

  return (result.data ?? []) as PlayAchievementRecord[];
}
