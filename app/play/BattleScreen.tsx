'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { scoreOf } from '@/features/game/rules';
import { MISS_SE, playRandomPressSe, playSe, preloadPressSes } from '@/lib/sound';
import type { CheckResponse, PublicPost, PublicQuestion } from '@/types/game';
import { PILL_DANGER, PILL_PRIMARY } from './styles';
import { XPhone } from './XPhone';

/** /play で使っている形：1本の長いタイムライン */
type TimelineProps = {
  posts: PublicPost[];
  timeLimit: number;
  hasMore: boolean;
  loadingMore: boolean;
  loadMoreError: string | null;
  onLoadMore: () => void;
  /** 時間切れ。pressed は「冷笑」、notCold は「冷笑じゃない」を押したポスト */
  onFinish: (pressed: string[], notCold: string[]) => void | Promise<void>;
  sending: boolean;
  error: string | null;
};

/**
 * 旧・問題形式（features/game/components/BattleGame.tsx）用。今の画面からは使っていない。
 * hints / onHint は旧コードとの互換のため受け取るだけで、画面にはヒントを出さない。
 */
type QuestionProps = {
  question: PublicQuestion;
  qIndex: number;
  total: number;
  score: number;
  combo: number;
  hints: number;
  timeLimit: number;
  onCheck: (index: number, found: number[]) => Promise<CheckResponse>;
  onFinish: (selected: number[], timeLeft: number) => void | Promise<void>;
  sending: boolean;
  error: string | null;
  onHint: (selected: number[]) => Promise<number | null>;
};

type Props = TimelineProps | QuestionProps;

/** 押したボタン */
type Answer = 'cold' | 'notCold';
/** 判定結果：hit＝冷笑を見抜いた、safe＝冷笑じゃないを当てた、miss＝ハズレ */
type Mark = 'hit' | 'safe' | 'miss';
type DisplayPost = Pick<PublicPost, 'id' | 'speaker' | 'text'> & { cold?: boolean };

/**
 * ゲーム画面（X のタイムライン風）
 * 1本の長いタイムラインをスクロールしながら、投稿ごとに「冷笑」か「冷笑じゃない」を押す。その場で正解／ハズレが出る。
 * 制限時間内にできるだけ多く判定する。時間切れで終わり。
 * ゲームをやり直すときは key を変えて作り直す前提（状態・タイマーをリセットするため）。
 */
