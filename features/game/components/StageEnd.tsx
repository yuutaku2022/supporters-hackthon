import Link from 'next/link';
import type { StageResult } from '../result';
import { BIG_BUTTON } from './styles';

type Props = {
  result: StageResult;
  /** 同じステージをもう一度遊ぶ */
  onRetry: () => void;
};

/**
 * ゲーム終了画面（仮）
 * 本番の画面は別メンバーが作る。Props（result と onRetry）の形はそのままで、中身を作り替えてください。
 */
export function StageEnd({ result, onRetry }: Props) {
  const { stageName, stars, score, maxCombo, defeated, total } = result;
  return (
    <main className="relative mx-auto flex min-h-dvh w-full max-w-[430px] flex-col items-center gap-4 overflow-hidden bg-game-night bg-[radial-gradient(var(--color-game-night-2)_2px,transparent_2px)] bg-size-[22px_22px] px-4 pt-10 pb-7 font-game-body text-white min-[500px]:min-h-[844px] min-[500px]:rounded-[32px] min-[500px]:border-4 min-[500px]:border-game-ink">
      <p className="text-sm font-extrabold text-game-lilac">{stageName}</p>
      <h1 className="animate-pop font-game-display text-5xl text-game-yellow [text-shadow:4px_4px_0_var(--color-game-ink)] motion-reduce:animate-none">
        STAGE CLEAR
      </h1>
      <p className="font-game-display text-4xl tracking-widest text-game-yellow" aria-label={`星 ${stars}つ`}>
        {[0, 1, 2].map((i) => (
          <span key={i} className={i < stars ? '' : 'opacity-25'}>★</span>
        ))}
      </p>

      <dl className="grid w-full grid-cols-3 gap-2 rounded-[20px] border-4 border-game-ink bg-white p-4 text-center text-game-ink shadow-[0_6px_0_var(--color-game-ink)]">
        <div>
          <dt className="text-xs font-extrabold">スコア</dt>
          <dd className="font-game-display text-xl">{score.toLocaleString()}</dd>
        </div>
        <div>
          <dt className="text-xs font-extrabold">撃破</dt>
          <dd className="font-game-display text-xl">{defeated}/{total}</dd>
        </div>
        <div>
          <dt className="text-xs font-extrabold">最大コンボ</dt>
          <dd className="font-game-display text-xl">{maxCombo}</dd>
        </div>
      </dl>

      <div className="grow" />
      <button type="button" className={`${BIG_BUTTON} w-full bg-game-pink text-white [text-shadow:2px_2px_0_var(--color-game-ink)]`} onClick={onRetry}>
        もういちど
      </button>
      <Link href="/" className={`${BIG_BUTTON} w-full bg-white text-game-ink`}>
        トップへ
      </Link>
    </main>
  );
}
