import type {
  CheckRequest,
  CheckResponse,
  HintResponse,
  JudgeRequest,
  JudgeResponse,
  PublicQuestion,
  QuestionsResponse,
} from '@/types/game';

/**
 * ブラウザから呼ぶ API（app/api/ の Route Handler）
 *   GET  /api/stages/:stageId/questions
 *   POST /api/questions/:questionId/check   「冷笑」を押したポスト1件をその場で判定
 *   POST /api/questions/:questionId/judge   問題の終わりにまとめて採点・解説
 *   POST /api/questions/:questionId/hint
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

export async function fetchQuestions(stageId: number, signal?: AbortSignal): Promise<PublicQuestion[]> {
  const url = `/api/stages/${stageId}/questions${location.search}`;
  const body = await request<QuestionsResponse>(url, { signal });
  if (!Array.isArray(body.questions)) throw new ApiError('レスポンスに questions 配列がありません');
  body.questions.forEach((q, i) => {
    const problem = questionProblem(q);
    if (problem) throw new ApiError(`questions[${i}] の形が不正です：${problem}`);
  });
  return body.questions;
}

export const postJudge = (questionId: string, req: JudgeRequest) =>
  request<JudgeResponse>(`/api/questions/${encodeURIComponent(questionId)}/judge`, {
    method: 'POST',
    body: JSON.stringify(req),
  });

export const postCheck = (questionId: string, req: CheckRequest) =>
  request<CheckResponse>(`/api/questions/${encodeURIComponent(questionId)}/check`, {
    method: 'POST',
    body: JSON.stringify(req),
  });

export const postHint =(questionId: string, selected: number[]) =>
  request<HintResponse>(`/api/questions/${encodeURIComponent(questionId)}/hint`, {
    method: 'POST',
    body: JSON.stringify({ selected }),
  });

function questionProblem(q: unknown): string | null {
  if (typeof q !== 'object' || q === null) return 'オブジェクトではない';
  const o = q as Record<string, unknown>;
  if (typeof o.id !== 'string') return 'id が文字列ではない';
  if (!Array.isArray(o.posts) || o.posts.length === 0) return 'posts が空';
  if (!o.posts.every((p) => typeof p?.speaker === 'string' && typeof p?.text === 'string')) {
    return 'posts[].speaker / posts[].text が文字列ではない';
  }
  return null;
}
