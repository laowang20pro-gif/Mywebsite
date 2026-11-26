'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../lib/auth';

const fld = { width: '100%', background: 'var(--bg)', color: 'var(--ink)', border: '1px solid var(--line)', borderRadius: 8, padding: '10px 12px', fontSize: 16, fontFamily: 'inherit' };

export default function ScriptsPage() {
  const { user, ready, requireLogin } = useAuth();
  const [list, setList] = useState(null);
  const [openId, setOpenId] = useState(null);
  const [draft, setDraft] = useState({ title: '', content: '' });
  const [msg, setMsg] = useState('');

  async function load() {
    const { data, error } = await supabase.from('scripts').select('*').order('created_at', { ascending: false });
    if (error) setMsg(error.message);
    setList(data || []);
  }
  useEffect(() => {
    if (!ready) return;
    if (user) load(); else setList([]);
  }, [user, ready]);

  function open(s) {
    setOpenId(openId === s.id ? null : s.id);
    setDraft({ title: s.title, content: s.content });
  }
  async function save(s) {
    const { error } = await supabase.from('scripts').update({ title: draft.title, content: draft.content, updated_at: new Date().toISOString() }).eq('id', s.id);
    setMsg(error ? error.message : '');
    if (!error) { setOpenId(null); load(); }
  }
  async function del(s) {
    if (!confirm(`确定删除“${s.title}”？删除后无法恢复。`)) return;
    const { error } = await supabase.from('scripts').delete().eq('id', s.id);
    if (error) setMsg(error.message);
    load();
  }

  return (
    <>
      <h1>我的剧本</h1>
      <p className="mute">在主页生成并保存的剧本都在这里。</p>
      {msg && <p className="err">{msg}</p>}
      {ready && !user ? (
        <div className="card row" style={{ marginTop: 16 }}>
          <div className="g mute">登录后可以查看和管理你保存的剧本。</div>
          <button className="btn p" onClick={() => requireLogin()}>登录 / 注册</button>
        </div>
      ) : list === null ? (
        <div className="empty">加载中…</div>
      ) : list.length === 0 ? (
        <div className="empty">还没有保存的剧本。去主页生成一个吧。</div>
      ) : (
        <div style={{ display: 'grid', gap: 12, marginTop: 16 }}>
          {list.map((s) => (
            <div key={s.id} className="card">
              <h3>{s.title}</h3>
              <div className="mute">{new Date(s.created_at).toLocaleDateString('zh-CN')} · {s.content.slice(0, 40).replace(/\n/g, ' ')}…</div>
              <div className="row" style={{ marginTop: 12 }}>
                <button className="btn" onClick={() => open(s)}>{openId === s.id ? '收起' : '查看 / 修改'}</button>
                <Link href={`/scripts/${s.id}/plan`} className="btn p">用此剧本生成项目</Link>
                <button className="btn d" onClick={() => del(s)}>删除</button>
              </div>
              {openId === s.id && (
                <div style={{ display: 'grid', gap: 8, marginTop: 12 }}>
                  <input style={fld} value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} />
                  <textarea style={{ ...fld, minHeight: 260 }} value={draft.content} onChange={(e) => setDraft({ ...draft, content: e.target.value })} />
                  <button className="btn p" onClick={() => save(s)}>保存修改</button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </>
  );
}
