import type { Metadata } from 'next';
import { BattleGame } from './BattleGame';

export const metadata: Metadata = { title: '冷笑ハンター' };

/** バトル画面：/play */
export default function PlayPage() {
  return (
    <div className="flex flex-1 flex-col bg-[#120a2a] [-webkit-tap-highlight-color:transparent] min-[500px]:py-6">
      <BattleGame />
    </div>
  );
}
