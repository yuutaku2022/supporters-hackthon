"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { AchievementDefinition } from "@/DB/achievement";
import {
  playSe,
  preloadSe,
  RESULT_TYPING_SE,
  TITLE_REVEAL_SE,
} from "@/lib/sound";

const question = "＠ちょっ，おまw. スコアと称号を教えて";
const answerPrefix = "あなたのスコアは ";
const answerMiddle = " 点でした。\n獲得称号は「";
const answerSuffix = "」です。";
const titleRevealDelay = 700;

type ConversationProps = {
  onReplay: () => void;
  score: number;
  achievement: AchievementDefinition | null;
};

function GrokMark({ className = "" }: { className?: string }) {
  return (
    <span
      className={`grid size-9 shrink-0 place-items-center rounded-full bg-white text-black ${className}`}
      aria-hidden="true"
    >
      <svg viewBox="0 0 24 24" className="size-5" fill="none">
        <path
          d="M5 5l14 14M19 5 5 19"
          stroke="currentColor"
          strokeWidth="2.8"
          strokeLinecap="round"
        />
      </svg>
    </span>
  );
}

function XLogo({ className = "size-4" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

type RankingDialogProps = {
  score: number;
  resultId: string;
  onClose: () => void;
  onRegistered: () => void;
};

function RankingDialog({
  score,
  resultId,
  onClose,
  onRegistered,
}: RankingDialogProps) {
  const [name, setName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName || submitting) return;

    setSubmitting(true);
    setError(null);
    try {
      const response = await fetch("/api/rankings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: trimmedName, score, resultId }),
      });
      const body = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(
          typeof body?.error === "string"
            ? body.error
            : "ランキングに登録できませんでした。",
        );
      }
      onRegistered();
    } catch (e) {
      setError(e instanceof Error ? e.message : "通信に失敗しました。");
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-5"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="ranking-dialog-title"
        className="w-full max-w-[390px] rounded-2xl border border-white/15 bg-[#1b1b20] p-5 shadow-2xl"
      >
        <div className="flex items-center justify-between">
          <h2 id="ranking-dialog-title" className="text-lg font-bold">
            ランキングに登録
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="閉じる"
            className="grid size-9 place-items-center rounded-full text-white/70 hover:bg-white/10 hover:text-white"
          >
            <span aria-hidden="true">×</span>
          </button>
        </div>
        <p className="mt-2 text-sm text-white/70">
          スコア {score.toLocaleString("ja-JP")} 点で登録します。
        </p>
        <form onSubmit={submit} className="mt-5">
          <label htmlFor="ranking-name" className="text-sm font-semibold">
            名前
          </label>
          <input
            id="ranking-name"
            autoFocus
            required
            maxLength={20}
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="ランキングに表示する名前"
            className="mt-2 min-h-12 w-full rounded-xl border border-white/20 bg-black/30 px-3 text-white outline-none placeholder:text-white/40 focus:border-[#1d9bf0]"
          />
          {error && (
            <p role="alert" className="mt-2 text-sm text-[#ff6b78]">
              {error}
            </p>
          )}
          <button
            type="submit"
            disabled={submitting || !name.trim()}
            className="mt-5 flex min-h-12 w-full items-center justify-center rounded-full bg-[#1d9bf0] font-bold text-white transition-colors hover:bg-[#1685cf] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting ? "登録中..." : "登録する"}
          </button>
        </form>
      </section>
    </div>
  );
}

