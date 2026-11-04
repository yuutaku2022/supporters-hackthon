import type { CommentFlag, CommentRecord } from "@/DB/comment";

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
