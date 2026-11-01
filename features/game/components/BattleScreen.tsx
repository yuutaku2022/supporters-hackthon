'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import type { CheckResponse, PublicPost, PublicQuestion } from '@/types/game';
import { TIME_LIMIT } from '../rules';
import { PILL, PILL_DANGER, PILL_PRIMARY } from './styles';
import { XPhone } from './XPhone';

type Props = {
  question: PublicQuestion;
  qIndex: number;
  total: number;
  score: number;
  combo: number;
  hints: number;
  /** 「冷笑」を押したポスト1件をサーバーで判定する */
  onCheck: (index: number, found: number[]) => Promise<CheckResponse>;
  /** 問題を終える（全部見つけた or 時間切れ）。まとめて採点はサーバー。採点中は sending=true */
  onFinish: (selected: number[], timeLeft: number) => void;
  sending: boolean;
  /** 採点 API が失敗したときのメッセージ（「もう一度」で再送できる） */
  error: string | null;
  /** ヒントを使う。サーバーから教えてもらった冷笑ポストの番号を返す */
  onHint: (selected: number[]) => Promise<number | null>;
};

type Mark = 'hit' | 'miss';

/** 全部見つけてから判定画面に移るまでの間（「撃破！」を見せる） */
const FINISH_DELAY_MS = 700;

/**
 * バトル画面（X のタイムライン風）
 * ポストが数件並ぶ。冷笑していると思うポストのアクションバー右端の「冷笑」を押すと、その場で当たり／ハズレが出る。
 * 冷笑ポストを全部見つけるか時間切れで、この問題は終わり。
 * 問題が変わるたびに key を変えて作り直す前提（状態・タイマーをリセットするため）。
 */
