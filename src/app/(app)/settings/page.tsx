'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { AppShell } from '@/components/AppShell';
import { useRecordSheet } from '@/components/RecordSheet';
import { useTheme } from '@/lib/useTheme';
import { THEMES, type ThemeId } from '@/lib/themes';

type Child = { id: string; name: string; themeId: string };
const MASCOT_EMOJI: Record<string, string> = { giraffe: '🦒', chick: '🐤', unicorn: '🦄' };

export default function SettingsPage() {
  const { open } = useRecordSheet();
  const router = useRouter();
  const [children, setChildren] = useState<Child[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [storageOn, setStorageOn] = useState<boolean | null>(null);
  const [modal, setModal] = useState<null | 'theme' | 'password'>(null);

  useEffect(() => {
    fetch('/api/children').then((r) => r.json()).then((d) => {
      setChildren(d.children);
      setActiveId(d.children[0]?.id ?? null);
    });
    fetch('/api/storage/status').then((r) => r.json()).then((d) => setStorageOn(d.available));
  }, []);

  const active = children.find((c) => c.id === activeId);
  useTheme(active?.themeId);

  async function addChild() {
    const name = window.prompt('孩子名字');
    if (!name) return;
    const bd = window.prompt('出生日期(YYYY-MM-DD)', '2021-01-01');
    if (!bd) return;
    const g = window.prompt('性别(输入 男 或 女,影响百分位对比)', '男');
    const gender = g === '女' ? 'FEMALE' : g === '男' ? 'MALE' : 'OTHER';
    const res = await fetch('/api/children', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, gender, birthDate: new Date(bd).toISOString() }),
    });
    const d = await res.json();
    if (d.child) {
      setChildren((cs) => [...cs, d.child]);
      setActiveId(d.child.id);
    }
  }

  async function exportData() {
    const all = await Promise.all(
      children.map((c) =>
        fetch(`/api/records?childId=${c.id}`).then((r) => r.json()).then((d) => ({ child: c, records: d.records })),
      ),
    );
    const blob = new Blob([JSON.stringify(all, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'grow-tall-export.json';
    a.click();
    URL.revokeObjectURL(url);
  }

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
    router.refresh();
  }

  const themeName = active ? (THEMES[active.themeId as ThemeId]?.name ?? '默认') : '';

  return (
    <AppShell onRecord={() => activeId && open(activeId)}>
      <div
        className="m-3 flex items-center gap-3 rounded-3xl p-4 text-white"
        style={{ background: 'linear-gradient(135deg,var(--primary-2),var(--primary))', boxShadow: '0 6px 0 color-mix(in srgb,var(--primary) 70%,black)' }}
      >
        <span className="text-4xl">🦒</span>
        <div>
          <div className="text-base font-extrabold">成长日记</div>
          <div className="text-xs opacity-90">{children.length} 个孩子</div>
        </div>
      </div>

      <SectionTitle>家庭成员</SectionTitle>
      <div className="mx-3 flex flex-wrap gap-2">
        {children.map((c) => (
          <button
            key={c.id}
            onClick={() => setActiveId(c.id)}
            className="rounded-full px-3 py-1.5 text-sm font-extrabold"
            style={c.id === activeId ? { background: 'var(--primary)', color: '#fff' } : { background: 'var(--card)', color: 'var(--ink)' }}
          >
            {c.name}
          </button>
        ))}
        <button onClick={addChild} className="rounded-full px-3 py-1.5 text-sm font-extrabold" style={{ background: 'var(--band)', color: 'var(--primary)' }}>
          ＋ 添加
        </button>
      </div>

      <SectionTitle>设置</SectionTitle>
      <div className="mx-3 space-y-2">
        <Row icon="🎨" label="我的主题" value={themeName} onClick={() => setModal('theme')} />
        <Row
          icon="☁️"
          label="图片存储"
          value={
            <span className="rounded-md px-2 py-0.5 text-[10px] font-extrabold" style={storageOn ? { background: '#E2F5EA', color: '#2E8B57' } : { background: 'var(--band)', color: 'var(--primary)' }}>
              {storageOn ? '可用' : '不可用'}
            </span>
          }
        />
        <Row icon="📤" label="导出数据" onClick={exportData} />
        <Row icon="🔒" label="修改访问密码" onClick={() => setModal('password')} />
        <Row icon="🚪" label="登出" onClick={logout} />
      </div>

      <ThemeModal
        open={modal === 'theme'}
        onClose={() => setModal(null)}
        activeTheme={active?.themeId ?? 'warm'}
        onApply={async (id) => {
          if (!activeId) return;
          await fetch(`/api/children/${activeId}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ themeId: id }) });
          setChildren((cs) => cs.map((c) => (c.id === activeId ? { ...c, themeId: id } : c)));
          setModal(null);
        }}
      />
      <PasswordModal open={modal === 'password'} onClose={() => setModal(null)} />
    </AppShell>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <div className="mb-2 mt-4 px-4 text-xs font-extrabold" style={{ color: 'var(--muted)' }}>{children}</div>;
}

function Row({ icon, label, value, onClick }: { icon: string; label: string; value?: React.ReactNode; onClick?: () => void }) {
  const Tag = onClick ? 'button' : 'div';
  return (
    <Tag
      onClick={onClick}
      className="flex w-full items-center gap-3 rounded-2xl bg-white px-4 py-3.5 text-sm font-extrabold"
      style={{ boxShadow: '0 4px 0 rgba(255,138,61,.10)', color: 'var(--ink)' }}
    >
      <span className="text-lg">{icon}</span>
      <span className="flex-1 text-left">{label}</span>
      {value != null && typeof value !== 'string' ? value : <span style={{ color: 'var(--muted)' }}>{value as string}</span>}
      {onClick && <span style={{ color: 'var(--muted)' }}>›</span>}
    </Tag>
  );
}

/** 通用二级弹窗:暖色磨砂遮罩 + 卡片。 */
function Modal({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: React.ReactNode }) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-50 flex items-center justify-center p-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <div className="absolute inset-0" style={{ background: 'rgba(120,80,40,.30)', backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)' }} onClick={onClose} />
          <motion.div
            className="relative w-full max-w-sm rounded-3xl p-5"
            style={{ background: 'var(--bg)', boxShadow: '0 16px 40px rgba(120,70,30,.3)' }}
            initial={{ scale: 0.9, y: 16 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 16 }}
            transition={{ type: 'spring', stiffness: 320, damping: 26 }}
          >
            <h3 className="mb-3 text-center text-base font-extrabold" style={{ color: 'var(--ink)' }}>{title}</h3>
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function ThemeModal({ open, onClose, activeTheme, onApply }: { open: boolean; onClose: () => void; activeTheme: string; onApply: (id: ThemeId) => void }) {
  return (
    <Modal open={open} onClose={onClose} title="🎨 选个主题">
      <div className="grid grid-cols-3 gap-2">
        {(Object.keys(THEMES) as ThemeId[]).map((id) => {
          const t = THEMES[id];
          const selected = activeTheme === id;
          return (
            <button
              key={id}
              onClick={() => onApply(id)}
              className="rounded-2xl p-3 text-center"
              style={{ background: 'var(--card)', border: selected ? '3px solid var(--primary)' : '3px solid transparent', boxShadow: '0 4px 10px rgba(0,0,0,.08)' }}
            >
              <div className="text-2xl">{MASCOT_EMOJI[t.mascot]}</div>
              <div className="mt-1 text-[10px] font-extrabold" style={{ color: 'var(--ink)' }}>{t.name}</div>
              <div className="mx-auto mt-1 h-2 w-8 rounded-full" style={{ background: t.vars['--primary'] }} />
            </button>
          );
        })}
      </div>
      <button onClick={onClose} className="mt-4 w-full rounded-xl py-2.5 text-sm font-extrabold" style={{ background: 'var(--card)', color: 'var(--muted)' }}>
        关闭
      </button>
    </Modal>
  );
}

function PasswordModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [pw, setPw] = useState({ current: '', next: '', confirm: '' });
  const [msg, setMsg] = useState('');

  async function submit() {
    setMsg('');
    if (pw.next !== pw.confirm) {
      setMsg('两次新密码不一致');
      return;
    }
    const r = await fetch('/api/auth/password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ current: pw.current, next: pw.next }),
    });
    const j = await r.json().catch(() => ({}));
    if (r.ok) {
      setMsg('密码已更新 ✓');
      setPw({ current: '', next: '', confirm: '' });
    } else {
      setMsg(j.error ?? '更新失败');
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="🔒 修改访问密码">
      <div className="space-y-2">
        <input type="password" placeholder="当前密码" value={pw.current} onChange={(e) => setPw({ ...pw, current: e.target.value })} className="w-full rounded-xl px-3 py-2.5" style={{ background: 'var(--card)', color: 'var(--ink)' }} />
        <input type="password" placeholder="新密码(至少 4 位)" value={pw.next} onChange={(e) => setPw({ ...pw, next: e.target.value })} className="w-full rounded-xl px-3 py-2.5" style={{ background: 'var(--card)', color: 'var(--ink)' }} />
        <input type="password" placeholder="确认新密码" value={pw.confirm} onChange={(e) => setPw({ ...pw, confirm: e.target.value })} className="w-full rounded-xl px-3 py-2.5" style={{ background: 'var(--card)', color: 'var(--ink)' }} />
        {msg && <p className="text-xs font-bold" style={{ color: msg.includes('✓') ? 'var(--success)' : 'var(--accent)' }}>{msg}</p>}
        <button onClick={submit} className="w-full rounded-xl py-2.5 font-extrabold text-white" style={{ background: 'linear-gradient(95deg,var(--primary),var(--primary-2))' }}>
          更新密码
        </button>
        <button onClick={onClose} className="w-full rounded-xl py-2.5 text-sm font-extrabold" style={{ background: 'var(--card)', color: 'var(--muted)' }}>
          关闭
        </button>
      </div>
    </Modal>
  );
}
