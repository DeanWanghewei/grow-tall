'use client';

import { createContext, useContext, useState, type ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

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
  const [saving, setSaving] = useState(false);

  function open(id: string) {
    setChildId(id);
    setHeight('');
    setWeight('');
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
            className="fixed inset-0 z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="absolute inset-0 bg-black/40" onClick={() => setChildId(null)} />
            <motion.div
              className="absolute left-0 right-0 bottom-0 rounded-t-3xl p-4 pb-7"
              style={{ background: 'var(--bg)', paddingBottom: 'calc(var(--safe-bottom) + 20px)' }}
              initial={{ y: '60%' }}
              animate={{ y: 0 }}
              exit={{ y: '60%' }}
              transition={{ type: 'spring', stiffness: 320, damping: 30 }}
            >
              <div
                className="mx-auto mb-3 h-1.5 w-10 rounded-full"
                style={{ background: 'var(--muted)', opacity: 0.4 }}
              />
              <h3 className="text-center text-lg font-extrabold" style={{ color: 'var(--ink)' }}>
                记一笔
              </h3>
              <label className="mb-1 mt-3 block text-xs font-bold" style={{ color: 'var(--muted)' }}>
                身高
              </label>
              <input
                aria-label="身高"
                value={height}
                onChange={(e) => setHeight(e.target.value)}
                inputMode="decimal"
                placeholder="cm"
                className="w-full rounded-xl px-3 py-2"
                style={{ background: 'var(--card)', color: 'var(--ink)' }}
              />
              <label className="mb-1 mt-3 block text-xs font-bold" style={{ color: 'var(--muted)' }}>
                体重
              </label>
              <input
                aria-label="体重"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                inputMode="decimal"
                placeholder="kg"
                className="w-full rounded-xl px-3 py-2"
                style={{ background: 'var(--card)', color: 'var(--ink)' }}
              />
              <button
                onClick={save}
                disabled={saving}
                className="mt-4 w-full rounded-xl py-3 font-extrabold text-white"
                style={{ background: 'linear-gradient(95deg, var(--primary), var(--primary-2))' }}
              >
                {saving ? '保存中…' : '保存 🎉'}
              </button>
              <p className="mt-2 text-center text-[9px]" style={{ color: 'var(--muted)' }}>
                身高和体重填一个就行 · 同一天会自动合并
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </SheetCtx.Provider>
  );
}
