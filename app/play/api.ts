import type { CheckResponse, HintRequest, HintResponse, PublicPost, ScoreResponse, TimelineResponse } from '@/types/game';

/**
 * ブラウザから呼ぶ API（app/api/ の Route Handler）
 *   GET  /api/timeline             1ゲーム分のタイムライン（ランダム）
 *   POST /api/posts/:postId/check  「冷笑」を押したポスト1件をその場で判定
 *   POST /api/score                時間切れのとき、押したポストからスコアを計算
 *   POST /api/hint                 まだ押していない冷笑ポストを1つ教える
 */
export class ApiError extends Error {}

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(url, { ...init, headers: { Accept: 'application/json', 'Content-Type': 'application/json' } });
  } catch (e) {
    if ((e as Error).name === 'AbortError') throw e;
    throw new ApiError(`APIにつながりませんでした（${url}）`);
  }
  const body = await res.json().catch(() => null);
  if (!res.ok) {
    const detail = typeof body?.error === 'string' ? `：${body.error}` : '';
    throw new ApiError(`APIエラー：HTTP ${res.status}${detail}（${url}）`);
  }
  if (body === null) throw new ApiError(`レスポンスがJSONではありません（${url}）`);
  return body as T;
}

export async function fetchTimeline(signal?: AbortSignal): Promise<PublicPost[]> {
  const url = `/api/timeline${location.search}`;
  const body = await request<TimelineResponse>(url, { signal });
  if (!Array.isArray(body.posts)) throw new ApiError('レスポンスに posts 配列がありません');
  const bad = body.posts.findIndex(
    (p) => typeof p?.id !== 'string' || typeof p?.speaker !== 'string' || typeof p?.text !== 'string',
  );
  if (bad >= 0) throw new ApiError(`posts[${bad}] の形が不正です（id / speaker / text が文字列ではない）`);
  return body.posts;
}

export const postCheck = (postId: string) =>
  request<CheckResponse>(`/api/posts/${encodeURIComponent(postId)}/check`, { method: 'POST' });

export const postScore = (pressed: string[]) =>
  request<ScoreResponse>('/api/score', { method: 'POST', body: JSON.stringify({ pressed }) });

export const postHint = (req: HintRequest) =>
  request<HintResponse>('/api/hint', { method: 'POST', body: JSON.stringify(req) });
