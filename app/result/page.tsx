import { Suspense } from "react";
import type { Metadata } from "next";
import { ResultPage } from "@/features/result-page/result-page";

export const metadata: Metadata = { title: "ゲーム結果 | 冷笑ハンター" };

type ResultRouteProps = {
  searchParams: Promise<{ score?: string | string[] }>;
};

export default function ResultRoute({ searchParams }: ResultRouteProps) {
  return (
    <Suspense
      fallback={
        <main className="mx-auto flex min-h-dvh w-full max-w-[430px] items-center justify-center bg-[#101014] text-white">
          <p role="status">結果を読み込み中...</p>
        </main>
      }
    >
      <ResultContent searchParams={searchParams} />
    </Suspense>
  );
}

async function ResultContent({ searchParams }: ResultRouteProps) {
  const scoreParam = (await searchParams).score;
  const scoreString = Array.isArray(scoreParam) ? scoreParam[0] : scoreParam;
  const parsedScore =
    typeof scoreString === "string" && /^\d+$/.test(scoreString)
      ? Number(scoreString)
      : 0;
  const score = Number.isSafeInteger(parsedScore) ? parsedScore : 0;

  return <ResultPage score={score} />;
}
