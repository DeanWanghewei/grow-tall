'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';

const TABS = [
  { href: '/home', icon: '🏠', label: '首页' },
  { href: '/curves', icon: '📈', label: '曲线' },
  { href: '/album', icon: '🖼', label: '相册' },
  { href: '/settings', icon: '⚙', label: '我的' },
];

export function AppShell({
  children,
  onRecord,
}: {
  children: React.ReactNode;
  onRecord: () => void;
}) {
  const path = usePathname();
  return (
    <div className="min-h-[100dvh]" style={{ background: 'var(--bg)' }}>
      <main
        style={{
          paddingTop: 'var(--safe-top)',
          // 给固定的底部导航栏 + 凸起按钮留出空间,避免末尾内容被遮挡
          paddingBottom: 'calc(var(--safe-bottom) + 96px)',
        }}
      >
        {children}
      </main>
      <nav
        className="fixed bottom-0 left-0 right-0 grid grid-cols-[1fr_1fr_72px_1fr_1fr] items-end"
        style={{
          // 毛玻璃 + 光影感
          background: 'rgba(255,255,255,.82)',
          backdropFilter: 'blur(14px)',
          WebkitBackdropFilter: 'blur(14px)',
          borderTop: '1px solid rgba(255,138,61,.18)',
          boxShadow: '0 -6px 22px rgba(120,70,30,.12)',
          paddingBottom: 'var(--safe-bottom)',
          zIndex: 40,
        }}
      >
        {TABS.slice(0, 2).map((t) => (
          <Tab key={t.href} {...t} active={path.startsWith(t.href)} />
        ))}
        <div />
        {TABS.slice(2).map((t) => (
          <Tab key={t.href} {...t} active={path.startsWith(t.href)} />
        ))}
        <motion.button
          aria-label="记一笔"
          onClick={onRecord}
          className="absolute left-1/2 flex h-16 w-16 flex-col items-center justify-center rounded-full border-[3px] border-white text-white"
          style={{
            // 用 framer 的 x 而非 Tailwind 的 -translate-x-1/2,避免被 animate 的 transform 覆盖导致不居中
            x: '-50%',
            bottom: 'calc(var(--safe-bottom) + 20px)',
            zIndex: 50,
            background: 'linear-gradient(135deg, var(--primary-2), var(--primary))',
            // 软发光阴影,不再用硬偏移「圆盘」(去掉多余圆环)
            boxShadow: '0 8px 18px rgba(255,106,41,.45)',
          }}
          animate={{ rotate: [-4, 4, -4] }}
          transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
        >
          <span className="text-2xl leading-none">🦒</span>
          <span className="text-[7px] font-extrabold">记一笔</span>
        </motion.button>
      </nav>
    </div>
  );
}

function Tab({ href, icon, label, active }: { href: string; icon: string; label: string; active: boolean }) {
  return (
    <Link
      href={href}
      className="flex flex-col items-center gap-0.5 py-2.5 text-[9px] font-extrabold"
      style={{ color: active ? 'var(--primary)' : '#B9A48C' }}
    >
      <span className="text-xl leading-none" style={{ filter: active ? 'drop-shadow(0 2px 3px rgba(255,138,61,.35))' : 'none' }}>
        {icon}
      </span>
      {label}
    </Link>
  );
}
