'use client';
import { useEffect, useState } from 'react';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../lib/auth';
import { fld, CATS } from '../../../lib/ui';

function Row({ a, onSave, onDelete }) {
  const [d, setD] = useState({ name: a.name, description: a.description || '' });
  return (
    <div className="card row">
      <div className="g"><input style={fld} value={d.name} onChange={(e) => setD({ ...d, name: e.target.value })} /></div>
      <div className="g" style={{ flex: 2 }}><input style={fld} value={d.description} placeholder="描述（外貌、颜色、材质等）" onChange={(e) => setD({ ...d, description: e.target.value })} /></div>
      <button className="btn p" onClick={() => onSave(d)}>保存</button>
      <button className="btn d" onClick={onDelete}>删除</button>
    </div>
  );
}

export default function AssetsPage() {
  const { user, ready, requireLogin } = useAuth();
  const [cat, setCat] = useState('character');
  const [list, setList] = useState(null);
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const [msg, setMsg] = useState('');

  async function load() {
    const { data, error } = await supabase.from('assets').select('*').order('created_at');
    if (error) setMsg(error.message);
    setList(data || []);
  }
  useEffect(() => {
    if (!ready) return;
    if (user) load(); else setList([]);
  }, [user, ready]);

  const run = async (q) => { const { error } = await q; setMsg(error ? error.message : ''); await load(); };

  function add(e) {
    e.preventDefault();
    const n = name.trim(), d = desc.trim();
    requireLogin(async () => {
      await run(supabase.from('assets').insert({ category: cat, name: n, description: d }));
      setName(''); setDesc('');
    });
  }
  async function del(a) {
    const { count } = await supabase.from('storyboards').select('id', { count: 'exact', head: true }).contains('asset_ids', [a.id]);
    const text = count
      ? `“${a.name}”被 ${count} 个分镜引用。删除后这些分镜里的引用会失效，已生成的视频不受影响。确定删除？`
      : `确定删除“${a.name}”？`;
    if (confirm(text)) run(supabase.from('assets').delete().eq('id', a.id));
  }

  const shown = (list || []).filter((a) => a.category === cat);

  return (
    <>
      <h1>素材库</h1>
      <p className="mute">人物、场景、道具、服装，在分镜里可以直接引用。</p>
      <div className="row">
        {Object.entries(CATS).map(([k, v]) => (
          <button key={k} className={'btn' + (cat === k ? ' p' : '')} onClick={() => setCat(k)}>{v}</button>
        ))}
      </div>
      <form className="card row" style={{ marginTop: 16 }} onSubmit={add}>
        <div className="g"><input style={fld} placeholder={`${CATS[cat]}名称`} value={name} onChange={(e) => setName(e.target.value)} required /></div>
        <div className="g" style={{ flex: 2 }}><input style={fld} placeholder="描述（可选）" value={desc} onChange={(e) => setDesc(e.target.value)} /></div>
        <button className="btn p">添加</button>
      </form>
      {msg && <p className="err">{msg}</p>}
      {ready && !user ? (
        <div className="card row" style={{ marginTop: 16 }}>
          <div className="g mute">登录后可以管理你的素材。</div>
          <button className="btn p" onClick={() => requireLogin()}>登录 / 注册</button>
        </div>
      ) : list === null ? (
        <div className="empty">加载中…</div>
      ) : shown.length === 0 ? (
        <div className="empty">还没有{CATS[cat]}素材，在上面添加一个。</div>
      ) : (
        <div style={{ display: 'grid', gap: 8, marginTop: 16 }}>
          {shown.map((a) => (
            <Row key={a.id} a={a} onSave={(d) => run(supabase.from('assets').update(d).eq('id', a.id))} onDelete={() => del(a)} />
          ))}
        </div>
      )}
    </>
  );
}
