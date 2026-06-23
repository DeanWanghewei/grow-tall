'use client';

import { createContext, useContext, useState, type ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PhotoInput } from './PhotoInput';

type Ctx = { open: (childId: string) => void };
const SheetCtx = createContext<Ctx | null>(null);

export function useRecordSheet() {
  const c = useContext(SheetCtx);
  if (!c) throw new Error('useRecordSheet must be used inside RecordSheetProvider');
  return c;
}

export function RecordSheetProvider({ children }: { children: ReactNode }) {
  const [childId, setChildId] = useState<string | null>(null);
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [lastH, setLastH] = useState<number | null>(null);
  const [lastW, setLastW] = useState<number | null>(null);
  const [warn, setWarn] = useState('');
  const [saving, setSaving] = useState(false);

  async function open(id: string) {
    setChildId(id);
    setWarn('');
    // 拉最近一条:预填 + 作为异常对比基准
    const r = await fetch(`/api/records?childId=${id}`)
      .then((x) => x.json())
      .catch(() => ({ records: [] }));
    const last = r.records?.at(-1);
    setLastH(last?.height ?? null);
    setLastW(last?.weight ?? null);
    setHeight(last?.height != null ? String(last.height) : '');
    setWeight(last?.weight != null ? String(last.weight) : '');
  }

  function check(h: string, w: string) {
    const hv = h ? Number(h) : null;
    const wv = w ? Number(w) : null;
    const msgs: string[] = [];
    if (hv != null && lastH != null && Math.abs(hv - lastH) >= 5)
      msgs.push(`身高比上次(${lastH}cm)相差较大`);
    if (wv != null && lastW != null && Math.abs(wv - lastW) >= 3)
      msgs.push(`体重比上次(${lastW}kg)相差较大`);
    setWarn(msgs.join(' · '));
  }

  async function save() {
    if (!childId) return;
    setSaving(true);
    await fetch('/api/records', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        childId,
        date: new Date().toISOString(),
        height: height ? Number(height) : null,
        weight: weight ? Number(weight) : null,
      }),
    });
    setSaving(false);
    setChildId(null);
  }

  return (
    <SheetCtx.Provider value={{ open }}>
      {children}
      <AnimatePresence>
        {childId && (
          <motion.div
            className="fixed inset-0 z-50 flex items-end justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {/* 暖色磨砂遮罩(替代黑底) */}
            <div
              className="absolute inset-0"
              style={{ background: 'rgba(120,80,40,.30)', backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)' }}
              onClick={() => setChildId(null)}
            />
            <motion.div
              className="relative w-full max-w-md rounded-t-[28px] p-4 pb-7"
              style={{
                background: 'var(--bg)',
                paddingBottom: 'calc(var(--safe-bottom) + 20px)',
                boxShadow: '0 -10px 30px rgba(120,70,30,.25)',
              }}
              initial={{ y: '60%' }}
              animate={{ y: 0 }}
              exit={{ y: '60%' }}
              transition={{ type: 'spring', stiffness: 320, damping: 30 }}
            >
              {/* 卡通:顶部「胶带」装饰 */}
              <div
                style={{
                  position: 'absolute',
                  top: -12,
                  left: '50%',
                  transform: 'translateX(-50%) rotate(-3deg)',
                  width: 64,
                  height: 20,
                  background: 'rgba(255,209,92,.7)',
                  borderRadius: 3,
                }}
              />
              <div className="mx-auto mb-2 h-1.5 w-10 rounded-full" style={{ background: 'var(--muted)', opacity: 0.4 }} />
              <div className="mb-3 flex items-center justify-center gap-2">
                <span className="text-2xl">🦒</span>
                <h3 className="text-lg font-extrabold" style={{ color: 'var(--ink)' }}>
                  记一笔
                </h3>
              </div>

              {/* 身高(带单位 cm) */}
              <label className="mb-1 block text-xs font-bold" style={{ color: 'var(--muted)' }}>
                📏 身高
              </label>
              <div className="relative mb-3">
                <input
                  aria-label="身高"
                  value={height}
                  onChange={(e) => {
                    setHeight(e.target.value);
                    check(e.target.value, weight);
                  }}
                  inputMode="decimal"
                  placeholder="例如 115.2"
                  className="w-full rounded-xl border-2 border-dashed px-4 py-3 pr-12 text-center text-lg font-bold outline-none"
                  style={{ background: 'var(--card)', borderColor: 'var(--primary-2)', color: 'var(--ink)' }}
                />
                <span
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-extrabold"
                  style={{ color: 'var(--muted)' }}
                >
                  cm
                </span>
              </div>

              {/* 体重(带单位 kg) */}
              <label className="mb-1 block text-xs font-bold" style={{ color: 'var(--muted)' }}>
                ⚖️ 体重
              </label>
              <div className="relative">
                <input
                  aria-label="体重"
                  value={weight}
                  onChange={(e) => {
                    setWeight(e.target.value);
                    check(height, e.target.value);
                  }}
                  inputMode="decimal"
                  placeholder="例如 21.5"
                  className="w-full rounded-xl border-2 border-dashed px-4 py-3 pr-12 text-center text-lg font-bold outline-none"
                  style={{ background: 'var(--card)', borderColor: 'var(--primary-2)', color: 'var(--ink)' }}
                />
                <span
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-extrabold"
                  style={{ color: 'var(--muted)' }}
                >
                  kg
                </span>
              </div>

              {warn && (
                <p
                  className="mt-2 rounded-lg px-3 py-2 text-[10px] font-bold"
                  style={{ background: '#FFF3E0', color: '#C77B3A' }}
                >
                  ⚠️ {warn},确认无误?
                </p>
              )}

              <PhotoInput
                childId={childId}
                className="mt-3 w-full rounded-xl border-2 border-dashed px-4 py-2.5 text-sm font-extrabold"
                style={{ borderColor: 'var(--primary-2)', color: 'var(--primary)', background: 'var(--card)' }}
              />

              <button
                onClick={save}
                disabled={saving}
                className="mt-3 w-full rounded-xl py-3 font-extrabold text-white"
                style={{ background: 'linear-gradient(95deg,var(--primary),var(--primary-2))' }}
              >
                {saving ? '保存中…' : '保存 🎉'}
              </button>
              <p className="mt-2 text-center text-[9px]" style={{ color: 'var(--muted)' }}>
                已预填上次数值,改一下即可 · 同一天自动合并
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </SheetCtx.Provider>
  );
}