function Conversation({
  onReplay,
  score,
  achievement,
  resultId,
}: ConversationProps & { resultId: string }) {
  const answerScore = score.toLocaleString("ja-JP");
  const titleText = achievement?.title ?? "なし";
  const hasAchievement = achievement !== null;
  const answer = `${answerPrefix}${answerScore}${answerMiddle}${titleText}${answerSuffix}`;
  const [typedQuestion, setTypedQuestion] = useState("");
  const [typedAnswer, setTypedAnswer] = useState("");
  const [stage, setStage] = useState<
    "typing-question" | "thinking" | "typing-answer" | "revealing-title" | "done"
  >("typing-question");
  const [isRankingDialogOpen, setIsRankingDialogOpen] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);

  useEffect(() => {
    let timer: number;
    let questionIndex = 0;
    let answerIndex = 0;
    let lastTypingSoundAt = -Infinity;
    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    const typingDelay = reducedMotion ? 0 : 42;
    const pauseDelay = reducedMotion ? 0 : 500;
    const playTypingSound = (character: string) => {
      const now = performance.now();
      if (
        !reducedMotion &&
        !/\s/.test(character) &&
        now - lastTypingSoundAt >= 160
      ) {
        playSe(RESULT_TYPING_SE, 0.18);
        lastTypingSoundAt = now;
      }
    };

    const typeAnswer = () => {
      answerIndex += 1;
      setTypedAnswer(answer.slice(0, answerIndex));
      playTypingSound(answer[answerIndex - 1]);

      if (answerIndex < answer.length) {
        timer = window.setTimeout(typeAnswer, typingDelay);
      } else if (hasAchievement) {
        setStage("revealing-title");
        timer = window.setTimeout(() => {
          playSe(TITLE_REVEAL_SE, 1);
          setStage("done");
        }, titleRevealDelay);
      } else {
        setStage("done");
      }
    };

    const startAnswer = () => {
      setStage("typing-answer");
      typeAnswer();
    };

    const startThinking = () => {
      setStage("thinking");
      timer = window.setTimeout(startAnswer, pauseDelay);
    };

    const typeQuestion = () => {
      questionIndex += 1;
      setTypedQuestion(question.slice(0, questionIndex));
      playTypingSound(question[questionIndex - 1]);

      if (questionIndex < question.length) {
        timer = window.setTimeout(typeQuestion, typingDelay);
      } else {
        timer = window.setTimeout(startThinking, pauseDelay);
      }
    };

    let cancelled = false;
    void Promise.all([preloadSe(RESULT_TYPING_SE), preloadSe(TITLE_REVEAL_SE)]).then(() => {
      if (!cancelled) timer = window.setTimeout(typeQuestion, reducedMotion ? 0 : 400);
    });

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [answer, hasAchievement]);

  const scoreEnd = answerPrefix.length + answerScore.length;
  const titleStart = scoreEnd + answerMiddle.length;
  const titleEnd = titleStart + titleText.length;
  const visiblePrefix = typedAnswer.slice(0, answerPrefix.length);
  const visibleScore = typedAnswer.slice(answerPrefix.length, scoreEnd);
  const visibleMiddle = typedAnswer.slice(scoreEnd, titleStart);
  const visibleTitle = typedAnswer.slice(titleStart, titleEnd);
  const visibleSuffix = typedAnswer.slice(titleEnd);

  const handleShareToX = () => {
    const shareText = `【ちょっ，おまw】\nスコア：${answerScore}点\n獲得称号：「${titleText}」\n#ちょっ，おまw`;
    const shareUrl = `${window.location.origin}/`;
    const intentUrl = new URL("https://x.com/intent/post");
    intentUrl.searchParams.set("text", shareText);
    intentUrl.searchParams.set("url", shareUrl);
    window.open(intentUrl.toString(), "_blank", "noopener,noreferrer");
  };

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-[440px] flex-col border-x border-white/10 bg-[#101014] pt-[env(safe-area-inset-top)] text-white">
      <header className="flex h-16 shrink-0 items-center justify-between border-b border-white/10 px-5">
        <div className="flex items-center gap-3">
          <GrokMark />
          <span className="text-[17px] font-semibold tracking-tight">Grok</span>
        </div>
        <button
          className="grid size-10 place-items-center rounded-full text-white/70 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white motion-reduce:transition-none"
          type="button"
          aria-label="会話をもう一度再生"
          onClick={onReplay}
        >
          <svg
            viewBox="0 0 24 24"
            className="size-5"
            fill="none"
            aria-hidden="true"
          >
            <path
              d="M20 11a8 8 0 0 0-14.9-3M4 4v4h4m-4 5a8 8 0 0 0 14.9 3M20 20v-4h-4"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </header>

      <section
        className="flex flex-1 flex-col gap-8 px-5 py-8"
        aria-label="Grokとのチャット結果"
        aria-live="polite"
      >
        <div className="flex justify-end">
          <div className="max-w-[85%] rounded-[24px] rounded-br-md bg-[#27272d] px-4 py-3 text-[15px] leading-7 text-white">
            {typedQuestion}
            {stage === "typing-question" && (
              <span className="ml-0.5 inline-block h-5 w-0.5 translate-y-1 animate-pulse bg-white motion-reduce:animate-none" />
            )}
          </div>
        </div>

        {(stage === "thinking" ||
          stage === "typing-answer" ||
          stage === "revealing-title" ||
          stage === "done") && (
          <div className="flex items-start gap-3">
            <GrokMark className="size-8" />
            <div className="min-w-0 flex-1 pt-1">
              {stage === "thinking" ? (
                <div className="flex h-8 items-center gap-1.5" aria-label="回答を考え中">
                  <span className="size-1.5 animate-bounce rounded-full bg-white/70 [animation-delay:-0.2s] motion-reduce:animate-none" />
                  <span className="size-1.5 animate-bounce rounded-full bg-white/70 [animation-delay:-0.1s] motion-reduce:animate-none" />
                  <span className="size-1.5 animate-bounce rounded-full bg-white/70 motion-reduce:animate-none" />
                </div>
              ) : (
                <>
                <p className="m-0 whitespace-pre-wrap text-[16px] leading-8 text-white/90">
                  {visiblePrefix}
                  {visibleScore && (
                    <strong className="font-semibold text-white">
                      {visibleScore}
                    </strong>
                  )}
                  {visibleMiddle}
                  {visibleTitle && (
                    <strong className="font-bold text-[#1d9bf0]">
                      {visibleTitle}
                    </strong>
                  )}
                  {visibleSuffix}
                  {stage === "typing-answer" && (
                    <span className="ml-0.5 inline-block h-5 w-0.5 translate-y-1 animate-pulse bg-white motion-reduce:animate-none" />
                  )}
                </p>
                </>
              )}
            </div>
          </div>
        )}
        {stage === "done" && achievement && (
          <div
            className="mx-auto w-full max-w-[360px] animate-title-reveal rounded-2xl border border-white/15 bg-white/5 px-4 py-3.5 motion-reduce:animate-none"
            aria-label="獲得した称号"
          >
            <span className="text-[11px] font-bold tracking-wider text-white/50 uppercase">獲得称号（実績）</span>
            <p className="mt-1 text-lg font-extrabold text-white">「{achievement.title}」</p>
            <p className="mt-1 text-xs leading-relaxed text-white/70">{achievement.description}</p>
          </div>
        )}
      </section>

      <footer className="flex shrink-0 flex-col gap-3 border-t border-white/10 px-5 pt-4 pb-[calc(1rem+env(safe-area-inset-bottom))]">
        <button
          type="button"
          onClick={() => setIsRankingDialogOpen(true)}
          disabled={isRegistered}
          className="flex min-h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-full border border-[#1d9bf0] text-sm font-bold text-[#1d9bf0] transition-colors hover:bg-[#1d9bf0]/10 disabled:cursor-default disabled:border-white/20 disabled:text-white/60"
        >
          <svg
            viewBox="0 0 24 24"
            className="size-4"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="m3 7 5 3 4-6 4 6 5-3-2 12H5L3 7Z" />
            <path d="M7 15h10" />
          </svg>
          <span>{isRegistered ? "ランキング登録済み" : "ランキングに登録"}</span>
        </button>
        <button
          type="button"
          onClick={handleShareToX}
          className="flex min-h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-full bg-white text-sm font-bold text-black transition-colors hover:bg-white/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white motion-reduce:transition-none"
        >
          <XLogo className="size-4" />
          <span>結果をポストする</span>
        </button>
        <Link
          className="flex min-h-12 w-full items-center justify-center rounded-full border border-white/20 text-sm font-semibold text-white/90 transition-colors hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white motion-reduce:transition-none"
          href="/"
        >
          スタート画面に戻る
        </Link>
      </footer>
      {isRankingDialogOpen && (
        <RankingDialog
          score={score}
          resultId={resultId}
          onClose={() => setIsRankingDialogOpen(false)}
          onRegistered={() => {
            setIsRegistered(true);
            setIsRankingDialogOpen(false);
          }}
        />
      )}
    </main>
  );
}

export function ResultPage({
  score,
  achievement,
  resultId,
}: {
  score: number;
  achievement: AchievementDefinition | null;
  resultId: string;
}) {
  const [conversationKey, setConversationKey] = useState(0);

  return (
    <Conversation
      key={`${resultId}-${score}-${achievement?.id ?? "none"}-${conversationKey}`}
      onReplay={() => setConversationKey((key) => key + 1)}
      score={score}
      achievement={achievement}
      resultId={resultId}
    />
  );
}
