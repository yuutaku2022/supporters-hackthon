import Link from 'next/link';
import { XPhone } from '@/app/play/XPhone';

/** 背景に流す「冷笑っぽい言葉」。HIT は当たりのスタンプとして混ぜる */
const HIT = 'うおっw';
const WORD_ROWS = [
  ['知らんけど', 'まあ好みは人それぞれ', HIT, '楽しそうで何より', 'ある意味すごい'],
  ['微笑ましいですね w', '頑張ってる自分笑', '並ぶほどかは…', HIT, '黒歴史になるやつ'],
  ['それで何か変わるの？', HIT, '初期から聴いてる身からすると', 'うらやましい（棒）', 'へぇ〜'],
];

/** スタート画面（X 風ダーク。冷笑ワードが流れる帯・大きなコピー・ピンクのスタートボタン） */
export function StartPage() {
  return (
    <XPhone>
      <div className="flex grow flex-col px-7 pt-8 pb-[calc(24px+env(safe-area-inset-bottom))]">
        {/* ゲーム名（最後の w だけピンク） */}
        <p className="text-xl font-extrabold tracking-tight">
          ちょっ，おま<span className="text-x-pink">w</span>
        </p>

        {/* 冷笑ワードのタグが3段で横に流れる帯（画面の端から端まで） */}
        <div className="pointer-events-none -mx-7 mt-6 flex flex-col gap-3 opacity-40 select-none" aria-hidden="true">
          {WORD_ROWS.map((row, i) => (
            <div key={i} className="overflow-hidden">
              <div
                className="flex w-max start-marquee gap-3 motion-reduce:animate-none"
                style={{ animationDuration: `${36 + i * 8}s`, animationDirection: i % 2 ? 'reverse' : 'normal' }}
              >
                {[...row, ...row].map((word, j) => (
                  <span
                    key={j}
                    className={`rounded-full border px-3 py-1 text-sm font-extrabold whitespace-nowrap ${
                      word === HIT ? 'rotate-[-5deg] border-x-pink bg-x-pink text-white' : 'border-x-line text-x-sub'
                    }`}
                  >
                    {word}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="min-h-6 grow" />

        <h1 className="text-[46px] leading-[1.15] font-extrabold tracking-tight">
          その一言、
          <br />
          <span className="bg-linear-to-r from-[#9be7ff] to-x-blue bg-clip-text text-transparent">冷えて</span>ない？
        </h1>
        <p className="mt-4 text-[16px] leading-relaxed text-x-sub">
          タイムラインにまぎれた<strong className="text-x-text">冷笑投稿</strong>を見つけて、押して、見抜こう。
        </p>

        <div className="grow" />

        <Link
          href="/play"
          className="mt-8 flex min-h-14 items-center justify-center gap-2 rounded-full bg-x-pink text-lg font-extrabold text-white shadow-[0_8px_24px_rgba(249,24,128,0.35)] transition-colors hover:bg-[#d9156f] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-x-blue"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
            <path d="M12 2v20M4 7l16 10M20 7L4 17M9 3.5L12 6l3-2.5M9 20.5l3-2.5 3 2.5" />
          </svg>
          ゲームスタート
        </Link>
        <Link
          href="/settings"
          className="mt-3 flex min-h-14 items-center justify-center gap-2 rounded-full border border-[#536471] text-lg font-extrabold text-x-text transition-colors hover:bg-x-text/10 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-x-blue"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
          </svg>
          設定
        </Link>
        <p className="mt-5 text-center text-xs leading-relaxed text-x-sub">
          投稿はすべて架空のものです。実在の人物・団体とは関係ありません。
        </p>
      </div>
    </XPhone>
  );
}
