'use client';

import { useEffect, useState } from 'react';
import type { JudgeResponse, PublicQuestion } from '@/types/game';
import { ApiError, fetchQuestions, postCheck, postHint, postJudge } from '../api';
import { stageById } from '../data/stages';
import { START_HINTS } from '../rules';
import type { StageResult } from '../result';
import { loadSave, writeSave } from '../save';
import { BattleLoading } from './BattleLoading';
import { BattleScreen } from './BattleScreen';
import { JudgeScreen } from './JudgeScreen';
import { StageEnd } from './StageEnd';

type Run = {
  questions: PublicQuestion[];
  qIndex: number;
  score: number;
  combo: number;
  maxCombo: number;
  hints: number;
  defeated: number;
  perfect: number;
  rounds: JudgeResponse[];
};

type View =
  | { kind: 'loading'; error: string | null }
  | { kind: 'battle' }
  | { kind: 'judge'; result: JudgeResponse; newMonsters: string[] }
  | { kind: 'end'; result: StageResult };

const newRun = (questions: PublicQuestion[]): Run => ({
  questions,
  qIndex: 0,
  score: 0,
  combo: 0,
  maxCombo: 0,
  hints: START_HINTS,
  defeated: 0,
  perfect: 0,
  rounds: [],
});

/**
 * 1ステージ分のゲーム進行
 * 問題をAPIから取得 → バトル ⇄ 撃破・解説 → ゲーム終了画面（StageResult を渡す）
 * 正解判定・ヒントはサーバー（/api/questions/:id/judge, /hint）に任せる。
 */
export function BattleGame({ stageId }: { stageId: number }) {
  const stageName = stageById(stageId)?.name ?? `ステージ${stageId}`;
  const [attempt, setAttempt] = useState(0);
  const [view, setView] = useState<View>({ kind: 'loading', error: null });
  const [run, setRun] = useState<Run | null>(null);
  const [sending, setSending] = useState(false);
  const [attackError, setAttackError] = useState<string | null>(null);

  useEffect(() => {
    const ctrl = new AbortController();
    fetchQuestions(stageId, ctrl.signal)
      .then((questions) => {
        if (questions.length === 0) throw new ApiError('このステージの問題はまだ準備中です');
        setRun(newRun(questions));
        setView({ kind: 'battle' });
      })
      .catch((e: Error) => {
        if (!ctrl.signal.aborted) setView({ kind: 'loading', error: e.message });
      });
    return () => ctrl.abort();
  }, [stageId, attempt]);

  const reload = () => {
    setRun(null);
    setAttackError(null);
    setView({ kind: 'loading', error: null });
    setAttempt((a) => a + 1);
  };

  if (!run || view.kind === 'loading') {
    return <BattleLoading stageName={stageName} error={view.kind === 'loading' ? view.error : null} onRetry={reload} />;
  }

  const q = run.questions[run.qIndex];
  const total = run.questions.length;

  const onCheck = (index: number, found: number[]) => postCheck(q.id, { index, found });

  const onFinish = async (selected: number[], timeLeft: number) => {
    setSending(true);
    setAttackError(null);
    try {
      const r = await postJudge(q.id, { selected, timeLeft, combo: run.combo });
      const hit = r.hits.length > 0;
      // 当てた冷笑ポストのモンスターをずかんに登録
      const save = loadSave();
      const hitMonsters = r.coldPosts.filter((c) => r.hits.includes(c.index)).map((c) => c.monsterId);
      const newMonsters = [...new Set(hitMonsters)].filter((id) => !save.zukan.includes(id));
      if (newMonsters.length) writeSave({ ...save, zukan: [...save.zukan, ...newMonsters] });
      setRun({
        ...run,
        score: run.score + r.points,
        combo: r.combo,
        maxCombo: Math.max(run.maxCombo, r.combo),
        defeated: run.defeated + (hit ? 1 : 0),
        perfect: run.perfect + (r.rating === 'PERFECT' ? 1 : 0),
        rounds: [...run.rounds, r],
      });
      setView({ kind: 'judge', result: r, newMonsters });
    } catch (e) {
      setAttackError((e as Error).message);
    } finally {
      setSending(false);
    }
  };

  const onHint = async (selected: number[]) => {
    const { index } = await postHint(q.id, selected);
    if (index !== null) setRun((r) => r && { ...r, hints: Math.max(0, r.hints - 1) });
    return index;
  };

  const onNext = () => {
    if (run.qIndex + 1 >= total) {
      // 星：1=クリア、2=全問撃破、3=全問PERFECT
      const stars = run.perfect === total ? 3 : run.defeated === total ? 2 : 1;
      const save = loadSave();
      writeSave({
        ...save,
        exp: save.exp + run.score,
        stars: { ...save.stars, [stageId]: Math.max(save.stars[stageId] ?? 0, stars) },
      });
      setView({
        kind: 'end',
        result: {
          stageId,
          stageName,
          score: run.score,
          stars,
          total,
          defeated: run.defeated,
          perfect: run.perfect,
          maxCombo: run.maxCombo,
          rounds: run.rounds,
        },
      });
    } else {
      setRun({ ...run, qIndex: run.qIndex + 1 });
      setView({ kind: 'battle' });
    }
  };

  switch (view.kind) {
    case 'judge':
      return (
        <JudgeScreen
          question={q}
          result={view.result}
          newMonsters={view.newMonsters}
          isLast={run.qIndex + 1 >= total}
          onNext={onNext}
        />
      );
    case 'end':
      return <StageEnd result={view.result} onRetry={reload} />;
    default:
      return (
        <BattleScreen
          key={`${attempt}-${run.qIndex}`}
          stageName={stageName}
          question={q}
          qIndex={run.qIndex}
          total={total}
          score={run.score}
          combo={run.combo}
          hints={run.hints}
          onCheck={onCheck}
          onFinish={onFinish}
          sending={sending}
          error={attackError}
          onHint={onHint}
        />
      );
  }
}
