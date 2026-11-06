import Link from 'next/link';
import { PILL, PILL_PRIMARY } from './styles';
import { XPhone } from './XPhone';

type Props = {
  error: string | null;
  /** エラー時の「再試行」。サーバーコンポーネントから使うとき（エラーなし）は省略 */
  onRetry?: () => void;
};

/** API から問題を取ってくる間の画面（ゲーム画面と同じ X 風） */
export function BattleLoading({ error, onRetry }: Props) {
  return (
    <XPhone>
      <header className="flex items-center gap-4 border-b border-x-line bg-black/85 px-4 pt-2.5 pb-3 backdrop-blur-md">
        <Link
          href="/"
          className="grid size-9 place-items-center rounded-full text-x-text hover:bg-x-text/10"
          aria-label="スタート画面にもどる"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true">
            <path d="M19 12H5M11 6l-6 6 6 6" />
          </svg>
        </Link>
        <div className="flex min-w-0 grow flex-col">
          <strong className="text-xl font-extrabold">ホーム</strong>
          <span className="truncate text-[13px] text-x-sub">タイムラインを読み込み中</span>
        </div>
      </header>

      <div
        className={`flex flex-col items-center justify-center gap-3 p-6 text-center ${
          error ? 'grow' : 'absolute inset-0 z-10 bg-black/45 backdrop-blur-[1px]'
        }`}
        role="status"
        aria-live="polite"
      >
        {error ? (
          <>
            <p className="text-xl font-extrabold">読み込めませんでした</p>
            <p className="text-[13px] text-x-sub">{error}</p>
            <div className="mt-3 flex flex-wrap justify-center gap-2.5">
              <button type="button" className={PILL_PRIMARY} onClick={onRetry}>再試行</button>
              <Link href="/" className={`${PILL} inline-flex items-center`}>スタート画面にもどる</Link>
            </div>
          </>
        ) : (
          <>
            <span
              className="size-10 animate-spin rounded-full border-[3px] border-white/20 border-t-x-blue shadow-[0_0_16px_color-mix(in_srgb,var(--color-x-blue)_45%,transparent)]"
              aria-hidden="true"
            />
            <span className="text-sm font-medium text-x-text">タイムラインを読み込み中…</span>
          </>
        )}
      </div>
    </XPhone>
  );
}
