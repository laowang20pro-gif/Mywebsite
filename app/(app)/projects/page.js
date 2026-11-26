'use client';
import { useEffect, useState } from 'react';
import { supabase } from '../../../lib/supabase';

export default function ProjectsPage() {
  const [list, setList] = useState(null);
  const [q, setQ] = useState('');
  const [archived, setArchived] = useState(false);
  const [name, setName] = useState('');
  const [genre, setGenre] = useState('');
  const [msg, setMsg] = useState('');

  async function load() {
    const { data, error } = await supabase.from('projects').select('*').order('created_at', { ascending: false });
    if (error) setMsg(error.message);
    setList(data || []);
  }
  useEffect(() => { load(); }, []);

  async function add(e) {
    e.preventDefault();
    setMsg('');
    const { error } = await supabase.from('projects').insert({ name: name.trim(), genre: genre.trim() });
    if (error) return setMsg(error.message);
    setName(''); setGenre('');
    load();
  }
  async function setStatus(p, status) {
    const { error } = await supabase.from('projects').update({ status, updated_at: new Date().toISOString() }).eq('id', p.id);
    if (error) setMsg(error.message);
    load();
  }
  async function del(p) {
    if (!confirm(`确定删除“${p.name}”？删除后无法恢复。`)) return;
    const { error } = await supabase.from('projects').delete().eq('id', p.id);
    if (error) setMsg(error.message);
    load();
  }

  const shown = (list || []).filter(
    (p) => (p.status === 'archived') === archived && p.name.toLowerCase().includes(q.toLowerCase())
  );

  return (
    <>
      <h1>项目管理</h1>
      <form className="card row" style={{ marginTop: 16 }} onSubmit={add}>
        <div className="g"><input placeholder="项目名称" value={name} onChange={(e) => setName(e.target.value)} required /></div>
        <div className="g"><input placeholder="题材，例如：甜宠、逆袭" value={genre} onChange={(e) => setGenre(e.target.value)} /></div>
        <button className="btn p">新建项目</button>
      </form>
      {msg && <p className="err">{msg}</p>}
      <div className="row" style={{ marginTop: 16 }}>
        <div className="g"><input placeholder="搜索项目" value={q} onChange={(e) => setQ(e.target.value)} /></div>
        <button className="btn" onClick={() => setArchived(!archived)}>{archived ? '查看进行中' : '查看已归档'}</button>
      </div>
      {list === null ? (
        <div className="empty">加载中…</div>
      ) : shown.length === 0 ? (
        <div className="empty">{archived ? '没有已归档的项目' : '还没有项目，先在上面新建一个。'}</div>
      ) : (
        <div className="grid">
          {shown.map((p) => (
            <div key={p.id} className="card">
              <h3>{p.name}</h3>
              <div className="mute">{p.genre || '未设题材'} · {new Date(p.created_at).toLocaleDateString('zh-CN')}</div>
              <div className="row" style={{ marginTop: 12 }}>
                <button className="btn" onClick={() => setStatus(p, archived ? 'active' : 'archived')}>{archived ? '恢复' : '归档'}</button>
                <button className="btn d" onClick={() => del(p)}>删除</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
