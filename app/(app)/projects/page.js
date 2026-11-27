'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../lib/auth';
import { fld, Field } from '../../../lib/ui';

const ASPECTS = ['9:16', '16:9', '1:1'];
const blank = { name: '', genre: '', aspect: '9:16', style: '', episode_seconds: '', eps: '' };

export default function ProjectsPage() {
  const { user, ready, requireLogin } = useAuth();
  const [list, setList] = useState(null);
  const [stat, setStat] = useState({});
  const [q, setQ] = useState('');
  const [archived, setArchived] = useState(false);
  const [nf, setNf] = useState(blank);
  const [edit, setEdit] = useState(null);
  const [busy, setBusy] = useState(null);
  const [msg, setMsg] = useState('');

  async function load() {
    const [p, e, s, v] = await Promise.all([
      supabase.from('projects').select('*').order('created_at', { ascending: false }),
      supabase.from('episodes').select('id,project_id'),
      supabase.from('storyboards').select('id,project_id'),
      supabase.from('video_versions').select('storyboard_id,project_id'),
    ]);
    if (p.error) setMsg(p.error.message);
    const st = {};
    (p.data || []).forEach((x) => { st[x.id] = { eps: 0, shots: 0, vid: new Set() }; });
    (e.data || []).forEach((x) => { if (st[x.project_id]) st[x.project_id].eps++; });
    (s.data || []).forEach((x) => { if (st[x.project_id]) st[x.project_id].shots++; });
    (v.data || []).forEach((x) => { st[x.project_id]?.vid.add(x.storyboard_id); });
    setStat(st);
    setList(p.data || []);
  }
  useEffect(() => {
    if (!ready) return;
    if (user) load(); else setList([]);
  }, [user, ready]);

  function add(e) {
    e.preventDefault();
    const f = { ...nf };
    requireLogin(async () => {
      setMsg('');
      const { data, error } = await supabase.from('projects').insert({
        name: f.name.trim(), genre: f.genre.trim(), aspect: f.aspect, style: f.style.trim(),
        episode_seconds: f.episode_seconds ? Number(f.episode_seconds) : null,
      }).select().single();
      if (error) return setMsg(error.message);
      const n = Math.min(Number(f.eps) || 0, 100);
      if (n > 0) await supabase.from('episodes').insert(Array.from({ length: n }, (_, i) => ({ project_id: data.id, number: i + 1, title: `第${i + 1}集` })));
      setNf(blank);
      load();
    });
  }
  async function saveEdit() {
    const { id, name, genre, aspect, style, episode_seconds, synopsis } = edit;
    const { error } = await supabase.from('projects').update({
      name: name.trim(), genre, aspect, style, synopsis,
      episode_seconds: episode_seconds ? Number(episode_seconds) : null, updated_at: new Date().toISOString(),
    }).eq('id', id);
    setMsg(error ? error.message : '');
    if (!error) setEdit(null);
    load();
  }
  async function setStatus(p, status) {
    const { error } = await supabase.from('projects').update({ status, updated_at: new Date().toISOString() }).eq('id', p.id);
    if (error) setMsg(error.message);
    load();
  }
  async function del(p) {
    if (!confirm(`确定删除“${p.name}”？项目里的剧集、分镜和视频也会一起删除，无法恢复。`)) return;
    const { error } = await supabase.from('projects').delete().eq('id', p.id);
    if (error) setMsg(error.message);
    load();
  }
  async function copy(p) {
    setBusy(p.id); setMsg('');
    const { data: np, error } = await supabase.from('projects').insert({
      name: p.name + '（副本）', genre: p.genre, synopsis: p.synopsis, aspect: p.aspect, style: p.style,
      episode_seconds: p.episode_seconds, settings: p.settings,
    }).select().single();
    if (error) { setBusy(null); return setMsg(error.message); }
    const eps = (await supabase.from('episodes').select('*').eq('project_id', p.id).order('number')).data || [];
    if (eps.length) {
      const ne = (await supabase.from('episodes').insert(eps.map((e) => ({ project_id: np.id, number: e.number, title: e.title, synopsis: e.synopsis }))).select('id,number')).data || [];
      const map = Object.fromEntries(eps.map((e) => [e.id, ne.find((x) => x.number === e.number)?.id]));
      const sb = (await supabase.from('storyboards').select('*').eq('project_id', p.id)).data || [];
      if (sb.length) {
        const r = await supabase.from('storyboards').insert(sb.map((s) => ({
          project_id: np.id, episode_id: map[s.episode_id], number: s.number, title: s.title, duration: s.duration,
          prompt: s.prompt, prompt_text: s.prompt_text, asset_ids: s.asset_ids, gen: s.gen,
        })));
        if (r.error) setMsg(r.error.message);
      }
    }
    setBusy(null); load();
  }

  const shown = (list || []).filter((p) => (p.status === 'archived') === archived && p.name.toLowerCase().includes(q.toLowerCase()));
  const set = (k) => (e) => setNf({ ...nf, [k]: e.target.value });
  const setE = (k) => (e) => setEdit({ ...edit, [k]: e.target.value });

  return (
    <>
      <h1>项目管理</h1>
      <form className="card" style={{ marginTop: 16, display: 'grid', gap: 8 }} onSubmit={add}>
        <div className="row">
          <div className="g"><input style={fld} placeholder="项目名称" value={nf.name} onChange={set('name')} required /></div>
          <div className="g"><input style={fld} placeholder="题材，例如：甜宠、逆袭" value={nf.genre} onChange={set('genre')} /></div>
        </div>
        <div className="row">
          <div className="g"><Field label="画面比例"><select style={fld} value={nf.aspect} onChange={set('aspect')}>{ASPECTS.map((a) => <option key={a}>{a}</option>)}</select></Field></div>
          <div className="g"><Field label="视觉风格（可选）"><input style={fld} value={nf.style} onChange={set('style')} placeholder="写实、动漫、古风……" /></Field></div>
        </div>
        <div className="row">
          <div className="g"><Field label="总集数（可选，会先建好空集）"><input style={fld} type="number" min="0" max="100" value={nf.eps} onChange={set('eps')} /></Field></div>
          <div className="g"><Field label="单集目标时长（秒，可选）"><input style={fld} type="number" min="0" value={nf.episode_seconds} onChange={set('episode_seconds')} /></Field></div>
        </div>
        <button className="btn p">新建项目</button>
      </form>
      {msg && <p className="err">{msg}</p>}

      {edit && (
        <div className="card" style={{ marginTop: 16, display: 'grid', gap: 8 }}>
          <h3>编辑项目</h3>
          <Field label="名称"><input style={fld} value={edit.name} onChange={setE('name')} /></Field>
          <div className="row">
            <div className="g"><Field label="题材"><input style={fld} value={edit.genre || ''} onChange={setE('genre')} /></Field></div>
            <div className="g"><Field label="视觉风格"><input style={fld} value={edit.style || ''} onChange={setE('style')} /></Field></div>
          </div>
          <div className="row">
            <div className="g"><Field label="画面比例"><select style={fld} value={edit.aspect || '9:16'} onChange={setE('aspect')}>{ASPECTS.map((a) => <option key={a}>{a}</option>)}</select></Field></div>
            <div className="g"><Field label="单集时长（秒）"><input style={fld} type="number" min="0" value={edit.episode_seconds || ''} onChange={setE('episode_seconds')} /></Field></div>
          </div>
          <Field label="故事大纲"><textarea style={{ ...fld, minHeight: 80 }} value={edit.synopsis || ''} onChange={setE('synopsis')} /></Field>
          <div className="row"><button className="btn p" onClick={saveEdit}>保存</button><button className="btn" onClick={() => setEdit(null)}>取消</button></div>
        </div>
      )}

      {ready && !user ? (
        <div className="card row" style={{ marginTop: 16 }}>
          <div className="g mute">登录后可以保存和管理你自己的项目。</div>
          <button className="btn p" onClick={() => requireLogin()}>登录 / 注册</button>
        </div>
      ) : (
        <>
          <div className="row" style={{ marginTop: 16 }}>
            <div className="g"><input style={fld} placeholder="搜索项目" value={q} onChange={(e) => setQ(e.target.value)} /></div>
            <button className="btn" onClick={() => setArchived(!archived)}>{archived ? '查看进行中' : '查看已归档'}</button>
          </div>
          {list === null ? <div className="empty">加载中…</div> : shown.length === 0 ? (
            <div className="empty">{archived ? '没有已归档的项目' : '还没有项目，先在上面新建一个。'}</div>
          ) : (
            <div className="grid">
              {shown.map((p) => {
                const s = stat[p.id] || { eps: 0, shots: 0, vid: new Set() };
                const pct = s.shots ? Math.round((s.vid.size / s.shots) * 100) : 0;
                return (
                  <div key={p.id} className="card">
                    <h3>{p.name}</h3>
                    <div className="mute">{[p.genre, p.aspect, p.style, p.episode_seconds ? p.episode_seconds + '秒/集' : ''].filter(Boolean).join(' · ') || '未设置'}</div>
                    <div className="mute">{s.eps} 集 · {s.shots} 个分镜 · {s.vid.size}/{s.shots} 已有视频</div>
                    <div style={{ height: 6, background: 'var(--bg)', borderRadius: 3, margin: '6px 0' }}><div style={{ width: pct + '%', height: '100%', background: 'var(--acc)', borderRadius: 3 }} /></div>
                    <div className="mute">最近更新 {new Date(p.updated_at || p.created_at).toLocaleDateString('zh-CN')}</div>
                    <div className="row" style={{ marginTop: 10 }}>
                      <Link href={`/projects/${p.id}`} className="btn p">打开</Link>
                      <button className="btn" onClick={() => { setEdit({ ...p }); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>编辑</button>
                      <button className="btn" disabled={busy === p.id} onClick={() => copy(p)}>{busy === p.id ? '复制中…' : '复制'}</button>
                      <button className="btn" onClick={() => setStatus(p, archived ? 'active' : 'archived')}>{archived ? '恢复' : '归档'}</button>
                      <button className="btn d" onClick={() => del(p)}>删除</button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </>
  );
}

