'use client';
import { useEffect, useState } from 'react';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../lib/auth';
import { fld, Field, CATS } from '../../../lib/ui';
import { IMAGE_MODELS } from '../../../lib/demo';
import { generateAngles, suggestAsset } from '../../../lib/assetgen';

function Row({ a, busy, onSave, onGen, onDelete }) {
  const [d, setD] = useState({ name: a.name, description: a.description || '' });
  const imgs = a.images || [];
  return (
    <div className="card" style={{ display: 'grid', gap: 8 }}>
      <div className="row">
        <div className="g"><input style={fld} value={d.name} onChange={(e) => setD({ ...d, name: e.target.value })} /></div>
        <div className="g" style={{ flex: 2 }}><input style={fld} value={d.description} placeholder="描述（外貌、颜色、材质等）" onChange={(e) => setD({ ...d, description: e.target.value })} /></div>
      </div>
      {imgs.length > 0 && (
        <div className="row">
          {imgs.map((im) => (
            <div key={im.angle} style={{ width: 104 }}>
              <img src={im.url} alt={im.angle} style={{ width: '100%', borderRadius: 6, display: 'block' }} />
              <div className="mute" style={{ textAlign: 'center' }}>{im.angle}</div>
            </div>
          ))}
        </div>
      )}
      {imgs.length > 0 && <div className="mute"><span className="tag">演示图</span> {imgs[0].model} · {imgs[0].quality}</div>}
      <div className="row">
        <button className="btn p" onClick={() => onSave(d)}>保存</button>
        <button className="btn" disabled={busy} onClick={onGen}>{busy ? '生成中…' : imgs.length ? '重新生成多角度图' : '生成多角度图'}</button>
        <button className="btn d" onClick={onDelete}>删除</button>
      </div>
    </div>
  );
}

export default function AssetsPage() {
  const { user, ready, requireLogin } = useAuth();
  const [cat, setCat] = useState('character');
  const [list, setList] = useState(null);
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const [idea, setIdea] = useState('');
  const [modelId, setModelId] = useState(IMAGE_MODELS[0].id);
  const [quality, setQuality] = useState('');
  const [busy, setBusy] = useState(null);
  const [msg, setMsg] = useState('');

  const m = IMAGE_MODELS.find((x) => x.id === modelId) || IMAGE_MODELS[0];
  const ql = m.qualities.includes(quality) ? quality : m.qualities[0];
  const gen = (category, n, d) => generateAngles({ category, name: n, description: d, model: m.name, quality: ql });

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

  function add(withImages) {
    const n = name.trim(), d = desc.trim();
    if (!n) return;
    requireLogin(async () => {
      setBusy('add');
      const images = withImages ? await gen(cat, n, d) : [];
      await run(supabase.from('assets').insert({ category: cat, name: n, description: d, images }));
      setName(''); setDesc(''); setBusy(null);
    });
  }
  function auto() {
    const t = idea.trim();
    if (!t) return;
    requireLogin(async () => {
      setBusy('auto');
      const s = await suggestAsset({ category: cat, idea: t });
      const images = await gen(cat, s.name, s.description);
      await run(supabase.from('assets').insert({ category: cat, name: s.name, description: s.description, images }));
      setIdea(''); setBusy(null);
    });
  }
  async function regen(a) {
    setBusy(a.id);
    const images = await gen(a.category, a.name, a.description || '');
    await run(supabase.from('assets').update({ images }).eq('id', a.id));
    setBusy(null);
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
      <p className="mute">人物、场景、道具、服装。可以手动添加，也可以让 AI 自动创建，并生成各个角度的图片。</p>
      <div className="row">
        {Object.entries(CATS).map(([k, v]) => (
          <button key={k} className={'btn' + (cat === k ? ' p' : '')} onClick={() => setCat(k)}>{v}</button>
        ))}
      </div>

      <div className="card" style={{ marginTop: 16, display: 'grid', gap: 8 }}>
        <div className="mute"><span className="tag">演示模式</span> 图片是模拟的占位图，不花钱。</div>
        <div className="row">
          <div className="g"><Field label="图片模型"><select style={fld} value={m.id} onChange={(e) => setModelId(e.target.value)}>{IMAGE_MODELS.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}</select></Field></div>
          <div className="g"><Field label="质量"><select style={fld} value={ql} onChange={(e) => setQuality(e.target.value)}>{m.qualities.map((q) => <option key={q}>{q}</option>)}</select></Field></div>
        </div>
        <Field label={`AI 自动创建${CATS[cat]}（描述一下）`}>
          <input style={fld} value={idea} onChange={(e) => setIdea(e.target.value)} placeholder="例如：二十岁的古装女主，红色嫁衣，眼神倔强" />
        </Field>
        <button className="btn p" onClick={auto} disabled={!!busy || !idea.trim()}>{busy === 'auto' ? '创建中…' : 'AI 自动创建并生成图片'}</button>
      </div>

      <div className="card" style={{ marginTop: 12, display: 'grid', gap: 8 }}>
        <div className="row">
          <div className="g"><input style={fld} placeholder={`${CATS[cat]}名称`} value={name} onChange={(e) => setName(e.target.value)} /></div>
          <div className="g" style={{ flex: 2 }}><input style={fld} placeholder="描述（可选）" value={desc} onChange={(e) => setDesc(e.target.value)} /></div>
        </div>
        <div className="row">
          <button className="btn" onClick={() => add(false)} disabled={!!busy || !name.trim()}>手动添加</button>
          <button className="btn p" onClick={() => add(true)} disabled={!!busy || !name.trim()}>{busy === 'add' ? '添加中…' : '添加并生成多角度图'}</button>
        </div>
      </div>
      {msg && <p className="err">{msg}</p>}

      {ready && !user ? (
        <div className="card row" style={{ marginTop: 16 }}>
          <div className="g mute">登录后可以管理你的素材。</div>
          <button className="btn p" onClick={() => requireLogin()}>登录 / 注册</button>
        </div>
      ) : list === null ? (
        <div className="empty">加载中…</div>
      ) : shown.length === 0 ? (
        <div className="empty">还没有{CATS[cat]}素材。</div>
      ) : (
        <div style={{ display: 'grid', gap: 12, marginTop: 16 }}>
          {shown.map((a) => (
            <Row key={a.id} a={a} busy={busy === a.id}
              onSave={(d) => run(supabase.from('assets').update(d).eq('id', a.id))}
              onGen={() => regen(a)} onDelete={() => del(a)} />
          ))}
        </div>
      )}
    </>
  );
}
