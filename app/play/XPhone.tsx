import type { ReactNode } from 'react';

/** X 風画面の外枠（スマホ縦。PC では中央に1台分表示） */
export function XPhone({ children }: { children: ReactNode }) {
  return (
    <main className="relative mx-auto flex h-dvh w-full max-w-[430px] flex-col overflow-hidden bg-x-bg font-[-apple-system,BlinkMacSystemFont,'Segoe_UI','Hiragino_Sans','Noto_Sans_JP','Meiryo',sans-serif] text-[15px] text-x-text min-[500px]:h-[844px] min-[500px]:rounded-[32px] min-[500px]:border min-[500px]:border-x-line">
      {children}
    </main>
  );
}
