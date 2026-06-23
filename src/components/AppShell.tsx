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
        className="fixed bottom-0 left-0 right-0 grid grid-cols-[1fr_1fr_72px_1fr_1fr] items-end bg-white"
        style={{
          borderTop: '3px dashed #FFE3CC',
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
          className="absolute left-1/2 w-14 h-14 rounded-full border-[3px] border-white flex flex-col items-center justify-center text-white"
          style={{
            // 用 framer 的 x 而非 Tailwind 的 -translate-x-1/2,避免被 animate 的 transform 覆盖导致不居中
            x: '-50%',
            bottom: 'calc(var(--safe-bottom) + 16px)',
            zIndex: 50,
            background: 'linear-gradient(135deg, var(--primary-2), var(--primary))',
            boxShadow:
              '0 6px 0 color-mix(in srgb, var(--primary) 70%, black), 0 12px 18px rgba(0,0,0,.2)',
          }}
          animate={{ rotate: [-4, 4, -4] }}
          transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
        >
          <span className="text-xl leading-none">🦒</span>
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
      className="flex flex-col items-center gap-px text-[8px] font-extrabold py-2"
      style={{ color: active ? 'var(--primary)' : '#CBB299' }}
    >
      <span className="text-base leading-none">{icon}</span>
      {label}
    </Link>
  );
}
