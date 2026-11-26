'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabase';

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setMsg('');
    const { data, error } =
      mode === 'login'
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signUp({ email, password });
    setBusy(false);
    if (error) return setMsg(error.message);
    if (data.session) return router.replace('/projects');
    setMsg('注册成功。请到邮箱点击确认链接，然后回来登录。');
    setMode('login');
  }

  return (
    <div className="center">
      <form className="card" onSubmit={submit}>
        <h2>短剧工坊</h2>
        <div className="mute">{mode === 'login' ? '登录你的账号' : '创建新账号'}</div>
        <input type="email" placeholder="邮箱" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <input type="password" placeholder="密码（至少 6 位）" value={password} onChange={(e) => setPassword(e.target.value)} minLength={6} required />
        {msg && <div className="err">{msg}</div>}
        <button className="btn p" disabled={busy}>{busy ? '请稍候…' : mode === 'login' ? '登录' : '注册'}</button>
        <button type="button" className="btn" onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setMsg(''); }}>
          {mode === 'login' ? '没有账号？去注册' : '已有账号？去登录'}
        </button>
      </form>
    </div>
  );
}