export function BattleScreen(props: Props) {
  const questionMode = 'question' in props;
  const posts = questionMode
    ? props.question.posts.map((post, index) => ({ ...post, id: String(index) }))
    : props.posts;
  const timelineProps = 'question' in props ? null : props;
  const hasMore = timelineProps?.hasMore ?? false;
  const loadingMore = timelineProps?.loadingMore ?? false;
  const loadMoreError = timelineProps?.loadMoreError ?? null;
  const onLoadMore = timelineProps?.onLoadMore;
  const { sending, error, timeLimit } = props;
  const [marks, setMarks] = useState<Record<string, Mark>>({});
  const [answers, setAnswers] = useState<Record<string, Answer>>({});
  const [checking, setChecking] = useState<string | null>(null);
  const [checkError, setCheckError] = useState<string | null>(null);
  const [timer, setTimer] = useState(() => ({ limit: timeLimit, remaining: timeLimit }));
  const timeLeft = timer.limit === timeLimit ? timer.remaining : timeLimit;
  const [menuOpen, setMenuOpen] = useState(false);
  const done = useRef(false);
  /** 見抜いた後に「うおっw」を押した回数（押すたびに動きをやり直すために使う） */
  const [hitTaps, setHitTaps] = useState<Record<string, number>>({});
  const timelineRef = useRef<HTMLDivElement>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  const answered = Object.keys(marks);
  /** 「冷笑」を押したポスト（当たり・ハズレとも） */
  const pressed = answered.filter((id) => answers[id] === 'cold');
  /** 「冷笑じゃない」を押したポスト（当たり・ハズレとも） */
  const notCold = answered.filter((id) => answers[id] === 'notCold');
  const hitCount = answered.filter((id) => marks[id] !== 'miss').length;
  const missCount = answered.length - hitCount;
  const timeUp = timeLeft === 0;
  const busy = sending || timeUp;

  const finish = () => {
    if (done.current) return;
    done.current = true;
    if (questionMode) {
      void props.onFinish(pressed.map(Number), timeLeft);
    } else {
      void props.onFinish(pressed, notCold);
    }
  };
  const retryFinish = () => {
    done.current = false;
    finish();
  };

  useEffect(preloadPressSes, []);

  // タイマー。採点待ち・メニューを開いている間は止める
  useEffect(() => {
    if (sending || menuOpen) return;
    const id = window.setInterval(() => {
      setTimer((current) => {
        const remaining = current.limit === timeLimit ? current.remaining : timeLimit;
        return { limit: timeLimit, remaining: Math.max(0, remaining - 1) };
      });
    }, 1000);
    return () => window.clearInterval(id);
  }, [sending, menuOpen, timeLimit]);

  useEffect(() => {
    if (!hasMore || loadingMore || loadMoreError || !onLoadMore) return;
    const root = timelineRef.current;
    const target = loadMoreRef.current;
    if (!root || !target) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) onLoadMore();
      },
      { root, rootMargin: '160px' },
    );
    observer.observe(target);
    return () => observer.disconnect();
  }, [
    posts.length,
    hasMore,
    loadingMore,
    loadMoreError,
    onLoadMore,
  ]);

  // 0秒になったら、それまでに押したポストで採点
  useEffect(() => {
    if (timeUp) finish();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeUp]);

  const press = async (postId: string, answer: Answer = 'cold') => {
    if (marks[postId]) {
      // 見抜いた後の「うおっw」は連打できる：押すたびにランダムな声と「ぽん」の動き（点数は増えない）
      if (marks[postId] === 'hit' && !busy) {
        playRandomPressSe();
        setHitTaps((t) => ({ ...t, [postId]: (t[postId] ?? 0) + 1 }));
      }
      return;
    }
    if (checking !== null || busy) return;
    if (!('question' in props)) {
      const post = props.posts.find((item) => item.id === postId);
      if (post) {
        const correct = answer === 'cold' ? post.cold : !post.cold;
        if (correct && answer === 'cold') {
          playRandomPressSe();
        } else if (!correct) {
          playSe(MISS_SE);
        }
        setAnswers((a) => ({ ...a, [postId]: answer }));
        setMarks((m) => ({ ...m, [postId]: !correct ? 'miss' : answer === 'cold' ? 'hit' : 'safe' }));
      }
      return;
    }

    setChecking(postId);
    setCheckError(null);
    try {
      const cold = (await props.onCheck(Number(postId), pressed.map(Number))).cold;
      if (cold) {
        playRandomPressSe();
      } else {
        playSe(MISS_SE);
      }
      setAnswers((a) => ({ ...a, [postId]: 'cold' }));
      setMarks((m) => ({ ...m, [postId]: cold ? 'hit' : 'miss' }));
    } catch {
      setCheckError('判定できませんでした。もう一度押してください');
    } finally {
      setChecking(null);
    }
  };

  // 家のマーク：タイムラインの一番上へ
  const scrollToTop = () => timelineRef.current?.scrollTo({ top: 0, behavior: 'smooth' });

  const danger = timeLeft <= 10;

  return (
    <XPhone>
      {/* ヘッダー：画面名・スコア・命中/ハズレ／残り時間 */}
      <header className="relative flex items-center gap-4 border-b border-x-line bg-black/85 px-4 pt-2.5 pb-3 backdrop-blur-md">
        <div className="flex min-w-0 grow flex-col">
          <strong className="text-xl font-extrabold">ホーム</strong>
          <span className="truncate text-[13px] text-x-sub tabular-nums" aria-live="polite">
            {(questionMode ? props.score : scoreOf(hitCount, missCount)).toLocaleString()}pt ・{' '}
            <span className="text-x-pink">命中 {hitCount}</span> ・ ハズレ {missCount}
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
            style={{ width: `${timeLimit > 0 ? (timeLeft / timeLimit) * 100 : 0}%` }}
          />
        </div>
      </header>

      <div ref={timelineRef} className="min-h-0 grow overflow-y-auto">
        <p className="border-b border-x-line px-4 py-2.5 text-center text-sm text-x-sub">
          投稿ごとに<strong className="text-x-pink">冷笑</strong>か<strong className="text-x-blue">冷笑じゃない</strong>かを見抜こう
        </p>

        {posts.map((post, i) => (
          <Post
            key={post.id}
            post={post}
            seed={post.id}
            minutesAgo={(i + 1) * 3}
            mark={marks[post.id]}
            taps={hitTaps[post.id] ?? 0}
            checking={checking === post.id}
            disabled={busy || checking !== null}
            canAnswerNotCold={!questionMode}
            onPress={(answer) => press(post.id, answer)}
          />
        ))}

        {(!timelineProps?.hasMore || questionMode) && (
          <p className="px-4 py-6 text-center text-sm text-x-sub">タイムラインはここまで</p>
        )}
        {timelineProps && (
          <div ref={loadMoreRef} className="min-h-12 px-4 py-3 text-center text-sm text-x-sub" aria-live="polite">
            {timelineProps.loadingMore ? (
              <p>投稿を読み込み中…</p>
            ) : timelineProps.loadMoreError ? (
              <div role="alert">
                <p>追加の投稿を読み込めませんでした（{timelineProps.loadMoreError}）</p>
                <button type="button" className={`${PILL_PRIMARY} mt-2`} onClick={timelineProps.onLoadMore}>
                  もう一度読み込む
                </button>
              </div>
            ) : timelineProps.hasMore ? (
              <button
                type="button"
                className={`${PILL_PRIMARY} min-h-10`}
                onClick={timelineProps.onLoadMore}
              >
                続きを読み込む
              </button>
            ) : (
              <p>すべての投稿を読み込みました</p>
            )}
          </div>
        )}
      </div>

      {timeUp && !error && (
        <div
          className="absolute inset-0 z-20 grid place-items-center bg-black/75 px-6 text-center"
          role="status"
          aria-live="polite"
        >
          <div className="flex flex-col items-center gap-4 rounded-3xl border border-x-line bg-x-bg/95 px-8 py-9 shadow-2xl">
            <span
              className="size-12 animate-spin rounded-full border-4 border-x-line border-t-x-pink motion-reduce:animate-none"
              aria-hidden="true"
            />
            <div>
              <p className="text-2xl font-extrabold text-x-pink">集計中…</p>
              <p className="mt-2 text-sm text-x-sub">ゲーム結果をまとめています</p>
            </div>
          </div>
        </div>
      )}

      {(checkError || error) && (
        <div className="border-t border-x-line px-4 py-2.5 text-center text-sm" role="status">
          {error ? (
            <div className="text-x-danger" role="alert">
              <p>採点できませんでした（{error}）</p>
              <button type="button" className={`${PILL_PRIMARY} mt-2`} onClick={retryFinish} disabled={sending}>
                もう一度
              </button>
            </div>
          ) : (
            <p className="text-x-danger" role="alert">{checkError}</p>
          )}
        </div>
      )}

      {/* 下部：操作バー（左：家＝一番上へ ／ 右：一時停止） */}
      <footer className="flex items-center justify-between gap-3 border-t border-x-line bg-x-bg px-4 pt-2.5 pb-[calc(10px+env(safe-area-inset-bottom))]">
        <button type="button" className={ICON_BUTTON} onClick={scrollToTop} aria-label="タイムラインの一番上へ">
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" aria-hidden="true">
            <path d="M3.5 10.5 12 3.5l8.5 7V20a.5.5 0 0 1-.5.5h-5.5v-6h-5v6H4a.5.5 0 0 1-.5-.5z" />
          </svg>
        </button>
        <button
          type="button"
          className={ICON_BUTTON}
          onClick={() => setMenuOpen(true)}
          aria-label="一時停止"
          aria-haspopup="dialog"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <rect x="6" y="4.5" width="4" height="15" rx="1" />
            <rect x="14" y="4.5" width="4" height="15" rx="1" />
          </svg>
        </button>
      </footer>

      {menuOpen && <PauseMenu onClose={() => setMenuOpen(false)} />}
    </XPhone>
  );
}

