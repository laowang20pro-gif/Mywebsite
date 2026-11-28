'use client';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../lib/auth';
import { fld, Field } from '../../../lib/ui';
import { Pickers } from '../../../lib/Pickers';
import { resolve } from '../../../lib/gen';
import { IMAGE_MODELS, generateImage } from '../../../lib/demo';
import { prepareBatch, runBatch } from '../../../lib/batch';

const ASPECTS = ['9:16', '16:9', '1:1'];
const rowBtn = (danger, off) => ({ display: 'block', width: '100%', textAlign: 'left', background: 'none', border: 0, borderBottom: '1px solid var(--line)', padding: '12px 4px', fontSize: 16, cursor: off ? 'default' : 'pointer', opacity: off ? 0.5 : 1, color: danger ? 'var(--danger)' : 'var(--ink)' });
const Item = ({ onClick, danger, off, children }) => <button style={rowBtn(danger, off)} disabled={off} onClick={onClick}>{children}</button>;
const Thumb = ({ p, busy }) => (
  <div style={{ position: 'relative', width: 88, height: 88, flex: '0 0 88px', borderRadius: 10, overflow: 'hidden', background: 'linear-gradient(135deg,#312e81,#0f172a)', display: 'grid', placeItems: 'center', fontSize: 30, fontWeight: 700, color: '#fff' }}>
    {p.cover_url ? <img src={p.cover_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : (p.name || '?').slice(0, 1)}
    {busy && <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,.6)', display: 'grid', placeItems: 'center', fontSize: 12, textAlign: 'center' }}>处理中…</div>}
  </div>
);

export default function ProjectsPage() {
  const { user, ready, requireLogin } = useAuth();
  const [list, setList] = useState(null);
  const [stat, setStat] = useState({});
  const [gs, setGs] = useState({});
  const [q, setQ] = useState('');
  const [archived, setArchived] = useState(false);
  const [menu, setMenu] = useState(null);
  const [panel, setPanel] = useState(null); // { id, type: 'edit' | 'params' }
  const [edit, setEdit] = useState(null);
  const [busy, setBusy] = useState({});
  const [msg, setMsg] = useState('');
  const fileRef = useRef(null);
  const uploadFor = useRef(null);

  async function load() {
    const [p, e, s, v, g] = await Promise.all([
      supabase.from('projects').select('*').order('created_at', { ascending: false }),
      supabase.from('episodes').select('id,project_id'),
      supabase.from('storyboards').select('id,project_id'),
      supabase.from('video_versions').select('storyboard_id,project_id'),
      supabase.from('user_settings').select('settings').maybeSingle(),
    ]);
    if (p.error) setMsg(p.error.message);
    const st = {};
    (p.data || []).forEach((x) => { st[x.id] = { eps: 0, shots: 0, vid: new Set() }; });
    (e.data || []).forEach((x) => { if (st[x.project_id]) st[x.project_id].eps++; });
    (s.data || []).forEach((x) => { if (st[x.project_id]) st[x.project_id].shots++; });
    (v.data || []).forEach((x) => { st[x.project_id]?.vid.add(x.storyboard_id); });
    setStat(st);
    setGs(g.data?.settings || {});
    setList(p.data || []);
  }
  useEffect(() => {
    if (!ready) return;
    if (user) load(); else setList([]);
  }, [user, ready]);

  const setB = (id, text) => setBusy((b) => { const n = { ...b }; if (text) n[id] = text; else delete n[id]; return n; });
  const update = (id, patch) => supabase.from('projects').update({ ...patch, updated_at: new Date().toISOString() }).eq('id', id);
  const open = (type, p) => { setMenu(null); setEdit({ ...p }); setPanel({ id: p.id, type }); };

  async function saveEdit() {
    const { id, name, genre, aspect, style, episode_seconds, synopsis } = edit;
    const { error } = await update(id, { name: name.trim(), genre, aspect, style, synopsis, episode_seconds: episode_seconds ? Number(episode_seconds) : null });
    setMsg(error ? error.message : '');
    if (!error) setPanel(null);
    load();
  }
  function setDefaults(p, patch) {
    const settings = { ...(p.settings || {}), ...patch };
    setList((l) => l.map((x) => (x.id === p.id ? { ...x, settings } : x)));
    update(p.id, { settings });
  }
  async function batchWhole(p) {
    setMenu(null); setMsg(''); setB(p.id, '准备中…');
    const ctx = await prepareBatch(p.id);
    if (!ctx.todo.length) { setB(p.id, null); return setMsg(`“${p.name}”：没有需要生成的分镜（都已有视频，或还没有分镜）`); }
    if (!confirm(`批量生成整部：将为 ${ctx.todo.length} 个还没有视频的分镜生成视频（演示）。已有视频的不会被覆盖。继续？`)) return setB(p.id, null);
    const r = await runBatch(ctx, (d, t) => setB(p.id, `批量生成 ${d}/${t}`));
    setB(p.id, null);
    setMsg(`“${p.name}”：完成 ${r.done - r.failed} 个${r.failed ? `，失败 ${r.failed} 个，可以再点一次重试` : ''}`);
    load();
  }
  async function genCover(p) {
    setMenu(null); setMsg(''); setB(p.id, '生成主图…');
    const m = IMAGE_MODELS[0];
    const r = await generateImage({ prompt: [p.name, p.genre, p.style].filter(Boolean).join(' '), model: m.name, quality: m.qualities[0] });
    const { error } = await update(p.id, { cover_url: r.url });
    setB(p.id, null);
    setMsg(error ? error.message : '已生成主图（演示占位图）');
    load();
  }
  async function uploadCover(e) {
    const f = e.target.files?.[0], pid = uploadFor.current;
    e.target.value = '';
    if (!f || !pid) return;
    if (!f.type.startsWith('image/')) return setMsg('请选择图片文件');
    if (f.size > 5 * 1024 * 1024) return setMsg('图片不能超过 5MB');
    setB(pid, '上传中…'); setMsg('');
    const ext = ((f.name.split('.').pop() || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '')) || 'jpg';
    const path = `${user.id}/${pid}-${Date.now()}.${ext}`;
    const up = await supabase.storage.from('covers').upload(path, f, { contentType: f.type });
    if (up.error) { setB(pid, null); return setMsg('上传失败：' + up.error.message + '（请确认已运行 covers.sql）'); }
    const { data } = supabase.storage.from('covers').getPublicUrl(path);
    await update(pid, { cover_url: data.publicUrl });
    setB(pid, null);
    load();
  }
  async function copy(p) {
    setMenu(null); setMsg(''); setB(p.id, '复制中…');
    const { data: np, error } = await supabase.from('projects').insert({
      name: p.name + '（副本）', genre: p.genre, synopsis: p.synopsis, aspect: p.aspect, style: p.style,
      episode_seconds: p.episode_seconds, settings: p.settings, cover_url: p.cover_url,
    }).select().single();
    if (error) { setB(p.id, null); return setMsg(error.message); }
    const eps = (await supabase.from('episodes').select('*').eq('project_id', p.id).order('number')).data || [];
    if (eps.length) {
      const ne = (await supabase.from('episodes').insert(eps.map((e) => ({ project_id: np.id, number: e.number, title: e.title, synopsis: e.synopsis }))).select('id,number')).data || [];
      const map = Object.fromEntries(eps.map((e) => [e.id, ne.find((x) => x.number === e.number)?.id]));
      const sb = (await supabase.from('storyboards').select('*').eq('project_id', p.id)).data || [];
      if (sb.length) {
        await supabase.from('storyboards').insert(sb.map((s) => ({
          project_id: np.id, episode_id: map[s.episode_id], number: s.number, title: s.title, duration: s.duration,
          prompt: s.prompt, prompt_text: s.prompt_text, asset_ids: s.asset_ids, gen: s.gen,
        })));
      }
    }
    setB(p.id, null);
    setMsg(`已复制为“${np.name}”（不复制已生成的视频）`);
    load();
  }
  async function toggleArchive(p) {
    setMenu(null);
    await update(p.id, { status: p.status === 'archived' ? 'active' : 'archived' });
    load();
  }
  async function del(p) {
    setMenu(null);
    if (!confirm(`确定删除“${p.name}”？项目里的剧集、分镜和视频也会一起删除，无法恢复。`)) return;
    const { error } = await supabase.from('projects').delete().eq('id', p.id);
    if (error) setMsg(error.message);
    load();
  }

  const shown = (list || []).filter((p) => (p.status === 'archived') === archived && p.name.toLowerCase().includes(q.toLowerCase()));
  const setE = (k) => (e) => setEdit({ ...edit, [k]: e.target.value });

  return (
    <>
      <h1>项目管理</h1>
      <p className="mute">项目从“我的剧本”里生成。点卡片进入项目，右上角 ⋮ 有更多操作。</p>
      <input ref={fileRef} type="file" accept="image/*" hidden onChange={uploadCover} />
      {msg && <p className="err">{msg}</p>}

      {ready && !user ? (
        <div className="card row" style={{ marginTop: 16 }}>
          <div className="g mute">登录后可以管理你的项目。</div>
          <button className="btn p" onClick={() => requireLogin()}>登录 / 注册</button>
        </div>
      ) : (
        <>
          <div className="row" style={{ marginTop: 12 }}>
            <div className="g"><input style={fld} placeholder="搜索项目" value={q} onChange={(e) => setQ(e.target.value)} /></div>
            <button className="btn" onClick={() => setArchived(!archived)}>{archived ? '查看进行中' : '查看已归档'}</button>
          </div>
          {list === null ? <div className="empty">加载中…</div> : shown.length === 0 ? (
            <div className="empty">
              {archived ? '没有已归档的项目' : <>还没有项目。去“我的剧本”选一个剧本，点“用此剧本生成项目”。<div style={{ marginTop: 12 }}><Link href="/scripts" className="btn p">去我的剧本</Link></div></>}
            </div>
          ) : (
            <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fill,minmax(320px,1fr))', alignItems: 'start' }}>
              {shown.map((p) => {
                const s = stat[p.id] || { eps: 0, shots: 0, vid: new Set() };
                const pct = s.shots ? Math.round((s.vid.size / s.shots) * 100) : 0;
                const b = busy[p.id];
                const isOpen = menu === p.id;
                return (
                  <div key={p.id} style={{ display: 'grid', gap: 8 }}>
                    <div style={{ position: 'relative' }}>
                      <Link href={`/projects/${p.id}`} className="card" style={{ display: 'flex', gap: 12, padding: 12, color: 'inherit', textDecoration: 'none' }}>
                        <Thumb p={p} busy={!!b} />
                        <div style={{ flex: 1, minWidth: 0, paddingRight: 36 }}>
                          <h3 style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}{p.status === 'archived' && <span className="tag" style={{ marginLeft: 8 }}>已归档</span>}</h3>
                          <div className="mute">{[p.genre, p.aspect, p.style, p.episode_seconds ? p.episode_seconds + '秒/集' : ''].filter(Boolean).join(' · ') || '未设置'}</div>
                          <div className="mute">{s.eps} 集 · {s.shots} 个分镜 · {s.vid.size}/{s.shots} 已有视频</div>
                          <div style={{ height: 6, background: 'var(--bg)', borderRadius: 3, margin: '6px 0' }}><div style={{ width: pct + '%', height: '100%', background: 'var(--acc)', borderRadius: 3 }} /></div>
                          <div className="mute">{b ? <span style={{ color: '#c7d2fe' }}>{b}</span> : `最近更新 ${new Date(p.updated_at || p.created_at).toLocaleDateString('zh-CN')}`}</div>
                        </div>
                      </Link>
                      <button className="btn" aria-label="更多操作" style={{ position: 'absolute', top: 8, right: 8, fontSize: 20, padding: '0 12px', minHeight: 36 }} onClick={() => setMenu(isOpen ? null : p.id)}>⋮</button>
                    </div>

                    {isOpen && (
                      <div className="card" style={{ padding: '4px 14px' }}>
                        <Item onClick={() => open('edit', p)}>编辑项目</Item>
                        <Item onClick={() => open('params', p)}>默认参数</Item>
                        <Item off={!!b} onClick={() => batchWhole(p)}>批量生成整部（已有 {s.vid.size}/{s.shots}）</Item>
                        <Item off={!!b} onClick={() => genCover(p)}>生成主图</Item>
                        <Item off={!!b} onClick={() => { uploadFor.current = p.id; setMenu(null); fileRef.current?.click(); }}>上传主图</Item>
                        <Item off={!!b} onClick={() => copy(p)}>复制项目</Item>
                        <Item onClick={() => toggleArchive(p)}>{p.status === 'archived' ? '恢复项目' : '归档项目'}</Item>
                        <Item danger onClick={() => del(p)}>删除项目</Item>
                      </div>
                    )}

                    {panel?.id === p.id && panel.type === 'edit' && edit && (
                      <div className="card" style={{ display: 'grid', gap: 8 }}>
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
                        <div className="row"><button className="btn p" onClick={saveEdit}>保存</button><button className="btn" onClick={() => setPanel(null)}>取消</button></div>
                      </div>
                    )}

                    {panel?.id === p.id && panel.type === 'params' && (
                      <div className="card" style={{ display: 'grid', gap: 8 }}>
                        <h3>项目默认参数</h3>
                        <Pickers value={p.settings || {}} eff={resolve(gs, p.settings || {}, {})} onChange={(patch) => setDefaults(p, patch)} />
                        <div className="mute">分镜没有单独设置时用这里。“跟随上级”就是用全局默认，在“设置”页修改。</div>
                        <div className="row"><button className="btn" onClick={() => setPanel(null)}>收起</button></div>
                      </div>
                    )}
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
