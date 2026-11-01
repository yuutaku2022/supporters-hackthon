import type { Metadata } from 'next';
import { BackButton } from '@/components/common/BackButton';
import { XPhone } from '@/features/game/components/XPhone';

export const metadata: Metadata = { title: '設定 | 冷笑ハンター' };

/** 設定画面（仮。中身は未定） */
export default function SettingsPage() {
  return (
    <div className="flex flex-1 flex-col bg-[#120a2a] min-[500px]:py-6">
      <XPhone>
        <header className="flex items-center gap-4 border-b border-x-line px-4 pt-2.5 pb-3">
          <BackButton className="text-x-text hover:bg-x-text/10" />
          <strong className="text-xl font-extrabold">設定</strong>
        </header>
        <p className="grow p-6 text-center text-sm text-x-sub">設定画面は準備中です</p>
      </XPhone>
    </div>
  );
}
