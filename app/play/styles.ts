// Tailwind は同じ種類のクラス（bg-* どうしなど）を重ねると CSS の出力順で勝ち負けが決まるので、
// 色は基本クラスに入れず、バリエーションごとに1つだけ指定する。

const PILL_BASE =
  'min-h-9 cursor-pointer rounded-full border px-4 font-extrabold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-x-blue disabled:cursor-not-allowed disabled:opacity-50';

/** X 風の丸いボタン（枠線のみ） */
export const PILL = `${PILL_BASE} border-[#536471] bg-transparent text-x-text hover:enabled:bg-x-text/10`;
/** X 風の丸いボタン（白塗り） */
export const PILL_PRIMARY = `${PILL_BASE} border-x-text bg-x-text text-[#0f1419] hover:enabled:bg-[#d7dbdc]`;
/** X 風の丸いボタン（赤字。やめる・削除など） */
export const PILL_DANGER = `${PILL_BASE} border-[#536471] bg-transparent text-x-danger hover:bg-x-danger/10`;
