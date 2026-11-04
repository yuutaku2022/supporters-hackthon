'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { evaluateAchievement } from '@/DB/achievement';
import { savePlayAchievement } from '@/DB/frontendClient';
import { START_HINTS } from '@/features/game/rules';
import type { PublicQuestion } from '@/types/game';
import { ApiError, fetchQuestions, postCheck, postHint, postJudge } from './api';
import { BattleLoading } from './BattleLoading';
import { BattleScreen } from './BattleScreen';

type Run = {
  questions: PublicQuestion[];
  qIndex: number;
  score: number;
  combo: number;
  hints: number;
  hits: number;
  wrong: number;
  missed: number;
  timedOut: boolean;
};

const newRun = (questions: PublicQuestion[]): Run => ({
  questions,
  qIndex: 0,
  score: 0,
  combo: 0,
  hints: START_HINTS,
  hits: 0,
  wrong: 0,
  missed: 0,
  timedOut: false,
});

/** 全部終わったときに移動する結果画面 */
const RESULT_PATH = '/result';

/**
 * 1ゲーム分の進行
 * 問題をAPIからランダムに取得 → タイムラインを順番に遊ぶ → 結果画面（/result?score=合計点）へ
 * 正解判定・ヒントはサーバー（/api/questions/:id/check, /judge, /hint）に任せる。
 */
export function BattleGame() {
  const router = useRouter();
  const [attempt, setAttempt] = useState(0);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [run, setRun] = useState<Run | null>(null);
  const [sending, setSending] = useState(false);
  const [finishError, setFinishError] = useState<string | null>(null);

  useEffect(() => {
    const ctrl = new AbortController();
    fetchQuestions(ctrl.signal)
      .then((questions) => {
        if (questions.length === 0) throw new ApiError('問題がまだ登録されていません');
        setRun(newRun(questions));
      })
      .catch((e: Error) => {
        if (!ctrl.signal.aborted) setLoadError(e.message);
      });
    return () => ctrl.abort();
  }, [attempt]);

  const reload = () => {
    setRun(null);
    setLoadError(null);
    setFinishError(null);
    setAttempt((a) => a + 1);
  };

  if (!run) return <BattleLoading error={loadError} onRetry={reload} />;

  const q = run.questions[run.qIndex];
  const total = run.questions.length;

  const onCheck = (index: number, found: number[]) => postCheck(q.id, { index, found });

  // 1問終わったら採点して、次のタイムラインへ。最後なら実績をDBに保存して結果画面へ
  const onFinish = async (selected: number[], timeLeft: number) => {
    setSending(true);
    setFinishError(null);
    try {
      const r = await postJudge(q.id, { selected, timeLeft, combo: run.combo });
      const score = run.score + r.points;
      // TODO: 点数ルールの変更候補（正解ひとつにつき +10点、誤答ひとつにつき -5点）
      // const score = run.score + (r.hits.length * 10 - r.wrong.length * 5);
      const hits = run.hits + r.hits.length;
      const wrong = run.wrong + r.wrong.length;
      const missed = run.missed + r.missed.length;
      const timedOut = run.timedOut || timeLeft <= 0 || r.missed.length > 0;

      if (run.qIndex + 1 >= total) {
        const stats = { score, hits, wrong, missed, timedOut };
        const evaluated = evaluateAchievement(stats);
        let achievementId = evaluated.id;

        try {
          const saved = await savePlayAchievement(stats);
          achievementId = saved.achievement.id;
        } catch {
          // DB保存が失敗しても結果画面への遷移は継続する
        }

        const params = new URLSearchParams({
          score: String(score),
          achievement: achievementId,
          hits: String(hits),
          wrong: String(wrong),
        });
        router.push(`${RESULT_PATH}?${params.toString()}`);
        return;
      }
      setRun({
        ...run,
        qIndex: run.qIndex + 1,
        score,
        combo: r.combo,
        hits,
        wrong,
        missed,
        timedOut,
      });
    } catch (e) {
      setFinishError((e as Error).message);
    } finally {
      setSending(false);
    }
  };

  const onHint = async (selected: number[]) => {
    const { index } = await postHint(q.id, selected);
    if (index !== null) setRun((r) => r && { ...r, hints: Math.max(0, r.hints - 1) });
    return index;
  };

  return (
    <BattleScreen
      key={`${attempt}-${run.qIndex}`}
      question={q}
      qIndex={run.qIndex}
      total={total}
      score={run.score}
      combo={run.combo}
      hints={run.hints}
      onCheck={onCheck}
      onFinish={onFinish}
      sending={sending}
      error={finishError}
      onHint={onHint}
    />
  );
}
