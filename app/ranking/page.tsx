import type { Metadata } from "next";
import { RankingPage } from "@/features/ranking-page/ranking-page";

export const metadata: Metadata = { title: "ランキング | ちょっ，おまw" };

export default function RankingRoute() {
  return (
    <div className="flex min-h-dvh flex-1 flex-col bg-[#120a2a] [-webkit-tap-highlight-color:transparent] min-[500px]:py-6">
      <RankingPage />
    </div>
  );
}
