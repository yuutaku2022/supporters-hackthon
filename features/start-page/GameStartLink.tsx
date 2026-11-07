'use client';

import Link from 'next/link';
import type { ReactNode } from 'react';
import { preloadGameSounds, unlockAudio } from '@/lib/sound';

export function GameStartLink({
  children,
  className,
}: {
  children: ReactNode;
  className: string;
}) {
  return (
    <Link
      href="/play"
      className={className}
      onClick={() => {
        unlockAudio();
        void preloadGameSounds();
      }}
    >
      {children}
    </Link>
  );
}