/** 下のバーの丸いアイコンボタン */
const ICON_BUTTON =
  'grid size-11 shrink-0 cursor-pointer place-items-center rounded-full text-x-text hover:bg-x-text/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-x-blue';

type PostProps = {
  post: DisplayPost;
  seed: string;
  minutesAgo: number;
  mark: Mark | undefined;
  /** 見抜いた後に「うおっw」を押した回数 */
  taps: number;
  checking: boolean;
  disabled: boolean;
  /** 「冷笑じゃない」ボタンを出すか（旧・問題形式では出さない） */
  canAnswerNotCold: boolean;
  onPress: (answer: Answer) => void;
};

/** 判定ボタン・判定結果の共通の形 */
const ANSWER_BASE =
  'flex min-h-12 items-center justify-center gap-1.5 rounded-full border px-4 text-[17px] font-extrabold whitespace-nowrap focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-x-blue';

/** タイムラインのポスト1件。本文の下に「冷笑」「冷笑じゃない」のボタン（押すとその場で判定、取り消しはできない） */
function Post({ post, seed, minutesAgo, mark, taps, checking, disabled, canAnswerNotCold, onPress }: PostProps) {
  const name = displayName(post.speaker);
  const stats = fakeStats(seed);
  return (
    <article
      className={`flex gap-2.5 border-b border-x-line px-4 py-3 transition-colors ${
        mark === 'hit'
          ? 'bg-x-pink/10 shadow-[inset_3px_0_0_var(--color-x-pink)]'
          : mark === 'safe'
            ? 'bg-x-blue/10 shadow-[inset_3px_0_0_var(--color-x-blue)]'
            : mark === 'miss'
              ? 'opacity-50'
              : ''
      }`}
    >
      <Avatar seed={post.speaker} letter={name} />
      <div className="min-w-0 grow">
        <div className="flex min-w-0 items-baseline gap-1">
          <span className="truncate font-extrabold">{name}</span>
          <span className="truncate text-x-sub">
            {post.speaker} ・ {minutesAgo}分
          </span>
        </div>
        <p className="mt-0.5 leading-relaxed wrap-anywhere whitespace-pre-wrap">{post.text}</p>

        {/* 返信・リポスト・いいね・表示数（飾り） */}
        <div className="mt-2 flex max-w-[340px] items-center justify-between text-[13px] text-x-sub">
          <Stat icon={ICONS.reply} value={stats.replies} />
          <Stat icon={ICONS.repost} value={stats.reposts} />
          <Stat icon={ICONS.like} value={stats.likes} />
          <Stat icon={ICONS.views} value={stats.views} />
        </div>

        {/* 判定：「冷笑」「冷笑じゃない」（押した後は結果） */}
        <div className="mt-2.5 flex gap-2">
          {mark === 'hit' ? (
            <button
              type="button"
              aria-label="もう一度「うおっw」（連打できます）"
              disabled={disabled}
              onClick={() => onPress('cold')}
              className={`${ANSWER_BASE} ml-auto cursor-pointer border-x-pink bg-x-pink px-5 text-white select-none animate-pop motion-reduce:animate-none active:scale-95 disabled:cursor-not-allowed`}
            >
              {/* 押すたびに key が変わって「ぽん」の動きがやり直しになる */}
              <span key={taps} className={`inline-block ${taps ? 'hit-bump' : ''}`}>
                うおっw
              </span>
            </button>
          ) : mark === 'safe' ? (
            <span className={`${ANSWER_BASE} ml-auto border-x-blue bg-x-blue px-5 text-white animate-pop motion-reduce:animate-none`} role="status">
              セーフ
            </span>
          ) : mark === 'miss' ? (
            <span className={`${ANSWER_BASE} ml-auto border-x-line bg-x-line px-5 text-x-text animate-shake motion-reduce:animate-none`} role="status">
              ハズレ
            </span>
          ) : (
            <>
              <button
                type="button"
                aria-label="冷笑だと思う"
                disabled={disabled}
                onClick={() => onPress('cold')}
                className={`${ANSWER_BASE} flex-1 cursor-pointer border-x-line bg-transparent text-x-sub transition-colors hover:enabled:border-x-pink hover:enabled:text-x-pink disabled:cursor-not-allowed`}
              >
                <IceIcon />
                {checking ? '…' : '冷笑'}
              </button>
              {canAnswerNotCold && (
                <button
                  type="button"
                  aria-label="冷笑じゃないと思う"
                  disabled={disabled}
                  onClick={() => onPress('notCold')}
                  className={`${ANSWER_BASE} flex-1 cursor-pointer border-x-line bg-transparent text-x-sub transition-colors hover:enabled:border-x-blue hover:enabled:text-x-blue disabled:cursor-not-allowed`}
                >
                  <SunIcon />
                  冷笑じゃない
                </button>
              )}
            </>
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
      <div
        className="max-h-full w-full overflow-y-auto rounded-t-2xl bg-x-bg px-4 pt-4 pb-[calc(16px+env(safe-area-inset-bottom))]"
        onClick={(e) => e.stopPropagation()}
      >
        <p className="mb-3 text-center text-lg font-extrabold">一時停止中</p>
        <div className="flex flex-col gap-2.5">
          <button type="button" className={`${PILL_PRIMARY} min-h-11`} onClick={onClose} autoFocus>
            ゲームにもどる
          </button>
          <Link href="/" className={`${PILL_DANGER} flex min-h-11 items-center justify-center`}>
            ゲームをやめる
          </Link>
        </div>

        <p className="mt-3 text-center text-xs text-x-sub">やめるを選ぶと、このバトルの進行は消えます</p>
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
function Stat({ icon, value, className = '' }: { icon: string; value: string; className?: string }) {
  return (
    <span className={`flex items-center gap-1 whitespace-nowrap ${className}`} aria-hidden="true">
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d={icon} />
      </svg>
      {value}
    </span>
  );
}

/** 冷笑じゃないボタンのアイコン（あたたかい＝太陽） */
function SunIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M5.3 18.7l1.4-1.4M17.3 6.7l1.4-1.4" />
    </svg>
  );
}

/** 冷笑ボタンのアイコン（氷のかけら） */
function IceIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
      <path d="M12 2v20M4 7l16 10M20 7L4 17M9 3.5L12 6l3-2.5M9 20.5l3-2.5 3 2.5" />
    </svg>
  );
}
