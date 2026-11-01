/**
 * 進行データの保存（ブラウザごと。失敗しても遊べるように try/catch）
 * キーはプロトタイプと同じなので、プロトタイプで遊んだデータもそのまま読める。
 */
export type SaveData = {
  /** ステージID → 獲得した星の最大数 */
  stars: Record<number, number>;
  /** 登録済みモンスターID */
  zukan: string[];
  exp: number;
};

const KEY = 'reisho-hunter-save-v1';
const EMPTY: SaveData = { stars: {}, zukan: [], exp: 0 };

export function loadSave(): SaveData {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? { ...EMPTY, ...JSON.parse(raw) } : EMPTY;
  } catch {
    return EMPTY;
  }
}

export function writeSave(data: SaveData) {
  try {
    localStorage.setItem(KEY, JSON.stringify(data));
  } catch {
    /* 保存できない環境では何もしない */
  }
}
