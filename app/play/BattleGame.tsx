'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { START_HINTS } from '@/features/game/rules';
import type { PublicPost } from '@/types/game';
import { ApiError, fetchTimeline, postCheck, postHint, postScore } from './api';
import { BattleLoading } from './BattleLoading';
import { BattleScreen } from './BattleScreen';

/** 時間切れのときに移動する結果画面 */
const RESULT_PATH = '/result';

/**
 * 1ゲーム分の進行
 * タイムラインをAPIからランダムに取得 → 制限時間内に冷笑を探す → 結果画面（/result?score=合計点）へ
 * 当たり判定・採点・ヒントはサーバー（/api/posts/:id/check, /api/score, /api/hint）に任せる。
 */
export function BattleGame() {
  const router = useRouter();
  const [attempt, setAttempt] = useState(0);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [posts, setPosts] = useState<PublicPost[] | null>(null);
  const [hints, setHints] = useState(START_HINTS);
  const [sending, setSending] = useState(false);
  const [finishError, setFinishError] = useState<string | null>(null);

  useEffect(() => {
    const ctrl = new AbortController();
    fetchTimeline(ctrl.signal)
      .then((list) => {
        if (list.length === 0) throw new ApiError('ポストがまだ登録されていません');
        setPosts(list);
      })
      .catch((e: Error) => {
        if (!ctrl.signal.aborted) setLoadError(e.message);
      });
    return () => ctrl.abort();
  }, [attempt]);

  const reload = () => {
    setPosts(null);
    setLoadError(null);
    setAttempt((a) => a + 1);
  };

  if (!posts) return <BattleLoading error={loadError} onRetry={reload} />;

  const onCheck = async (postId: string) => (await postCheck(postId)).cold;

  // 時間切れ：押したポストからサーバーでスコアを計算して結果画面へ
  const onFinish = async (pressed: string[]) => {
    setSending(true);
    setFinishError(null);
    try {
      const r = await postScore(pressed);
      router.push(`${RESULT_PATH}?score=${r.score}`);
    } catch (e) {
      setFinishError((e as Error).message);
      setSending(false);
    }
  };

  const onHint = async (pressed: string[]) => {
    const { postId } = await postHint({ timeline: posts.map((p) => p.id), pressed });
    if (postId !== null) setHints((h) => Math.max(0, h - 1));
    return postId;
  };

  return (
    <BattleScreen
      key={attempt}
      posts={posts}
      hints={hints}
      onCheck={onCheck}
      onFinish={onFinish}
      sending={sending}
      error={finishError}
      onHint={onHint}
    />
  );
}
