import type { Metadata } from 'next';
import { BackButton } from '@/components/common/BackButton';
import { XPhone } from '@/app/play/XPhone';
import { SeSettings } from '@/components/common/SeSettings';

export const metadata: Metadata = { title: '設定 | 冷笑ハンター' };

/** 設定画面 */
export default function SettingsPage() {
  return (
    <div className="flex flex-1 flex-col bg-[#120a2a] min-[500px]:py-6">
      <XPhone>
        <header className="flex items-center gap-4 border-b border-x-line px-4 pt-2.5 pb-3">
          <BackButton className="text-x-text hover:bg-x-text/10" />
          <strong className="text-xl font-extrabold">設定</strong>
        </header>
        <div className="grow overflow-y-auto p-4">
          <SeSettings />
        </div>
      </XPhone>
    </div>
  );
}
