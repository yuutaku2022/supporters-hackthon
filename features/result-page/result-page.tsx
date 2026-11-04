"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const question = "@Grok スコアを教えて";
const answerPrefix = "あなたのスコアは ";
const answerSuffix = " 点でした。";

type ConversationProps = {
  onReplay: () => void;
  score: number;
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

function Conversation({ onReplay, score }: ConversationProps) {
  const answerScore = score.toLocaleString("ja-JP");
  const answer = `${answerPrefix}${answerScore}${answerSuffix}`;
  const [typedQuestion, setTypedQuestion] = useState("");
  const [typedAnswer, setTypedAnswer] = useState("");
  const [stage, setStage] = useState<
    "typing-question" | "thinking" | "typing-answer" | "done"
  >("typing-question");

  useEffect(() => {
    let timer: number;
    let questionIndex = 0;
    let answerIndex = 0;
    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    const typingDelay = reducedMotion ? 0 : 42;
    const pauseDelay = reducedMotion ? 0 : 500;

    const typeAnswer = () => {
      answerIndex += 1;
      setTypedAnswer(answer.slice(0, answerIndex));

      if (answerIndex < answer.length) {
        timer = window.setTimeout(typeAnswer, typingDelay);
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

      if (questionIndex < question.length) {
        timer = window.setTimeout(typeQuestion, typingDelay);
      } else {
        timer = window.setTimeout(startThinking, pauseDelay);
      }
    };

    timer = window.setTimeout(typeQuestion, reducedMotion ? 0 : 400);

    return () => window.clearTimeout(timer);
  }, [answer]);

  const visiblePrefix = typedAnswer.slice(0, answerPrefix.length);
  const visibleScore = typedAnswer.slice(
    answerPrefix.length,
    answerPrefix.length + answerScore.length,
  );
  const visibleSuffix = typedAnswer.slice(answerPrefix.length + answerScore.length);

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-[430px] flex-col border-x border-white/10 bg-[#101014] text-white">
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
                <p className="m-0 text-[16px] leading-8 text-white/90">
                  {visiblePrefix}
                  {visibleScore && (
                    <strong className="font-semibold text-white">
                      {visibleScore}
                    </strong>
                  )}
                  {visibleSuffix}
                  {stage === "typing-answer" && (
                    <span className="ml-0.5 inline-block h-5 w-0.5 translate-y-1 animate-pulse bg-white motion-reduce:animate-none" />
                  )}
                </p>
              )}
            </div>
          </div>
        )}
      </section>

      <footer className="shrink-0 border-t border-white/10 px-5 pt-4 pb-[calc(1rem+env(safe-area-inset-bottom))]">
        <Link
          className="flex min-h-12 w-full items-center justify-center rounded-full border border-white/20 text-sm font-semibold text-white/90 transition-colors hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white motion-reduce:transition-none"
          href="/"
        >
          スタート画面に戻る
        </Link>
      </footer>
    </main>
  );
}

export function ResultPage({ score }: { score: number }) {
  const [conversationKey, setConversationKey] = useState(0);

  return (
    <Conversation
      key={conversationKey}
      onReplay={() => setConversationKey((key) => key + 1)}
      score={score}
    />
  );
}
