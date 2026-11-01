import type { JudgeResponse, PublicQuestion, Rating } from '@/types/game';
import { monsterById } from '../data/monsters';
import { MonsterArt } from './MonsterArt';
import { BIG_BUTTON } from './styles';

const RATING_CLASS: Record<Rating, string> = {
  PERFECT: 'bg-game-pink text-white',
  GREAT: 'bg-game-sky text-game-ink',
  GOOD: 'bg-game-green text-game-ink',
  MISS: 'bg-[#B9C2B4] text-game-ink',
};

// 色と文字の太さは使う側で指定する（styles.ts のコメント参照）
const PILL = 'inline-flex items-center gap-1 rounded-xl border-3 border-game-ink px-2.5 py-1 whitespace-nowrap';
const PILL_TEXT = 'text-[13px] font-extrabold';
const CARD = 'w-full rounded-[20px] border-4 border-game-ink p-4 shadow-[0_6px_0_var(--color-game-ink)]';
const OUTLINE_TEXT = '[text-shadow:4px_4px_0_var(--color-game-ink),-2px_-2px_0_var(--color-game-ink),2px_-2px_0_var(--color-game-ink),-2px_2px_0_var(--color-game-ink)]';

type Props = {
  question: PublicQuestion;
  result: JudgeResponse;
  /** この判定で冷笑ずかんに新しく登録されたモンスター */
  newMonsters: string[];
  isLast: boolean;
  onNext: () => void;
};

/** 撃破・解説画面（判定結果はサーバーから） */
export function JudgeScreen({ question: q, result, newMonsters, isLast, onNext }: Props) {
  const defeated = result.hits.length > 0;
  // 撃破なら当てたモンスター、にげられたら見逃したモンスターを出す
  const shown = result.coldPosts.find((c) => (defeated ? result.hits : result.missed).includes(c.index)) ?? result.coldPosts[0];
  const monster = monsterById(shown?.monsterId ?? '');

  const status = (i: number) => {
    if (result.hits.includes(i)) return { label: '命中', className: 'border-game-pink bg-game-pink/15', badge: 'bg-game-pink text-white' };
    if (result.missed.includes(i)) return { label: '見逃し', className: 'border-dashed border-game-blue-miss', badge: 'bg-game-blue-miss text-white' };
    if (result.wrong.includes(i)) return { label: 'ハズレ', className: 'border-[#e5e2ee] bg-[#e5e2ee] text-[#6a6480]', badge: 'bg-[#6a6480] text-white' };
    return null;
  };

  return (
    <main
      className={`relative mx-auto flex min-h-dvh w-full max-w-[430px] flex-col items-center gap-3.5 overflow-hidden px-4 pt-8 pb-7 font-game-body text-game-ink min-[500px]:min-h-[844px] min-[500px]:rounded-[32px] min-[500px]:border-4 min-[500px]:border-game-ink ${
        defeated
          ? 'bg-game-yellow bg-[repeating-conic-gradient(from_0deg_at_50%_18%,#FFC21A_0deg_10deg,#FFD23F_10deg_20deg)]'
          : 'bg-[#9AA3C7]'
      }`}
    >
      <h1
        className={`animate-pop font-game-display text-6xl motion-reduce:animate-none ${OUTLINE_TEXT} ${defeated ? 'text-game-pink' : 'text-white'}`}
      >
        {defeated ? '撃破！' : 'にげられた…'}
      </h1>

      <div className="flex items-end gap-2.5">
        {defeated ? (
          <MonsterArt color={monster.color} mood="defeated" size={120} />
        ) : (
          <MonsterArt color={monster.color} mood="smug" size={100} />
        )}
        <span className={`${PILL} ${PILL_TEXT} mb-7 bg-white text-game-ink`}>{defeated ? 'とけた…' : 'ふっ、甘いね'}</span>
      </div>

      <div className="flex items-center gap-2.5">
        <span className={`${PILL} font-game-display text-[22px] ${RATING_CLASS[result.rating]}`}>{result.rating}</span>
        <span className={`${PILL} font-game-display text-[22px] bg-white text-game-ink`}>+{result.points}</span>
      </div>

      {/* 答え合わせ：どのポストが冷笑だったか */}
      <section className={`${CARD} flex flex-col gap-2 bg-white`}>
        {q.posts.map((post, i) => {
          const s = status(i);
          return (
            <div key={i} className={`rounded-xl border-3 px-3 py-2 text-[13px] ${s ? s.className : 'border-transparent text-[#6a6480]'}`}>
              <div className="flex items-center gap-2 text-xs font-extrabold">
                <span className="truncate">{post.speaker}</span>
                {s && <span className={`ml-auto shrink-0 rounded-md px-1.5 py-px ${s.badge}`}>{s.label}</span>}
              </div>
              <p className={`mt-0.5 leading-relaxed font-bold ${s?.label === 'ハズレ' ? 'line-through' : ''}`}>{post.text}</p>
            </div>
          );
        })}
      </section>

      {/* 解説＝ずかんカード（冷笑ポストごと） */}
      {result.coldPosts.map((c) => {
        const m = monsterById(c.monsterId);
        const isNew = newMonsters.includes(c.monsterId) && result.hits.includes(c.index);
        return (
          <section key={c.index} className={`${CARD} flex items-start gap-3 bg-game-night text-white`}>
            <div className="flex size-[58px] shrink-0 items-center justify-center rounded-[14px] border-3 border-game-yellow bg-game-night-2 text-center font-game-display text-xs leading-tight text-game-yellow">
              {isNew ? 'NEW' : 'No.'}
              <br />
              {String(m.no).padStart(2, '0')}
            </div>
            <div className="min-w-0">
              <div className="text-xs font-extrabold text-game-yellow">
                {isNew ? '冷笑ずかんに登録！' : 'なぜ冷笑？'} <span className="text-game-lilac">{q.posts[c.index]?.speaker}</span>
              </div>
              <div className="font-game-display text-[17px]">{m.name}</div>
              <p className="mt-1 text-[13px] leading-relaxed text-[#E4DDFF]">{c.explanation}</p>
            </div>
          </section>
        );
      })}

      <div className="grow" />
      <button type="button" className={`${BIG_BUTTON} w-full bg-game-pink text-white [text-shadow:2px_2px_0_var(--color-game-ink)]`} onClick={onNext}>
        {isLast ? 'ステージクリア！' : 'つぎのタイムラインへ ▶'}
      </button>
    </main>
  );
}
