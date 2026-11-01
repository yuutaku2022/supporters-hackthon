/**
 * 冷笑判定フラグ
 * 0: 冷笑している文章
 * 1: 冷笑していない文章
 */
export type CommentFlag = 0 | 1;

export const COMMENT_FLAG_LABELS: Record<CommentFlag, string> = {
  0: "冷笑している文章",
  1: "冷笑していない文章",
};

/**
 * DB（public.comments テーブル）の1レコードを表す型
 * Supabase 上の既存カラム: id (int8), content (text), is_creepy (boolean), created_at (timestamptz)
 * アプリ・API側では flag (0 | 1) として扱えるように変換します。
 */
export interface CommentRecord {
  id: number | string;
  content: string;
  flag: CommentFlag;
  is_creepy?: boolean;
  created_at: string;
}

/**
 * 新規文章登録時のリクエスト型
 */
export interface CreateCommentInput {
  content: string;
  flag: CommentFlag;
}
