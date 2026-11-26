'use client';
import { useState } from 'react';
import Link from 'next/link';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../lib/auth';
import { DEMO, IMAGE_MODELS, VIDEO_MODELS, generateScript, generateImage, generateVideo } from '../../../lib/demo';

const fld = { width: '100%', background: 'var(--bg)', color: 'var(--ink)', border: '1px solid var(--line)', borderRadius: 8, padding: '10px 12px', fontSize: 16, fontFamily: 'inherit' };
const Field = ({ label, children }) => (
  <label style={{ display: 'grid', gap: 4 }}><span className="mute">{label}</span>{children}</label>
);

function ScriptTool() {
  const { requireLogin } = useAuth();
  const [idea, setIdea] = useState('');
  const [genre, setGenre] = useState('');
  const [content, setContent] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');

  async function run() {
    if (!idea.trim()) return;
    setBusy(true); setMsg('');
    setContent(await generateScript({ idea: idea.trim(), genre: genre.trim() }));
    setBusy(false);
  }
  function save() {
    const title = idea.trim().slice(0, 20), prompt = idea.trim(), text = content;
    requireLogin(async () => {
      const { error } = await supabase.from('scripts').insert({ title, prompt, content: text });
      setMsg(error ? error.message : '已保存到“我的剧本”');
    });
  }

  return (
    <>
      <Field label="你的想法"><textarea style={{ ...fld, minHeight: 90 }} value={idea} onChange={(e) => setIdea(e.target.value)} placeholder="例如：女主发现总裁其实是她失散多年的青梅竹马" /></Field>
      <Field label="题材（可选）"><input style={fld} value={genre} onChange={(e) => setGenre(e.target.value)} placeholder="甜宠、逆袭、悬疑……" /></Field>
      <button className="btn p" onClick={run} disabled={busy || !idea.trim()}>{busy ? '生成中…' : '生成剧本'}</button>
      {content && (
        <>
          <Field label="生成结果（可以直接修改）"><textarea style={{ ...fld, minHeight: 260 }} value={content} onChange={(e) => setContent(e.target.value)} /></Field>
          <div className="row">
            <button className="btn p" onClick={save}>保存到我的剧本</button>
            <Link href="/scripts" className="btn" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center' }}>去我的剧本</Link>
          </div>
          {msg && <div className="mute">{msg}</div>}
        </>
      )}
    </>
  );
}

function MediaTool({ kind }) {
  const models = kind === 'image' ? IMAGE_MODELS : VIDEO_MODELS;
  const [prompt, setPrompt] = useState('');
  const [modelId, setModelId] = useState(models[0].id);
  const [duration, setDuration] = useState(5);
  const [quality, setQuality] = useState('');
  const [busy, setBusy] = useState(false);
  const [results, setResults] = useState([]);

  const m = models.find((x) => x.id === modelId) || models[0];
  const dur = m.durations ? (m.durations.includes(duration) ? duration : m.durations[0]) : null;
  const ql = m.qualities.includes(quality) ? quality : m.qualities[0];

  async function run() {
    if (!prompt.trim()) return;
    setBusy(true);
    const fn = kind === 'image' ? generateImage : generateVideo;
    const r = await fn({ prompt: prompt.trim(), model: m.name, duration: dur, quality: ql });
    setResults([{ ...r, id: Date.now(), prompt: prompt.trim(), model: m.name, quality: ql, duration: dur }, ...results]);
    setBusy(false);
  }

  return (
    <>
      <Field label="画面描述"><textarea style={{ ...fld, minHeight: 90 }} value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder={kind === 'image' ? '例如：雨夜街头，撑伞的女孩回头' : '例如：镜头缓缓推近，女主在天台望向远方'} /></Field>
      <div className="row">
        <div className="g"><Field label="模型"><select style={fld} value={m.id} onChange={(e) => setModelId(e.target.value)}>{models.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}</select></Field></div>
        {m.durations && <div className="g"><Field label="时长"><select style={fld} value={dur} onChange={(e) => setDuration(Number(e.target.value))}>{m.durations.map((d) => <option key={d} value={d}>{d} 秒</option>)}</select></Field></div>}
        <div className="g"><Field label="质量"><select style={fld} value={ql} onChange={(e) => setQuality(e.target.value)}>{m.qualities.map((q) => <option key={q}>{q}</option>)}</select></Field></div>
      </div>
      <button className="btn p" onClick={run} disabled={busy || !prompt.trim()}>{busy ? '生成中…' : kind === 'image' ? '生成图片' : '生成视频'}</button>
      {results.length > 0 && (
        <div className="grid" style={{ marginTop: 4 }}>
          {results.map((r) => (
            <div key={r.id} className="card" style={{ padding: 10 }}>
              <img src={r.url} alt="" style={{ width: '100%', borderRadius: 8, display: 'block' }} />
              <div style={{ marginTop: 8 }}><span className="tag">演示结果</span></div>
              <div className="mute">{r.model} · {r.duration ? r.duration + '秒 · ' : ''}{r.quality}</div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}

const TABS = [['script', '生成剧本'], ['image', '生成图片'], ['video', '生成视频']];

export default function HomePage() {
  const [tab, setTab] = useState('script');
  return (
    <>
      <h1>主页</h1>
      <p className="mute">三个独立的小工具，和短剧项目分开。</p>
      <div className="row">
        {TABS.map(([k, v]) => (
          <button key={k} className={'btn' + (tab === k ? ' p' : '')} onClick={() => setTab(k)}>{v}</button>
        ))}
      </div>
      <div className="card" style={{ marginTop: 16, display: 'grid', gap: 12 }}>
        {DEMO && <div className="mute"><span className="tag">演示模式</span> 结果是模拟的，不会花钱。接上真实接口后才会生成真内容。</div>}
        {tab === 'script' ? <ScriptTool /> : <MediaTool key={tab} kind={tab} />}
      </div>
    </>
  );
}
