'use client';

import { useEffect, useSyncExternalStore } from 'react';

/** 音声ファイルの場所（public/sounds 以下） */
export const BGM = {
  battle: '/sounds/bgm/buoyant-game-loop.mp3',
} as const;

/** 冷笑ボタンがハズレだったときのブザー */
export const MISS_SE = '/sounds/se/buzzer.mp3';
export const RESULT_TYPING_SE = '/sounds/se/character-forwarding.mp3';
export const TITLE_REVEAL_SE = '/sounds/se/rhythm-heaven-fever-ok-jingle-loud.mp3';

/** 冷笑ボタンが当たりだったときに鳴る SE の候補。ここに足せば設定画面にも並ぶ */
export const PRESS_SES = [
  { id: 'cho-oma', label: 'ちょ，おまｗ', voice: '麒ヶ島宗麟', src: '/sounds/se/麒ヶ島宗麟_ちょおま.wav' },
  { id: 'uo', label: 'うおｗｗｗ', voice: '玄野武宏', src: '/sounds/se/玄野武宏_うお.wav' },
  { id: 'kusa', label: 'くさ', voice: '四国めたん', src: '/sounds/se/四国めたん_くさ.wav' },
  { id: 'kakkee', label: 'かっけぇｗｗｗ', voice: '白上虎太郎', src: '/sounds/se/白上虎太郎_かっけぇ.wav' },
  { id: 'kukanannyo', label: 'くかなんよｗ', voice: '黒沢冴白', src: '/sounds/se/黒沢冴白_くかなんよ.wav' },
  { id: 'daruite', label: 'だるいてｗｗｗ', voice: '麒ヶ島宗麟', src: '/sounds/se/麒ヶ島宗麟_だるいてぇ.wav' },
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
export function playRandomPressSe(): string | null {
  const ids = unsavedIds ?? loadPressSeIds();
  if (ids.length === 0) return null;
  const id = ids[Math.floor(Math.random() * ids.length)];
  const src = PRESS_SES.find((s) => s.id === id)!.src;
  playSe(src);
  return src;
}

type ActiveSource = {
  source: AudioBufferSourceNode;
  gain: GainNode;
};

const decodedBuffers = new Map<string, AudioBuffer>();
const bufferLoads = new Map<string, Promise<AudioBuffer | null>>();
const activeSources = new Set<ActiveSource>();
const MAX_ACTIVE_SOURCES = 6;
let audioContext: AudioContext | null = null;
let resumeTask: Promise<void> | null = null;
let pendingPlayback: { buffer: AudioBuffer; volume: number } | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined' || !window.AudioContext) return null;
  audioContext ??= new window.AudioContext();
  return audioContext;
}

/** AudioContextをユーザー操作中に作成・再開し、iOSの再生制限を解除する */
export function unlockAudio() {
  void resumeAudioContext(true);
}

function resumeAudioContext(fromUserGesture = false): Promise<void> {
  const context = getAudioContext();
  if (!context || context.state === 'running') return Promise.resolve();
  if (resumeTask && !fromUserGesture) return resumeTask;

  const task = context.resume()
    .then(() => {
      if (context.state === 'running' && pendingPlayback) {
        const pending = pendingPlayback;
        pendingPlayback = null;
        startBuffer(pending.buffer, pending.volume);
      }
    })
    .catch((error: unknown) => {
      pendingPlayback = null;
      console.warn('効果音用の AudioContext を再開できませんでした', error);
    })
    .finally(() => {
      if (resumeTask === task) resumeTask = null;
    });
  resumeTask = task;
  return task;
}

/** 音声を取得・デコードしてキャッシュする。クリック時には未読込音声を待たない */
export function preloadSe(src: string): Promise<AudioBuffer | null> {
  const cached = decodedBuffers.get(src);
  if (cached) return Promise.resolve(cached);
  const existing = bufferLoads.get(src);
  if (existing) return existing;

  const context = getAudioContext();
  if (!context) {
    console.warn(`Web Audio API を利用できません。効果音を準備できませんでした: ${src}`);
    return Promise.resolve(null);
  }

  const load = fetch(src)
    .then((response) => {
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return response.arrayBuffer();
    })
    .then((data) => context.decodeAudioData(data))
    .then((buffer) => {
      decodedBuffers.set(src, buffer);
      return buffer;
    })
    .catch((error: unknown) => {
      bufferLoads.delete(src);
      console.warn(`効果音を取得またはデコードできませんでした: ${src}`, error);
      return null;
    });
  bufferLoads.set(src, load);
  return load;
}

/** ゲーム内で選択中のSEとリザルト演出用SEを、ゲーム開始前に取得・デコードする */
export async function preloadGameSounds() {
  const selectedIds = loadPressSeIds();
  const selectedSources = PRESS_SES
    .filter((sound) => selectedIds.includes(sound.id))
    .map((sound) => sound.src);
  await Promise.all([
    ...selectedSources,
    MISS_SE,
    RESULT_TYPING_SE,
    TITLE_REVEAL_SE,
  ].map(preloadSe));
}

/** 冷笑ボタンのSEを取得・デコードする */
export async function preloadPressSes() {
  const selectedIds = loadPressSeIds();
  const selectedSources = PRESS_SES
    .filter((sound) => selectedIds.includes(sound.id))
    .map((sound) => sound.src);
  await Promise.all([MISS_SE, ...selectedSources].map(preloadSe));
}

/** 設定画面の試聴ボタンで使う全SEを取得・デコードする */
export async function preloadAllPressSes() {
  await Promise.all([MISS_SE, ...PRESS_SES.map((sound) => sound.src)].map(preloadSe));
}

/** 事前デコード済みのSEを、再生ごとの独立ノードですぐ鳴らす */
export function playSe(src: string, volume = 0.8) {
  const buffer = decodedBuffers.get(src);
  if (!buffer) {
    void preloadSe(src);
    return;
  }

  const context = getAudioContext();
  if (!context) return;
  if (context.state !== 'running') {
    pendingPlayback = { buffer, volume };
    void resumeAudioContext();
    return;
  }
  startBuffer(buffer, volume);
}

function startBuffer(buffer: AudioBuffer, volume: number) {
  const context = audioContext;
  if (!context || context.state !== 'running') return;

  if (activeSources.size >= MAX_ACTIVE_SOURCES) {
    const oldest = activeSources.values().next().value;
    if (oldest) stopSource(oldest);
  }

  const source = context.createBufferSource();
  const gain = context.createGain();
  source.buffer = buffer;
  gain.gain.value = volume;
  source.connect(gain);
  gain.connect(context.destination);
  const active = { source, gain };
  activeSources.add(active);
  source.addEventListener('ended', () => {
    activeSources.delete(active);
    source.disconnect();
    gain.disconnect();
  }, { once: true });
  source.start();
}

/** 再生中の効果音を止める（ゲーム終了・画面遷移時） */
export function stopAllSe() {
  pendingPlayback = null;
  for (const active of activeSources) stopSource(active);
}

function stopSource(active: ActiveSource) {
  active.gain.gain.setTargetAtTime(0, audioContext!.currentTime, 0.005);
  active.source.stop(audioContext!.currentTime + 0.02);
  activeSources.delete(active);
}

if (typeof document !== 'undefined') {
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && audioContext?.state === 'suspended') {
      void resumeAudioContext();
    }
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
