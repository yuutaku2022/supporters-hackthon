'use client';

import { useRouter } from 'next/navigation';

/** 前の画面にもどる「←」ボタン（履歴がなければ fallback へ） */
export function BackButton({ label = 'もどる', fallback = '/', className = '' }: { label?: string; fallback?: string; className?: string }) {
  const router = useRouter();
  return (
    <button
      type="button"
      className={`grid size-9 cursor-pointer place-items-center rounded-full ${className}`}
      aria-label={label}
      onClick={() => (window.history.length > 1 ? router.back() : router.push(fallback))}
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true">
        <path d="M19 12H5M11 6l-6 6 6 6" />
      </svg>
    </button>
  );
}
