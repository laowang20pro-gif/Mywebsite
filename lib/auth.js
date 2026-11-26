'use client';
import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { supabase } from './supabase';

const Ctx = createContext({ user: null, ready: false, requireLogin: (f) => f && f() });
export const useAuth = () => useContext(Ctx);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);
  const [show, setShow] = useState(false);
  const pending = useRef(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null);
      setReady(true);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null);
      if (session) {
        setShow(false);
        const f = pending.current;
        pending.current = null;
        if (f) setTimeout(f, 0);
      }
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  // 需要登录的操作都包一层：已登录直接执行，没登录先弹窗，登录后自动继续
  function requireLogin(fn) {
    if (user) return fn && fn();
    pending.current = fn || null;
    setShow(true);
  }

  return (
    <Ctx.Provider value={{ user, ready, requireLogin }}>
      {children}
      {show && <LoginModal onClose={() => { pending.current = null; setShow(false); }} />}
    </Ctx.Provider>
  );
}

function LoginModal({ onClose }) {
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
    if (!data.session) {
      setMsg('注册成功。请到邮箱点击确认链接，然后回来登录。');
      setMode('login');
    }
  }

  return (
    <div className="modal-bg" onClick={onClose}>
      <form className="card modal" onClick={(e) => e.stopPropagation()} onSubmit={submit}>
        <div className="row">
          <h2 className="g">{mode === 'login' ? '登录后继续' : '创建账号'}</h2>
          <button type="button" className="btn" onClick={onClose} aria-label="关闭">关闭</button>
        </div>
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
