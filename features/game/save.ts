/**
 * 進行データの保存（ブラウザごと。失敗しても遊べるように try/catch）
 */
export type SaveData = {
  /** 登録済みモンスターID */
  zukan: string[];
  exp: number;
};

const KEY = 'reisho-hunter-save-v1';
const EMPTY: SaveData = { zukan: [], exp: 0 };

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
