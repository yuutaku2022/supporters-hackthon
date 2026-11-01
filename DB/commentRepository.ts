import { getSupabaseServerClient } from "@/DB/server";
import type {
  CommentFlag,
  CommentRecord,
  CreateCommentInput,
} from "@/DB/comment";

const TABLE_NAME = "comments";

export interface GetCommentsOptions {
  flag?: CommentFlag;
  limit?: number;
  random?: boolean;
}

export interface UpdateCommentInput {
  id: number | string;
  content?: string;
  flag?: CommentFlag;
}

interface RawCommentRow {
  id: number | string;
  content: string;
  is_creepy?: boolean;
  flag?: number;
  created_at: string;
}

/**
 * Supabase の boolean カラム (is_creepy) と 0/1 フラグの相互変換
 * 0 (冷笑している文章) <-> false
 * 1 (冷笑していない文章) <-> true
 */
function toFlag(row: RawCommentRow): CommentFlag {
  if (row.flag === 0 || row.flag === 1) {
    return row.flag;
  }
  return row.is_creepy ? 1 : 0;
}

function flagToBoolean(flag: CommentFlag): boolean {
  return flag === 1;
}

function mapRowToRecord(row: RawCommentRow): CommentRecord {
  return {
    id: row.id,
    content: row.content,
    flag: toFlag(row),
    is_creepy: row.is_creepy,
    created_at: row.created_at,
  };
}

/**
 * 配列をランダムにシャッフルする（Fisher-Yates アルゴリズム）
 */
function shuffleArray<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

/**
 * comments テーブルからAI生成文章の一覧を取得します。
 * options.random が true の場合はランダムに並び替えて指定件数（デフォルト50件）を返します。
 */
export async function getComments(
  options: GetCommentsOptions = {}
): Promise<CommentRecord[]> {
  const supabase = getSupabaseServerClient();

  let query = supabase
    .from(TABLE_NAME)
    .select("id, content, is_creepy, created_at")
    .order("id", { ascending: true });

  if (options.flag === 0 || options.flag === 1) {
    query = query.eq("is_creepy", flagToBoolean(options.flag));
  }

  // ランダム取得でない場合のみ DB 側で limit をかける
  if (!options.random && options.limit && options.limit > 0) {
    query = query.limit(options.limit);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`DBからの文章取得に失敗しました: ${error.message}`);
  }

  const records = ((data ?? []) as RawCommentRow[]).map(mapRowToRecord);

  if (options.random) {
    const targetLimit =
      options.limit && options.limit > 0 ? options.limit : 50;
    return shuffleArray(records).slice(0, targetLimit);
  }

  return records;
}

/**
 * comments テーブルからランダムに指定件数（デフォルト50件）を取得します。
 */
export async function getRandomComments(
  limit: number = 50,
  flag?: CommentFlag
): Promise<CommentRecord[]> {
  return getComments({ random: true, limit, flag });
}

/**
 * comments テーブルに新しいAI生成文章とフラグ（0 または 1）を1件保存します。
 */
export async function createComment(
  input: CreateCommentInput
): Promise<CommentRecord> {
  const supabase = getSupabaseServerClient();

  const { data, error } = await supabase
    .from(TABLE_NAME)
    .insert({
      content: input.content.trim(),
      is_creepy: flagToBoolean(input.flag),
    })
    .select("id, content, is_creepy, created_at")
    .single();

  if (error) {
    throw new Error(`DBへの文章保存に失敗しました: ${error.message}`);
  }

  return mapRowToRecord(data as RawCommentRow);
}

/**
 * comments テーブルに複数のAI生成文章を一括保存（バルクインサート）します。
 */
export async function createCommentsBulk(
  inputs: CreateCommentInput[]
): Promise<CommentRecord[]> {
  const supabase = getSupabaseServerClient();

  const rows = inputs.map((item) => ({
    content: item.content.trim(),
    is_creepy: flagToBoolean(item.flag),
  }));

  const { data, error } = await supabase
    .from(TABLE_NAME)
    .insert(rows)
    .select("id, content, is_creepy, created_at");

  if (error) {
    throw new Error(`DBへの一括保存に失敗しました: ${error.message}`);
  }

  return ((data ?? []) as RawCommentRow[]).map(mapRowToRecord);
}

/**
 * 指定した id の文章またはフラグを更新（編集）します。
 */
export async function updateComment(
  input: UpdateCommentInput
): Promise<CommentRecord> {
  const supabase = getSupabaseServerClient();

  const updatePayload: { content?: string; is_creepy?: boolean } = {};
  if (typeof input.content === "string") {
    updatePayload.content = input.content.trim();
  }
  if (input.flag === 0 || input.flag === 1) {
    updatePayload.is_creepy = flagToBoolean(input.flag);
  }

  const { data, error } = await supabase
    .from(TABLE_NAME)
    .update(updatePayload)
    .eq("id", input.id)
    .select("id, content, is_creepy, created_at")
    .single();

  if (error) {
    throw new Error(`DBの文章更新に失敗しました: ${error.message}`);
  }

  return mapRowToRecord(data as RawCommentRow);
}

/**
 * 指定した id の文章を1件削除します。
 */
export async function deleteComment(id: number | string): Promise<void> {
  const supabase = getSupabaseServerClient();

  const { error } = await supabase.from(TABLE_NAME).delete().eq("id", id);

  if (error) {
    throw new Error(`DBからの文章削除に失敗しました: ${error.message}`);
  }
}

/**
 * comments テーブルの全データを削除（クリア）します。
 */
export async function deleteAllComments(): Promise<void> {
  const supabase = getSupabaseServerClient();

  const { error } = await supabase.from(TABLE_NAME).delete().gte("id", 0);

  if (error) {
    throw new Error(`DBの全件削除に失敗しました: ${error.message}`);
  }
}
