type Mood = 'smug' | 'angry' | 'defeated' | 'unknown';

type Props = { color?: string; mood?: Mood; size?: number };

const INK = '#170E33';

/** 冷笑モンスター（氷のかたまり）。色と表情だけ変えて全種類を描く */
export function MonsterArt({ color = '#BFEFFF', mood = 'smug', size = 150 }: Props) {
  if (mood === 'defeated') {
    return (
      <svg width={size} height={size * 0.66} viewBox="0 0 120 80" aria-hidden="true">
        <path
          d="M10 70 q10 -30 30 -32 q8 -24 30 -16 q22 -6 30 20 q14 6 10 28z"
          fill={color}
          stroke={INK}
          strokeWidth="4"
          strokeLinejoin="round"
        />
        <path d="M44 46 l8 8 M52 46 l-8 8 M70 46 l8 8 M78 46 l-8 8" stroke={INK} strokeWidth="3.5" strokeLinecap="round" />
        <path d="M54 64 q8 -5 16 0" fill="none" stroke={INK} strokeWidth="3.5" strokeLinecap="round" />
      </svg>
    );
  }

  const body = mood === 'unknown' ? '#4A3A86' : color;

  return (
    <svg width={size} height={size} viewBox="0 0 100 100" aria-hidden="true">
      <ellipse cx="50" cy="95" rx="34" ry="5" fill={INK} opacity="0.4" />
      <rect x="12" y="14" width="76" height="74" rx="16" fill={body} stroke={INK} strokeWidth="4" />
      {mood === 'unknown' ? (
        <text x="50" y="64" textAnchor="middle" fontSize="36" fontWeight="800" fill="#C8BDF0">?</text>
      ) : (
        <>
          <rect x="20" y="22" width="18" height="7" rx="3.5" fill="#FFFFFF" opacity="0.85" />
          {mood === 'smug' ? (
            <>
              {/* 半目＋口角だけ上げる「ふっ…」の顔 */}
              <path d="M28 50 q7 -6 14 0 M58 50 q7 -6 14 0" fill="none" stroke={INK} strokeWidth="4" strokeLinecap="round" />
              <path d="M28 48 h14 M58 48 h14" stroke={INK} strokeWidth="3" strokeLinecap="round" />
              <path d="M40 68 q12 5 22 -5" fill="none" stroke={INK} strokeWidth="4" strokeLinecap="round" />
              <circle cx="24" cy="62" r="4" fill="#FF9BC0" />
              <circle cx="76" cy="62" r="4" fill="#FF9BC0" />
            </>
          ) : (
            <>
              {/* 弱点を突かれて焦る顔 */}
              <path d="M28 46 l12 5 M72 46 l-12 5" stroke={INK} strokeWidth="4" strokeLinecap="round" />
              <circle cx="35" cy="57" r="3.5" fill={INK} />
              <circle cx="65" cy="57" r="3.5" fill={INK} />
              <path d="M38 72 q12 -8 24 0" fill="none" stroke={INK} strokeWidth="4" strokeLinecap="round" />
              <path d="M80 30 q6 8 0 14 q-6 -6 0 -14z" fill="#46D2FF" stroke={INK} strokeWidth="2" />
            </>
          )}
        </>
      )}
    </svg>
  );
}