export function BattleScreen({ question: q, qIndex, total, score, combo, hints, onCheck, onFinish, sending, error, onHint }: Props) {
  const [marks, setMarks] = useState<Record<number, Mark>>({});
  const [checking, setChecking] = useState<number | null>(null);
  const [checkError, setCheckError] = useState<string | null>(null);
  const [cleared, setCleared] = useState(false);
  const [timeLeft, setTimeLeft] = useState(TIME_LIMIT);
  const [hinted, setHinted] = useState<number | null>(null);
  const [hintBusy, setHintBusy] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const done = useRef(false);

  const pressed = Object.keys(marks).map(Number);
  const hitCount = pressed.filter((i) => marks[i] === 'hit').length;
  const missCount = pressed.length - hitCount;
  const busy = sending || cleared || timeLeft === 0;

  const finish = (sel: number[], t: number) => {
    if (done.current) return;
    done.current = true;
    onFinish(sel, t);
  };
  const retryFinish = () => {
    done.current = false;
    finish(pressed, timeLeft);
  };

  // タイマー。全部見つけた後・採点待ち・メニューを開いている間は止める
  useEffect(() => {
    if (sending || cleared || menuOpen) return;
    const id = window.setInterval(() => setTimeLeft((t) => Math.max(0, t - 1)), 1000);
    return () => window.clearInterval(id);
  }, [sending, cleared, menuOpen]);
  // 0秒になったら、それまでに押したポストで採点
  useEffect(() => {
    if (timeLeft === 0) finish(pressed, 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeLeft]);

  const press = async (i: number) => {
    if (marks[i] || checking !== null || busy) return;
    setChecking(i);
    setCheckError(null);
    try {
      const found = pressed.filter((x) => marks[x] === 'hit');
      const r = await onCheck(i, found);
      const next = { ...marks, [i]: r.cold ? 'hit' : 'miss' } as Record<number, Mark>;
      setMarks(next);
      if (r.cold && r.remaining === 0) {
        setCleared(true);
        const t = timeLeft;
        window.setTimeout(() => finish(Object.keys(next).map(Number), t), FINISH_DELAY_MS);
      }
    } catch {
      setCheckError('判定できませんでした。もう一度押してください');
    } finally {
      setChecking(null);
    }
  };

  const hint = async () => {
    if (hints <= 0 || hinted !== null || hintBusy) return;
    setHintBusy(true);
    try {
      setHinted(await onHint(pressed));
    } catch {
      /* ヒントが取れなくてもバトルは続ける */
    } finally {
      setHintBusy(false);
    }
  };

  const danger = timeLeft <= 10;

  return (
    <XPhone>
      {/* ヘッダー：画面名・バトル数・スコア／残り時間 */}
      <header className="relative flex items-center gap-4 border-b border-x-line bg-black/85 px-4 pt-2.5 pb-3 backdrop-blur-md">
        <div className="flex min-w-0 grow flex-col">
          <strong className="text-xl font-extrabold">ホーム</strong>
          <span className="truncate text-[13px] text-x-sub">
            {qIndex + 1}/{total} ・ {score.toLocaleString()}pt
          </span>
        </div>
        <span
          className={`min-w-9 rounded-full border px-2 py-0.5 text-center font-extrabold tabular-nums ${
            danger ? 'border-x-danger text-x-danger' : 'border-x-line'
          }`}
          aria-label={`残り${timeLeft}秒`}
        >
          {timeLeft}
        </span>
        <div className="absolute inset-x-0 -bottom-px h-[3px]" aria-hidden="true">
          <div
            className={`h-full transition-[width] duration-1000 ease-linear ${danger ? 'bg-x-danger' : 'bg-x-blue'}`}
            style={{ width: `${(timeLeft / TIME_LIMIT) * 100}%` }}
          />
        </div>
      </header>

      <div className="grow overflow-y-auto">
        <p className="flex items-center justify-center gap-2 border-b border-x-line px-4 py-2.5 text-center text-sm text-x-sub">
          <span>
            <strong className="text-x-pink">冷笑しているポスト</strong>を全部見つけよう
          </span>
          {combo >= 2 && (
            <span className="animate-rise rounded-full bg-x-blue px-2 py-px text-xs font-extrabold whitespace-nowrap text-white motion-reduce:animate-none">
              COMBO ×{combo}
            </span>
          )}
        </p>

        {q.posts.map((post, i) => (
          <Post
            key={i}
            post={post}
            seed={`${q.id}-${i}`}
            minutesAgo={(i + 1) * 7}
            mark={marks[i]}
            checking={checking === i}
            hinted={hinted === i && !marks[i]}
            disabled={busy || checking !== null}
            onPress={() => press(i)}
          />
        ))}

        {cleared && (
          <p className="animate-rise px-4 py-4 text-center text-lg font-extrabold text-x-pink motion-reduce:animate-none">
            冷笑モンスターを全部見つけた！
          </p>
        )}
        {(checkError || error) && (
          <div className="mx-4 my-3 rounded-lg border border-x-danger px-3 py-2 text-sm text-x-danger" role="alert">
            <p>{error ? `採点できませんでした（${error}）` : checkError}</p>
            {error && (
              <button type="button" className={`${PILL_PRIMARY} mt-2`} onClick={retryFinish} disabled={sending}>
                もう一度
              </button>
            )}
          </div>
        )}
      </div>

      {/* 下部：操作バー */}
      <footer className="flex items-center gap-3 border-t border-x-line bg-x-bg px-4 pt-2.5 pb-[calc(10px+env(safe-area-inset-bottom))]">
        <button type="button" className={PILL} onClick={hint} disabled={hints <= 0 || hinted !== null || hintBusy || busy}>
          ヒント ×{hints}
        </button>
        <span className="ml-auto text-sm text-x-sub tabular-nums" aria-live="polite">
          {sending ? (
            '採点中…'
          ) : (
            <>
              <span className="text-x-pink">命中 {hitCount}</span> ・ ハズレ {missCount}
            </>
          )}
        </span>
        <button
          type="button"
          className="grid size-9 shrink-0 cursor-pointer place-items-center rounded-full text-x-text hover:bg-x-text/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-x-blue"
          onClick={() => setMenuOpen(true)}
          aria-label="メニュー（一時停止）"
          aria-haspopup="dialog"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
            <path d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </footer>

      {menuOpen && <PauseMenu onClose={() => setMenuOpen(false)} />}
    </XPhone>
  );
}

type PostProps = {
  post: PublicPost;
  seed: string;
  minutesAgo: number;
  mark: Mark | undefined;
  checking: boolean;
  hinted: boolean;
  disabled: boolean;
  onPress: () => void;
};

/** タイムラインのポスト1件。アクションバーの右端が「冷笑」ボタン（押すとその場で判定、取り消しはできない） */
function Post({ post, seed, minutesAgo, mark, checking, hinted, disabled, onPress }: PostProps) {
  const name = displayName(post.speaker);
  const stats = fakeStats(seed);
  return (
    <article
      className={`flex gap-2.5 border-b border-x-line px-4 py-3 transition-colors ${
        mark === 'hit' ? 'bg-x-pink/10 shadow-[inset_3px_0_0_var(--color-x-pink)]' : mark === 'miss' ? 'opacity-50' : ''
      } ${hinted ?'animate-x-hint shadow-[inset_3px_0_0_var(--color-x-blue)] motion-reduce:animate-none motion-reduce:bg-x-blue/35' : ''}`}
    >
      <Avatar seed={post.speaker} letter={name} />
      <div className="min-w-0 grow">
        <div className="flex min-w-0 items-baseline gap-1">
          <span className="truncate font-extrabold">{name}</span>
          <span className="truncate text-x-sub">
            {post.speaker} ・ {minutesAgo}分
          </span>
          {hinted && (
            <span className="ml-auto shrink-0 rounded-full bg-x-blue px-2 py-px text-xs font-extrabold text-white">あやしい</span>
          )}
        </div>
        <p className="mt-0.5 leading-relaxed wrap-anywhere whitespace-pre-wrap">{post.text}</p>

        {/* 返信・リポスト・いいね・表示数（飾り）＋ 冷笑ボタン */}
        <div className="mt-2 flex items-center justify-between text-[13px] text-x-sub">
          <Stat icon={ICONS.reply} value={stats.replies} />
          <Stat icon={ICONS.repost} value={stats.reposts} />
          <Stat icon={ICONS.like} value={stats.likes} />
          <Stat icon={ICONS.views} value={stats.views} />
          {mark ? (
            <span
              className={`flex min-h-8 items-center gap-1 rounded-full border px-2.5 text-[13px] font-extrabold ${
                mark === 'hit'
                  ? 'animate-pop border-x-pink bg-x-pink text-white motion-reduce:animate-none'
                  : 'animate-shake border-x-line bg-x-line text-x-text motion-reduce:animate-none'
              }`}
              role="status"
            >
              {mark === 'hit' ? '撃破！' : 'ハズレ'}
            </span>
          ) : (
            <button
              type="button"
              aria-label="冷笑だと思う"
              disabled={disabled}
              onClick={onPress}
              className="flex min-h-8 cursor-pointer items-center gap-1 rounded-full border border-x-line bg-transparent px-2.5 text-[13px] font-extrabold text-x-sub transition-colors hover:enabled:border-x-pink hover:enabled:text-x-pink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-x-blue disabled:cursor-not-allowed"
            >
              <IceIcon />
              {checking ? '…' : '冷笑'}
            </button>
          )}
        </div>
      </div>
    </article>
  );
}

/** 一時停止メニュー（開いている間はタイマーが止まる） */
function PauseMenu({ onClose }: { onClose: () => void }) {
  return (
    <div
      className="absolute inset-0 z-10 flex items-end bg-[rgba(91,112,131,0.4)]"
      role="dialog"
      aria-modal="true"
      aria-label="一時停止"
      onClick={onClose}
      onKeyDown={(e) => e.key === 'Escape' && onClose()}
    >
      <div className="w-full rounded-t-2xl bg-x-bg px-4 pt-4 pb-[calc(16px+env(safe-area-inset-bottom))]" onClick={(e) => e.stopPropagation()}>
        <p className="mb-3 text-center text-lg font-extrabold">一時停止中</p>
        <div className="flex flex-col gap-2.5">
          <button type="button" className={`${PILL_PRIMARY} min-h-11`} onClick={onClose} autoFocus>
            バトルにもどる
          </button>
          <Link href="/settings" className={`${PILL} flex min-h-11 items-center justify-center`}>
            設定
          </Link>
          <Link href="/" className={`${PILL_DANGER} flex min-h-11 items-center justify-center`}>
            バトルをやめる
          </Link>
        </div>
        <p className="mt-3 text-center text-xs text-x-sub">設定・やめるを選ぶと、このバトルの進行は消えます</p>
      </div>
    </div>
  );
}

/** '@run_daily' → 'run daily' */
const displayName = (handle: string) => handle.replace(/^@/, '').replace(/[_.]/g, ' ');

/** シードから毎回同じ数字を作る（返信数・いいね数などの飾り） */
function fakeStats(seed: string) {
  let h = 0;
  for (const c of seed) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  const pick = (min: number, max: number) => {
    h = (h * 1103515245 + 12345) >>> 0;
    return min + (h % (max - min));
  };
  return {
    replies: compact(pick(0, 60)),
    reposts: compact(pick(0, 300)),
    likes: compact(pick(5, 3000)),
    views: compact(pick(300, 60000)),
  };
}

function compact(n: number) {
  return n >= 10000 ? `${(n / 10000).toFixed(1).replace(/\.0$/, '')}万` : n.toLocaleString();
}

const AVATAR_COLORS = ['#1D9BF0', '#F91880', '#00BA7C', '#7856FF', '#FF7A00', '#FFD400'];

function Avatar({ seed, letter }: { seed: string; letter: string }) {
  let h = 0;
  for (const c of seed) h += c.charCodeAt(0);
  return (
    <div
      className="grid size-10 shrink-0 place-items-center overflow-hidden rounded-full text-[17px] font-extrabold text-white"
      style={{ background: AVATAR_COLORS[h % AVATAR_COLORS.length] }}
      aria-hidden="true"
    >
      {letter.trim().charAt(0).toUpperCase()}
    </div>
  );
}


const ICONS = {
  reply: 'M4 12a8 8 0 018-8h1a7 7 0 010 14H9l-5 3v-4.5A8 8 0 014 12z',
  repost: 'M7 4L4 7l3 3M4 7h11a4 4 0 014 4v1M17 20l3-3-3-3M20 17H9a4 4 0 01-4-4v-1',
  like: 'M12 20s-7-4.6-7-10a4 4 0 017-2.6A4 4 0 0119 10c0 5.4-7 10-7 10z',
  views: 'M5 20V12M10 20V6M15 20v-9M20 20V9',
};

/** アイコン＋数字（飾り） */
function Stat({ icon, value }: { icon: string; value: string }) {
  return (
    <span className="flex items-center gap-1" aria-hidden="true">
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d={icon} />
      </svg>
      {value}
    </span>
  );
}

/** 冷笑ボタンのアイコン（氷のかけら） */
function IceIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
      <path d="M12 2v20M4 7l16 10M20 7L4 17M9 3.5L12 6l3-2.5M9 20.5l3-2.5 3 2.5" />
    </svg>
  );
}
