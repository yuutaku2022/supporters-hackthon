import type { Metadata } from 'next';
import { Dela_Gothic_One, M_PLUS_Rounded_1c } from 'next/font/google';

// 日本語の字形は Google Fonts 側で分割配信されるので preload はしない
const delaGothic = Dela_Gothic_One({ weight: '400', subsets: ['latin'], variable: '--font-dela-gothic', preload: false });
const mplusRounded = M_PLUS_Rounded_1c({
  weight: ['400', '800'],
  subsets: ['latin'],
  variable: '--font-mplus-rounded',
  preload: false,
});

export const metadata: Metadata = {
  title: '冷笑ハンター',
  description: '冷笑モンスターの弱点（冷笑しているフレーズ）を見つけてたおすゲーム',
};

export default function PlayLayout({ children }: LayoutProps<'/play'>) {
  return (
    <div className={`${delaGothic.variable} ${mplusRounded.variable} flex flex-1 flex-col bg-[#120a2a] [-webkit-tap-highlight-color:transparent] min-[500px]:py-6`}>
      {children}
    </div>
  );
}
