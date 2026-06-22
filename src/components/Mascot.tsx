// 主题化吉祥物。Phase 1:三套主题统一用长颈鹿 SVG;Phase 3 替换 chick/unicorn 造型。
export function Mascot({ size = 96, className }: { size?: number; className?: string }) {
  return (
    <svg
      viewBox="0 0 120 200"
      width={size}
      height={(size * 200) / 120}
      className={className}
      aria-hidden
    >
      <rect x="36" y="150" width="9" height="42" rx="4" fill="#E89A4A" />
      <rect x="52" y="150" width="9" height="42" rx="4" fill="#F4B06B" />
      <rect x="80" y="150" width="9" height="42" rx="4" fill="#E89A4A" />
      <rect x="96" y="150" width="9" height="42" rx="4" fill="#F4B06B" />
      <ellipse cx="70" cy="148" rx="36" ry="22" fill="#F4B06B" />
      <path d="M72 150 Q60 92 66 42 L82 44 Q86 96 88 150 Z" fill="#F4B06B" />
      <ellipse cx="74" cy="36" rx="21" ry="15" fill="#F4B06B" />
      <ellipse cx="90" cy="43" rx="11" ry="9" fill="#F8C68A" />
      <rect x="62" y="13" width="4" height="13" rx="2" fill="#F4B06B" />
      <circle cx="64" cy="12" r="4" fill="#7A4A1E" />
      <rect x="74" y="11" width="4" height="14" rx="2" fill="#F4B06B" />
      <circle cx="76" cy="10" r="4" fill="#7A4A1E" />
      <ellipse cx="58" cy="30" rx="5" ry="8" fill="#E89A4A" transform="rotate(-25 58 30)" />
      <circle cx="76" cy="32" r="3.2" fill="#3a2a1a" />
      <circle cx="77" cy="31" r="1.1" fill="#fff" />
      <path d="M85 49 Q90 52 95 49" stroke="#7A4A1E" strokeWidth="1.5" fill="none" strokeLinecap="round" />
      <ellipse cx="66" cy="68" rx="5" ry="4" fill="#D9822F" />
      <ellipse cx="64" cy="92" rx="6" ry="4.5" fill="#D9822F" />
      <ellipse cx="80" cy="112" rx="7" ry="5" fill="#D9822F" />
    </svg>
  );
}
