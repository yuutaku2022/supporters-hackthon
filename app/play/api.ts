import type { HintRequest, HintResponse, ScoreResponse, TimelineCursor, TimelineResponse } from '@/types/game';

/**
 * ブラウザから呼ぶ API（app/api/ の Route Handler）
 *   GET  /api/timeline             タイムラインを25件ずつ取得
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

export async function fetchTimeline(cursor?: TimelineCursor, signal?: AbortSignal): Promise<TimelineResponse> {
  const params = new URLSearchParams();
  if (cursor) {
    params.set('offset', String(cursor.offset));
    params.set('remaining', String(cursor.remaining));
    params.set('total', String(cursor.total));
  }
  const query = params.size > 0 ? `?${params.toString()}` : '';
  const url = `/api/timeline${query}`;
  const body = await request<TimelineResponse>(url, { signal });
  if (!Array.isArray(body.posts) || typeof body.hasMore !== 'boolean') {
    throw new ApiError('レスポンスに posts 配列または hasMore がありません');
  }
  const pageCursor = body.cursor;
  const validCursor =
    pageCursor !== undefined &&
    typeof pageCursor === 'object' &&
    pageCursor !== null &&
    Number.isSafeInteger(pageCursor.offset) &&
    Number.isSafeInteger(pageCursor.remaining) &&
    Number.isSafeInteger(pageCursor.total) &&
    pageCursor.offset >= 0 &&
    pageCursor.remaining >= 1 &&
    pageCursor.total >= 1 &&
    pageCursor.offset < pageCursor.total &&
    pageCursor.remaining <= pageCursor.total;
  if (
    body.hasMore !== (pageCursor !== undefined) ||
    (pageCursor !== undefined && !validCursor)
  ) {
    throw new ApiError('レスポンスのページカーソルが不正です');
  }
  const bad = body.posts.findIndex(
    (p) =>
      typeof p?.id !== 'string' ||
      typeof p?.speaker !== 'string' ||
      typeof p?.text !== 'string' ||
      typeof p?.cold !== 'boolean',
  );
  if (bad >= 0) {
    throw new ApiError(`posts[${bad}] の形が不正です（id / speaker / text / cold）`);
  }
  return body;
}

export const postScore = (pressed: string[], timeline: string[]) =>
  request<ScoreResponse>('/api/score', { method: 'POST', body: JSON.stringify({ pressed, timeline }) });

export const postHint = (req: HintRequest) =>
  request<HintResponse>('/api/hint', { method: 'POST', body: JSON.stringify(req) });
