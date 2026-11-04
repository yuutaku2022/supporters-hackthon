import { StartPage } from '@/features/start-page/start-page';

/** スタート画面：/ */
export default function HomePage() {
  return (
    <div className="flex flex-1 flex-col bg-[#120a2a] [-webkit-tap-highlight-color:transparent] min-[500px]:py-6">
      <StartPage />
    </div>
  );
}
