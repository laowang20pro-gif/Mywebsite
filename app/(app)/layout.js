'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabase';

const NAV = [
  { href: '/projects', label: '项目管理', ready: true },
  { label: '素材库' },
  { label: '视频生成' },
  { label: '任务中心' },
  { label: '视频与成片' },
  { label: '个人中心' },
  { label: '设置' },
];

export default function AppLayout({ children }) {
  const router = useRouter();
  const path = usePathname();
  const [email, setEmail] = useState(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) router.replace('/login');
      else setEmail(data.session.user.email);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      if (!session) router.replace('/login');
    });
    return () => sub.subscription.unsubscribe();
  }, [router]);

  if (!email) return <div className="center mute">加载中…</div>;

  return (
    <div className="shell">
      <aside className="side">
        <div className="logo">短剧工坊</div>
        {NAV.map((n) =>
          n.ready ? (
            <Link key={n.label} href={n.href} className={'nav' + (path.startsWith(n.href) ? ' on' : '')}>{n.label}</Link>
          ) : (
            <div key={n.label} className="nav off">{n.label}<small>未开放</small></div>
          )
        )}
        <div className="sp" />
        <div className="mute" style={{ padding: '0 10px', wordBreak: 'break-all' }}>{email}</div>
        <button className="btn" onClick={() => supabase.auth.signOut()}>退出登录</button>
      </aside>
      <main className="main">{children}</main>
    </div>
  );
}
