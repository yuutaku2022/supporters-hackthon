'use client';

import { useRouter } from 'next/navigation';
import { BGM, preloadPressSes, useBgm } from '@/lib/sound';
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { evaluateAchievement } from '@/DB/achievement';
import { TIME_LIMIT, TIMELINE_PAGE_SIZE } from '@/features/game/rules';
import type { PublicPost } from '@/types/game';
import { ApiError, fetchTimeline, postScore } from './api';
import { BattleLoading } from './BattleLoading';
import { BattleScreen } from './BattleScreen';

/** 時間切れのときに移動する結果画面 */
const RESULT_PATH = '/result';

/**
 * 1ゲーム分の進行
 * タイムラインをAPIから順次取得 → 制限時間内に冷笑を探す → 結果・実績画面へ
 * 投稿一覧に含まれる冷笑フラグでその場で判定し、採点は /api/score に任せる。
 */
export function BattleGame() {
  const router = useRouter();
  const [attempt, setAttempt] = useState(0);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [posts, setPosts] = useState<PublicPost[] | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [loadMoreError, setLoadMoreError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [finishError, setFinishError] = useState<string | null>(null);
  const nextIndex = useRef(0);
  const postOrder = useRef<string[]>([]);
  const seenPostIds = useRef(new Set<string>());
  const fetchingMore = useRef(false);
  const paginationController = useRef<AbortController | null>(null);

  // /play にいる間ずっと BGM を流す（読み込み中・やり直し中も途切れない）。結果画面などへ移ると止まる
  useBgm(BGM.battle);

  useEffect(() => {
    const ctrl = new AbortController();
    Promise.all([fetchTimeline(undefined, ctrl.signal), preloadPressSes()])
      .then(([page]) => {
        if (ctrl.signal.aborted) return;
        if (page.posts.length === 0) throw new ApiError('投稿がまだ登録されていません');
        postOrder.current = page.postIds ?? [];
        seenPostIds.current = new Set(page.posts.map((post) => post.id));
        nextIndex.current = page.posts.length;
        setPosts(page.posts);
        setHasMore(page.hasMore);
      })
      .catch((e: Error) => {
        if (!ctrl.signal.aborted) setLoadError(e.message);
      });
    return () => ctrl.abort();
  }, [attempt]);

  const loadMore = useCallback(async () => {
    if (!hasMore || fetchingMore.current) return;
    fetchingMore.current = true;
    setLoadingMore(true);
    setLoadMoreError(null);
    const ctrl = new AbortController();
    paginationController.current = ctrl;
    const requestedIds = postOrder.current.slice(
      nextIndex.current,
      nextIndex.current + TIMELINE_PAGE_SIZE + 1,
    );
    try {
      const page = await fetchTimeline(requestedIds, ctrl.signal);
      if (ctrl.signal.aborted) return;
      nextIndex.current += Math.min(TIMELINE_PAGE_SIZE, requestedIds.length);
      const newPosts = page.posts.filter((post) => {
        if (seenPostIds.current.has(post.id)) return false;
        seenPostIds.current.add(post.id);
        return true;
      });
      setPosts((current) => (current ? [...current, ...newPosts] : newPosts));
      setHasMore(page.hasMore);
    } catch (e) {
      if (!ctrl.signal.aborted) setLoadMoreError((e as Error).message);
    } finally {
      if (paginationController.current === ctrl) {
        paginationController.current = null;
        fetchingMore.current = false;
        setLoadingMore(false);
      }
    }
  }, [hasMore]);

  /** ゲームを捨てて、新しいタイムラインで最初から */
  const reset = () => {
    setPosts(null);
    setHasMore(false);
    setLoadingMore(false);
    setLoadMoreError(null);
    setLoadError(null);
    setSending(false);
    setFinishError(null);
    nextIndex.current = 0;
    postOrder.current = [];
    seenPostIds.current.clear();
    paginationController.current?.abort();
    paginationController.current = null;
    fetchingMore.current = false;
    setAttempt((a) => a + 1);
  };

  // Next.js（Cache Components）は画面を移動しても /play を隠して残し、戻るとそのまま再表示する。
  // ゲームは続きから再開させたくないので、隠れるとき（＝ページを離れるとき）にリセットする。
  useLayoutEffect(() => reset, []);

  if (!posts) return <BattleLoading error={loadError} onRetry={reset} />;

  // 時間切れ：押したポストからサーバーでスコアを計算して結果画面へ
  const onFinish = async (pressed: string[], maxSamePostStreak = 0) => {
    setSending(true);
    setFinishError(null);
    const minimumLoading = new Promise<void>((resolve) => window.setTimeout(resolve, 1000));
    try {
      const r = await postScore(pressed, posts.map((post) => post.id));
      await minimumLoading;
      const stats = {
        score: r.score,
        hits: r.hits,
        wrong: r.wrong,
        missed: r.missed,
        timedOut: true,
        maxSamePostStreak,
      };
      const achievement = evaluateAchievement(stats);

      const params = new URLSearchParams({
        score: String(r.score),
        achievement: achievement.id,
        resultId: crypto.randomUUID(),
      });
      router.push(`${RESULT_PATH}?${params.toString()}`);
    } catch (e) {
      await minimumLoading;
      setFinishError((e as Error).message);
      setSending(false);
    }
  };

  return (
    <BattleScreen
      key={attempt}
      posts={posts}
      timeLimit={TIME_LIMIT}
      hasMore={hasMore}
      loadingMore={loadingMore}
      loadMoreError={loadMoreError}
      onLoadMore={loadMore}
      onFinish={onFinish}
      sending={sending}
      error={finishError}
    />
  );
}
