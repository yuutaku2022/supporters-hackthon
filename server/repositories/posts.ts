import 'server-only';
import { connection } from 'next/server';
import type { CommentRecord } from '@/DB/comment';
import { getComments, getCommentsByIds } from '@/DB/commentRepository';
import { MOCK_POSTS } from './mock-posts';

/**
 * ポストのデータアクセス
 *
 * Supabase の comments テーブル（DB/commentRepository.ts）から取る。
 * .env.local に Supabase の設定が無いときだけ、mock-posts.ts のサンプルを使う。
 *
 * comments テーブルとの対応：id → id、content → text、flag 0（冷笑している文章）→ cold: true
 * DB には投稿者名が無いので、speaker は id から作った仮の @ハンドル。
 */

/** ポスト1件（cold=true が冷笑ポスト） */
export type PostRecord = {
  id: string;
  /** 投稿者の @ハンドル */
  speaker: string;
  text: string;
  cold?: boolean;
  /** 冷笑ポストのモンスターと解説（モックのみ。解説画面用） */
  monsterId?: string;
  explanation?: string;
};

/** ゲーム開始時に全投稿をランダムな順序で返す */
export async function findRandomPosts(): Promise<PostRecord[]> {
  await connection(); // リクエストごとに違う結果を返すので、ビルド時に固定しない
  const posts: PostRecord[] = [];

  if (!hasDatabase()) {
    posts.push(...MOCK_POSTS);
  } else {
    const pageSize = 1000;
    for (let offset = 0; ; offset += pageSize) {
      const comments = await getComments({ limit: pageSize, offset });
      posts.push(...comments.map(toPost));
      if (comments.length < pageSize) break;
    }
  }

  return shuffle(posts);
}

/** id で指定したポストを返す（見つからない id は含めない） */
export async function findPostsByIds(ids: string[]): Promise<PostRecord[]> {
  const set = new Set(ids);
  const posts = !hasDatabase()
    ? MOCK_POSTS.filter((post) => set.has(post.id))
    : (await getCommentsByIds(ids)).map(toPost);
  const postsById = new Map(posts.map((post) => [post.id, post]));
  return ids.flatMap((id) => {
    const post = postsById.get(id);
    return post ? [post] : [];
  });
}

function shuffle<T>(items: T[]): T[] {
  const shuffled = [...items];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

const hasDatabase = () =>
  Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
  );

function toPost(c: CommentRecord): PostRecord {
  const id = String(c.id);
  return { id, speaker: handleFor(id), text: c.content, cold: c.flag === 0 };
}

const HANDLE_WORDS = ['neko', 'sora', 'tabi', 'mochi', 'hoshi', 'umi', 'kumo', 'yuki', 'hana', 'kaze', 'tsuki', 'mori'];

/** id から毎回同じ仮の @ハンドルを作る（例：@sora_42） */
function handleFor(id: string): string {
  let h = 0;
  for (const c of id) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return `@${HANDLE_WORDS[h % HANDLE_WORDS.length]}_${id}`;
}
