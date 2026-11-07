"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { XPhone } from "@/app/play/XPhone";
import type { RankingEntry } from "@/server/repositories/rankings";

export function RankingPage() {
  const [rankings, setRankings] = useState<RankingEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const requestRankings = useCallback(async (signal?: AbortSignal) => {
    try {
      const response = await fetch("/api/rankings", { signal });
      const body = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(
          typeof body?.error === "string"
            ? body.error
            : "ランキングを読み込めませんでした。",
        );
      }
      if (!Array.isArray(body?.rankings)) {
        throw new Error("ランキングのデータ形式が不正です。");
      }
      return body.rankings as RankingEntry[];
    } catch (cause) {
      if (cause instanceof Error && cause.name === "AbortError") throw cause;
      throw cause instanceof Error
        ? cause
        : new Error("ランキングを読み込めませんでした。");
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    void requestRankings(controller.signal)
      .then(setRankings)
      .catch((cause: unknown) => {
        if (cause instanceof Error && cause.name === "AbortError") return;
        setError(
          cause instanceof Error
            ? cause.message
            : "ランキングを読み込めませんでした。",
        );
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [requestRankings]);

  const retry = () => {
    setLoading(true);
    setError(null);
    void requestRankings()
      .then(setRankings)
      .catch((cause: unknown) => {
        setError(
          cause instanceof Error
            ? cause.message
            : "ランキングを読み込めませんでした。",
        );
      })
      .finally(() => setLoading(false));
  };

  return (
    <XPhone>
      <header className="flex h-16 shrink-0 items-center justify-between border-b border-x-line px-5">
        <Link
          href="/"
          aria-label="スタート画面に戻る"
          className="grid size-10 place-items-center rounded-full text-x-text hover:bg-x-text/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-x-blue"
        >
          <svg
            viewBox="0 0 24 24"
            className="size-5"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="m15 18-6-6 6-6M9 12h12" />
          </svg>
        </Link>
        <h1 className="text-lg font-extrabold">ランキング</h1>
        <span className="size-10" aria-hidden="true" />
      </header>

      <section
        aria-label="ランキング一覧"
        className="flex min-h-0 grow flex-col px-5 pb-[calc(20px+env(safe-area-inset-bottom))]"
      >
        <p className="py-5 text-sm text-x-sub">スコア上位100名</p>
        {loading ? (
          <p role="status" className="py-8 text-center text-x-sub">
            ランキングを読み込み中...
          </p>
        ) : error ? (
          <div className="py-8 text-center">
            <p role="alert" className="text-sm text-x-danger">
              {error}
            </p>
            <button
              type="button"
              onClick={retry}
              className="mt-4 rounded-full border border-x-line px-5 py-2 text-sm font-bold"
            >
              再読み込み
            </button>
          </div>
        ) : rankings.length === 0 ? (
          <p className="py-8 text-center text-sm text-x-sub">
            まだランキングの登録はありません。
            <br />
            ゲームをプレイして最初の記録を登録しよう！
          </p>
        ) : (
          <ol className="min-h-0 divide-y divide-x-line overflow-y-auto">
            {rankings.map((entry, index) => (
              <li
                key={entry.id}
                className="flex min-h-16 items-center gap-3 py-3"
              >
                <span
                  className={`grid size-8 shrink-0 place-items-center rounded-full text-sm font-extrabold ${
                    index < 3
                      ? "bg-x-pink text-white"
                      : "bg-white/10 text-x-sub"
                  }`}
                  aria-label={`${index + 1}位`}
                >
                  {index + 1}
                </span>
                <span className="min-w-0 grow truncate font-semibold">
                  {entry.name}
                </span>
                <span className="shrink-0 text-sm font-bold tabular-nums">
                  {entry.score.toLocaleString("ja-JP")}
                  <span className="ml-1 text-xs font-normal text-x-sub">
                    点
                  </span>
                </span>
              </li>
            ))}
          </ol>
        )}
      </section>
    </XPhone>
  );
}
