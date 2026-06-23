'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Mascot } from '@/components/Mascot';

export default function LoginPage() {
  const router = useRouter();
  const [pw, setPw] = useState('');
  const [mode, setMode] = useState<'check' | 'setup' | 'login'>('check');
  const [err, setErr] = useState('');

  // 探测是否已设置密码,决定显示「设密码」还是「登录」
  useEffect(() => {
    fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: '__probe__' }),
    })
      .then(async (r) => {
        if (r.status === 409) {
          const j = await r.json();
          setMode(j.needsSetup ? 'setup' : 'login');
        } else {
          setMode('login');
        }
      })
      .catch(() => setMode('login'));
  }, []);

  async function submit() {
    setErr('');
    const url = mode === 'setup' ? '/api/auth/setup' : '/api/auth/login';
    const r = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: pw }),
    });
    if (!r.ok) {
      const j = await r.json().catch(() => ({}));
      setErr(j.error ?? '出错啦');
      return;
    }
    // 校验会话 cookie 是否真的被浏览器保存(HTTP 下 Secure cookie 会被丢弃 → 这里能探测到)
    const c = await fetch('/api/auth/check').then((x) => x.json()).catch(() => ({ authed: false }));
    if (!c.authed) {
      setErr('登录未生效:会话 cookie 没被保存。若是 HTTP 访问,请设 SESSION_COOKIE_SECURE=false 后重启;或改用 HTTPS。');
      return;
    }
    router.push('/home');
    router.refresh();
  }

  return (
    <div
      className="flex min-h-[100dvh] flex-col items-center justify-center gap-4 p-8"
      style={{
        paddingTop: 'var(--safe-top)',
        paddingBottom: 'var(--safe-bottom)',
        background: 'var(--bg)',
      }}
    >
      <Mascot size={120} />
      <h1 className="text-2xl font-extrabold" style={{ color: 'var(--ink)' }}>
        成长日记
      </h1>
      {mode === 'check' ? (
        <p className="text-sm" style={{ color: 'var(--muted)' }}>
          加载中…
        </p>
      ) : (
        <>
          <p className="text-sm" style={{ color: 'var(--muted)' }}>
            {mode === 'setup' ? '先设一个访问密码' : '请输入访问密码'}
          </p>
          <input
            type="password"
            value={pw}
            onChange={(e) => setPw(e.target.value)}
            className="w-56 rounded-2xl px-4 py-3 text-center text-lg outline-none"
            style={{
              background: 'var(--card)',
              border: '2px dashed var(--primary-2)',
              color: 'var(--ink)',
            }}
          />
          {err && (
            <p className="text-xs" style={{ color: 'var(--accent)' }}>
              {err}
            </p>
          )}
          <button
            onClick={submit}
            className="rounded-2xl px-8 py-3 font-extrabold text-white"
            style={{ background: 'linear-gradient(95deg, var(--primary), var(--primary-2))' }}
          >
            {mode === 'setup' ? '开始记录' : '进入'}
          </button>
        </>
      )}
    </div>
  );
}
