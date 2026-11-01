import { Suspense } from 'react';
import { BattleGame } from '@/features/game/components/BattleGame';
import { BattleLoading } from '@/features/game/components/BattleLoading';

/** バトル画面：/play/1 〜 /play/6 */
export default function PlayPage({ params }: PageProps<'/play/[stageId]'>) {
  return (
    <Suspense fallback={<BattleLoading stageName="読み込み中" error={null} />}>
      {params.then(({ stageId }) => (
        <BattleGame stageId={Number(stageId)} />
      ))}
    </Suspense>
  );
}
