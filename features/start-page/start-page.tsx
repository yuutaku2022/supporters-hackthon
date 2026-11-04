import Link from 'next/link';
import { XPhone } from '@/app/play/XPhone';
import { PENALTY_PER_MISS, POINT_PER_HIT, TIME_LIMIT, TIMELINE_SIZE } from '@/features/game/rules';

/** ゲーム名（ブラウザのタブ名にも使う） */
export const GAME_TITLE = 'ちょっ，おまw';

const STEPS = [
  { title: 'タイムラインを読む', body: `ポストが${TIMELINE_SIZE}件ながれてくる` },
  { title: '冷笑を見つけたら押す', body: `当たり +${POINT_PER_HIT}点 ／ ハズレ −${PENALTY_PER_MISS}点` },
  { title: `${TIME_LIMIT}秒で終了`, body: 'スコアと称号が決まる' },
];

/** スタート画面（X 風ダーク。バトル画面と同じ見た目） */
export function StartPage() {
  return (
    <XPhone>
      <div className="flex grow flex-col overflow-y-auto px-6 pt-12 pb-[calc(24px+env(safe-area-inset-bottom))]">
        {/* ロゴとゲーム名 */}
        <div className="flex flex-col items-center text-center">
          <span className="grid size-16 place-items-center rounded-full bg-x-pink text-white shadow-[0_0_32px_rgba(249,24,128,0.45)]" aria-hidden="true">
            <IceIcon size={34} />
          </span>
          <h1 className="mt-5 text-[40px] leading-tight font-extrabold tracking-tight">{GAME_TITLE}</h1>
          <p className="mt-2 text-[15px] text-x-sub">
            タイムラインにまぎれた
            <strong className="text-x-pink">冷笑ポスト</strong>
            を見抜け
          </p>
        </div>

        {/* 見本のポスト（飾り） */}
        <div className="mt-8 rounded-2xl border border-x-line px-4 py-3" aria-hidden="true">
          <div className="flex gap-2.5">
            <span className="grid size-10 shrink-0 place-items-center rounded-full bg-[#7856FF] text-[17px] font-extrabold text-white">O</span>
            <div className="min-w-0 grow">
              <div className="flex min-w-0 items-baseline gap-1">
                <span className="truncate font-extrabold">observer</span>
                <span className="truncate text-x-sub">@observer_xx ・ 3分</span>
              </div>
              <p className="mt-0.5 leading-relaxed">完走おめでとう。まあ「頑張ってる自分」を発信したい気持ちもわかりますよ笑</p>
              <div className="mt-2 flex justify-end">
                <span className="flex min-h-10 items-center rounded-full border border-x-pink bg-x-pink px-4 text-[15px] font-extrabold whitespace-nowrap text-white rotate-[-5deg]">
                  うおっw
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* 遊び方 */}
        <ol className="mt-8 flex flex-col gap-3">
          {STEPS.map((step, i) => (
            <li key={step.title} className="flex items-center gap-3">
              <span className="grid size-8 shrink-0 place-items-center rounded-full border border-x-line text-sm font-extrabold tabular-nums">
                {i + 1}
              </span>
              <span className="min-w-0">
                <span className="block font-extrabold">{step.title}</span>
                <span className="block text-sm text-x-sub">{step.body}</span>
              </span>
            </li>
          ))}
        </ol>

        <div className="grow" />

        <Link
          href="/play"
          className="mt-10 flex min-h-14 items-center justify-center rounded-full bg-x-text text-lg font-extrabold text-[#0f1419] transition-colors hover:bg-[#d7dbdc] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-x-blue"
        >
          ゲームスタート
        </Link>
      </div>
    </XPhone>
  );
}

/** 冷笑ボタンと同じ氷のかけらのアイコン */
function IceIcon({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
      <path d="M12 2v20M4 7l16 10M20 7L4 17M9 3.5L12 6l3-2.5M9 20.5l3-2.5 3 2.5" />
    </svg>
  );
}
