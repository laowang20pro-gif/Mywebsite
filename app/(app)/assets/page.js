'use client';
import { useEffect, useState } from 'react';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../lib/auth';
import { fld, Field, CATS } from '../../../lib/ui';
import { IMAGE_MODELS } from '../../../lib/demo';
import { generateAngles } from '../../../lib/assetgen';

const grid = { display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(110px,1fr))', gap: 10, marginTop: 16 };
const big = { display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(150px,1fr))', gap: 12, marginTop: 16 };
const tile = { background: 'var(--panel)', border: '1px solid var(--line)', borderRadius: 10, padding: 6, cursor: 'pointer', textAlign: 'center', color: 'inherit' };
const box = { width: '100%', aspectRatio: '1', borderRadius: 6, display: 'grid', placeItems: 'center', background: 'var(--bg)', objectFit: 'cover' };

export default function AssetsPage() {
  const { user, ready, requireLogin } = useAuth();
  const [cat, setCat] = useState('character');
  const [list, setList] = useState(null);
  const [view, setView] = useState('list'); // 'list' | 'new' | 素材 id
  const [detail, setDetail] = useState(false);
  const [f, setF] = useState({ name: '', prompt: '' });
  const [modelId, setModelId] = useState(IMAGE_MODELS[0].id);
  const [quality, setQuality] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');

  const m = IMAGE_MODELS.find((x) => x.id === modelId) || IMAGE_MODELS[0];
  const ql = m.qualities.includes(quality) ? quality : m.qualities[0];
  const gen = (category, name, description) => generateAngles({ category, name, description, model: m.name, quality: ql });

  async function load() {
    const { data, error } = await supabase.from('assets').select('*').order('created_at');
    if (error) setMsg(error.message);
    setList(data || []);
  }
  useEffect(() => {
    if (!ready) return;
    if (user) load(); else setList([]);
  }, [user, ready]);

  const shown = (list || []).filter((a) => a.category === cat);
  const cur = list?.find((a) => a.id === view);

  function openNew() { setView('new'); setF({ name: '', prompt: '' }); setMsg(''); }
  function openAsset(a) { setView(a.id); setDetail(false); setF({ name: a.name, prompt: a.prompt || a.description || '' }); setMsg(''); }
  const back = () => { setView('list'); setMsg(''); };

  function create() {
    const name = f.name.trim(), prompt = f.prompt.trim();
    if (!name) return setMsg('请先填名称');
    requireLogin(async () => {
      setBusy(true);
      const images = await gen(cat, name, prompt);
      const { error } = await supabase.from('assets').insert({ category: cat, name, prompt, images });
      setBusy(false);
      if (error) return setMsg(error.message);
      back(); load();
    });
  }
  async function save() {
    const { error } = await supabase.from('assets').update({ name: f.name.trim(), prompt: f.prompt.trim() }).eq('id', cur.id);
    setMsg(error ? error.message : '已保存'); load();
  }
  async function regen() {
    setBusy(true);
    const images = await gen(cur.category, f.name.trim(), f.prompt.trim());
    const { error } = await supabase.from('assets').update({ name: f.name.trim(), prompt: f.prompt.trim(), images }).eq('id', cur.id);
    setBusy(false); setMsg(error ? error.message : ''); load();
  }
  async function del() {
    const { count } = await supabase.from('storyboards').select('id', { count: 'exact', head: true }).contains('asset_ids', [cur.id]);
    const t = count ? `“${cur.name}”被 ${count} 个分镜引用。删除后这些分镜里的引用会失效，已生成的视频不受影响。确定删除？` : `确定删除“${cur.name}”？`;
    if (!confirm(t)) return;
    await supabase.from('assets').delete().eq('id', cur.id);
    back(); load();
  }

  const form = (
    <div className="card" style={{ marginTop: 16, display: 'grid', gap: 10 }}>
      <div className="mute"><span className="tag">演示模式</span> 图片是模拟的占位图，不花钱。</div>
      <Field label="名称"><input style={fld} value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} placeholder={`${CATS[cat]}名称`} /></Field>
      <Field label="提示词（描述外貌、颜色、材质、风格等，用来生成图片）">
        <textarea style={{ ...fld, minHeight: 90 }} value={f.prompt} onChange={(e) => setF({ ...f, prompt: e.target.value })} placeholder="例如：二十岁的古装女主，红色嫁衣，眼神倔强" />
      </Field>
      <div className="row">
        <div className="g"><Field label="图片模型"><select style={fld} value={m.id} onChange={(e) => setModelId(e.target.value)}>{IMAGE_MODELS.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}</select></Field></div>
        <div className="g"><Field label="质量"><select style={fld} value={ql} onChange={(e) => setQuality(e.target.value)}>{m.qualities.map((q) => <option key={q}>{q}</option>)}</select></Field></div>
      </div>
      <div className="row">
        {view === 'new' ? (
          <button className="btn p" disabled={busy} onClick={create}>{busy ? '生成中…' : '生成各角度图片并添加'}</button>
        ) : (
          <>
            <button className="btn p" onClick={save}>保存</button>
            <button className="btn" disabled={busy} onClick={regen}>{busy ? '生成中…' : '重新生成各角度图片'}</button>
            <button className="btn d" onClick={del}>删除</button>
          </>
        )}
      </div>
    </div>
  );

  if (view === 'new') {
    return (
      <>
        <div className="row"><button className="btn" onClick={back}>返回</button><h1 className="g">添加{CATS[cat]}</h1></div>
        {msg && <p className="err">{msg}</p>}
        {form}
      </>
    );
  }

  if (cur) {
    const imgs = cur.images || [];
    return (
      <>
        <div className="row">
          <button className="btn" onClick={back}>返回</button>
          <h1 className="g">{cur.name}</h1>
          <button className={'btn' + (detail ? ' p' : '')} onClick={() => setDetail(!detail)}>详情</button>
        </div>
        <div className="mute">{CATS[cur.category]} · {imgs.length} 张图片</div>
        {msg && <p className="err">{msg}</p>}
        {detail && form}
        {imgs.length === 0 ? <div className="empty">还没有图片，点“详情”重新生成。</div> : (
          <div style={big}>
            {imgs.map((im, i) => (
              <div key={i}>
                <img src={im.url} alt={im.angle} style={{ width: '100%', borderRadius: 8, display: 'block' }} />
                <div className="mute" style={{ textAlign: 'center' }}>{im.angle}{im.kind === 'video' ? '（演示视频）' : ''}</div>
              </div>
            ))}
          </div>
        )}
      </>
    );
  }

  return (
    <>
      <h1>素材库</h1>
      <div className="row" style={{ marginTop: 8 }}>
        {Object.entries(CATS).map(([k, v]) => <button key={k} className={'btn' + (cat === k ? ' p' : '')} onClick={() => setCat(k)}>{v}</button>)}
      </div>
      {cat === 'other' && <div className="mute" style={{ marginTop: 8 }}>在主页生成的图片和视频会自动放在这里。</div>}
      {msg && <p className="err">{msg}</p>}
      {ready && !user && <div className="mute" style={{ marginTop: 12 }}>登录后可以添加和管理素材。</div>}
      <div style={grid}>
        {list === null && <div className="empty" style={{ gridColumn: '1/-1' }}>加载中…</div>}
        {shown.map((a) => (
          <button key={a.id} style={tile} onClick={() => openAsset(a)}>
            {a.images?.[0] ? <img src={a.images[0].url} alt="" style={box} /> : <div style={box} className="mute">无图</div>}
            <div style={{ marginTop: 4, fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.name}</div>
          </button>
        ))}
        <button style={tile} onClick={openNew}>
          <div style={{ ...box, fontSize: 36, color: 'var(--mute)' }}>＋</div>
          <div style={{ marginTop: 4, fontSize: 13 }}>添加{CATS[cat]}</div>
        </button>
      </div>
    </>
  );
}

