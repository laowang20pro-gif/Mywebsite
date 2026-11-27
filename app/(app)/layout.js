'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { supabase } from '../../lib/supabase';
import { AuthProvider, useAuth } from '../../lib/auth';

const NAV = [
  { href: '/home', label: '主页' },
  { href: '/scripts', label: '我的剧本' },
  { href: '/projects', label: '项目管理' },
  { href: '/assets', label: '素材库' },
  { href: '/account', label: '个人中心' },
  { href: '/settings', label: '设置' },
];

function Shell({ children }) {
  const path = usePathname();
  const { user, requireLogin } = useAuth();
  const [open, setOpen] = useState(false);

  useEffect(() => { setOpen(false); }, [path]);

  return (
    <div className="shell">
      <div className="topbar">
        <button className="menu" aria-label="打开菜单" onClick={() => setOpen(true)}>☰</button>
        <Link href="/home" className="brand">短剧工坊</Link>
        <Link href="/home" className="btn home">主页</Link>
      </div>
      <div className={'overlay' + (open ? ' show' : '')} onClick={() => setOpen(false)} />
      <aside className={'side' + (open ? ' open' : '')}>
        <Link href="/home" className="logo">短剧工坊</Link>
        {NAV.map((n) => (
          <Link key={n.href} href={n.href} className={'nav' + (path.startsWith(n.href) ? ' on' : '')}>{n.label}</Link>
        ))}
        <div className="sp" />
        {user ? (
          <>
            <div className="mute" style={{ padding: '0 10px', wordBreak: 'break-all' }}>{user.email}</div>
            <button className="btn" onClick={() => supabase.auth.signOut()}>退出登录</button>
          </>
        ) : (
          <button className="btn p" onClick={() => requireLogin()}>登录 / 注册</button>
        )}
      </aside>
      <main className="main">{children}</main>
    </div>
  );
}

export default function AppLayout({ children }) {
  return (
    <AuthProvider>
      <Shell>{children}</Shell>
    </AuthProvider>
  );
}
