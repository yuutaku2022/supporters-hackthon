'use client';

import { useEffect, useSyncExternalStore } from 'react';

/** 音声ファイルの場所（public/sounds 以下） */
export const BGM = {
  battle: '/sounds/bgm/buoyant-game-loop.mp3',
} as const;

/** 冷笑ボタンがハズレだったときのブザー */
export const MISS_SE = '/sounds/se/buzzer.mp3';

/** 冷笑ボタンが当たりだったときに鳴る SE の候補。ここに足せば設定画面にも並ぶ */
export const PRESS_SES = [
  { id: 'uuo', label: 'ううお', voice: '四国めたん', src: '/sounds/se/uuo.wav' },
  { id: 'uo', label: 'うお', voice: '麒ヶ島宗麟', src: '/sounds/se/uo.wav' },
  { id: 'kusa', label: 'くさ', voice: '白上虎太郎', src: '/sounds/se/kusa.wav' },
  { id: 'kakkee', label: 'かっけえ', voice: '白上虎太郎', src: '/sounds/se/kakkee.wav' },
  { id: 'cho-oma', label: 'ちょ，おま', voice: '麒ヶ島宗麟', src: '/sounds/se/cho-oma.wav' },
  { id: 'kukanannyo', label: 'くかなんよ', voice: '麒ヶ島宗麟', src: '/sounds/se/kukanannyo.wav' },
  { id: 'daruite', label: 'だるいて', voice: '麒ヶ島宗麟', src: '/sounds/se/daruite.wav' },
] as const;

export type PressSeId = (typeof PRESS_SES)[number]['id'];

const ALL_PRESS_SE_IDS: PressSeId[] = PRESS_SES.map((s) => s.id);
const PRESS_SE_KEY = 'reisho-hunter:press-se';

/**
 * 冷笑ボタンで鳴らす SE の設定を読む（このブラウザに保存）。
 * 保存がなければ全部オン。空の配列なら SE なし。
 */
export function loadPressSeIds(): PressSeId[] {
  try {
    const raw = window.localStorage.getItem(PRESS_SE_KEY);
    if (raw === null) return ALL_PRESS_SE_IDS;
    const saved: unknown = JSON.parse(raw);
    if (!Array.isArray(saved)) return ALL_PRESS_SE_IDS;
    return ALL_PRESS_SE_IDS.filter((id) => saved.includes(id));
  } catch {
    return ALL_PRESS_SE_IDS;
  }
}

/** 保存できないブラウザ（プライベートモードなど）用。このページを開いている間だけ覚えておく */
let unsavedIds: PressSeId[] | null = null;
const listeners = new Set<() => void>();

export function savePressSeIds(ids: PressSeId[]) {
  unsavedIds = null;
  try {
    window.localStorage.setItem(PRESS_SE_KEY, JSON.stringify(ids));
  } catch {
    unsavedIds = ids;
  }
  snapshot = null;
  listeners.forEach((l) => l());
}

let snapshot: PressSeId[] | null = null;
const getSnapshot = () => (snapshot ??= unsavedIds ?? loadPressSeIds());
const getServerSnapshot = () => ALL_PRESS_SE_IDS;
const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};

/** 選ばれている SE の id（設定画面で使う）。変えると同じ画面のほかの表示にもすぐ反映される */
export function usePressSeIds() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

/** 設定で選ばれている SE の中からランダムに1つ鳴らす（何も選ばれていなければ鳴らさない） */
export function playRandomPressSe() {
  const ids = unsavedIds ?? loadPressSeIds();
  if (ids.length === 0) return;
  const id = ids[Math.floor(Math.random() * ids.length)];
  playSe(PRESS_SES.find((s) => s.id === id)!.src);
}

/** 冷笑ボタンの SE（当たり・ハズレ）を全部先に読み込む */
export function preloadPressSes() {
  for (const s of PRESS_SES) preloadSe(s.src);
  preloadSe(MISS_SE);
}

const seCache = new Map<string, HTMLAudioElement>();
const activeSes = new Set<HTMLAudioElement>();

/** SE を先に読み込んでおく（初回の再生が遅れないように） */
export function preloadSe(src: string) {
  if (typeof window === 'undefined' || seCache.has(src)) return;
  const audio = new Audio(src);
  audio.preload = 'auto';
  seCache.set(src, audio);
}

/** SE を1回鳴らす。連打しても前の音を切らずに重ねて鳴る */
export function playSe(src: string, volume = 0.8) {
  preloadSe(src);
  const audio = new Audio(src);
  audio.volume = volume;
  const release = () => activeSes.delete(audio);
  activeSes.add(audio);
  audio.addEventListener('ended', release, { once: true });
  audio.addEventListener('error', release, { once: true });
  audio.play().catch((error: unknown) => {
    release();
    console.warn(`効果音を再生できませんでした: ${src}`, error);
  });
}

/**
 * BGM をループ再生する。この hook を使っている画面が表示されている間だけ鳴り、離れると止まる。
 * ブラウザの自動再生制限で再生できなかったときは、最初のタップ／キー入力で鳴らし始める。
 */
export function useBgm(src: string, volume = 0.5) {
  useEffect(() => {
    const audio = new Audio(src);
    audio.loop = true;
    audio.volume = volume;

    const start = () => {
      audio.play().then(removeUnlock, () => {
        /* 自動再生がブロックされた。ユーザー操作を待つ */
      });
    };
    const removeUnlock = () => {
      window.removeEventListener('pointerdown', start);
      window.removeEventListener('keydown', start);
    };
    window.addEventListener('pointerdown', start);
    window.addEventListener('keydown', start);
    start();

    return () => {
      removeUnlock();
      audio.pause();
      audio.src = '';
    };
  }, [src, volume]);
}
