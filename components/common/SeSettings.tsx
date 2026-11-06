'use client';

import { PILL } from '@/app/play/styles';
import { playSe, PRESS_SES, savePressSeIds, usePressSeIds, type PressSeId } from '@/lib/sound';

/**
 * 冷笑ボタンが当たりだったときの SE を選ぶ設定パーツ。設定画面で使う。
 * 選んだ SE の中からランダムに1つ鳴る（ハズレは常にブザー）。選んだ内容はこのブラウザに保存される。
 */
export function SeSettings() {
  const selected = usePressSeIds();

  const toggle = (id: PressSeId) =>
    savePressSeIds(selected.includes(id) ? selected.filter((x) => x !== id) : [...selected, id]);

  return (
    <section aria-labelledby="se-settings-title">
      <h2 id="se-settings-title" className="font-extrabold">
        冷笑ボタンの効果音
      </h2>
      <p className="mt-0.5 text-[13px] text-x-sub">
        当たりのとき、選んだ音の中からランダムで鳴ります。ハズレはブザーです
      </p>

      <ul className="mt-2 divide-y divide-x-line rounded-2xl border border-x-line">
        {PRESS_SES.map((se) => (
          <li key={se.id} className="flex items-center gap-3 px-3 py-1.5">
            <label className="flex min-h-10 grow cursor-pointer items-center gap-3">
              <input
                type="checkbox"
                className="size-5 shrink-0 cursor-pointer accent-x-pink"
                checked={selected.includes(se.id)}
                onChange={() => toggle(se.id)}
              />
              <span className="min-w-0 font-bold">{se.label}</span>
            </label>
            <button
              type="button"
              className={`${PILL} min-h-8 shrink-0 px-3 text-[13px]`}
              onClick={() => playSe(se.src)}
              aria-label={`${se.label}を試しに鳴らす`}
            >
              ▶
            </button>
          </li>
        ))}
      </ul>

      {selected.length === 0 && (
        <p className="mt-2 text-[13px] text-x-danger" role="status">
          何も選ばれていないので、当たりのときの効果音は鳴りません
        </p>
      )}

      <div className="mt-3 flex gap-2">
        <button type="button" className={`${PILL} grow text-sm`} onClick={() => savePressSeIds(PRESS_SES.map((s) => s.id))}>
          全部えらぶ
        </button>
        <button type="button" className={`${PILL} grow text-sm`} onClick={() => savePressSeIds([])}>
          全部はずす
        </button>
      </div>
    </section>
  );
}
