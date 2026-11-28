'use client';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../lib/auth';
import { fld } from '../../../lib/ui';
import { Ads } from '../../../lib/Ad';
import { DEMO, IMAGE_MODELS, VIDEO_MODELS, generateScript, generateImage, generateVideo } from '../../../lib/demo';

const MODES = [['script', '剧本'], ['image', '图片'], ['video', '视频']];
const HINT = { script: '说说你的故事想法，我来写剧本', image: '描述你想要的图片', video: '描述你想要的视频画面' };
const small = { ...fld, padding: '6px 8px', fontSize: 14, width: 'auto' };

export default function HomePage() {
  const { requireLogin } = useAuth();
  const [full, setFull] = useState(false);
  const [mode, setMode] = useState('script');
  const [text, setText] = useState('');
  const [msgs, setMsgs] = useState([]);
  const [busy, setBusy] = useState(false);
  const [ads, setAds] = useState(null);
  const [mid, setMid] = useState({ image: IMAGE_MODELS[0].id, video: VIDEO_MODELS[0].id });
  const [quality, setQuality] = useState('');
  const [duration, setDuration] = useState(5);
  const end = useRef(null);
  const input = useRef(null);

  useEffect(() => {
    supabase.from('banners').select('*').eq('active', true).order('sort').then(({ data }) => setAds(data || []));
  }, []);
  useEffect(() => { if (full) setTimeout(() => input.current?.focus(), 50); }, [full]);
  useEffect(() => { end.current?.scrollIntoView({ behavior: 'smooth' }); }, [msgs]);
  useEffect(() => {
    document.body.style.overflow = full ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [full]);

  const models = mode === 'image' ? IMAGE_MODELS : VIDEO_MODELS;
  const m = models.find((x) => x.id === mid[mode]) || models[0];
  const ql = m.qualities.includes(quality) ? quality : m.qualities[0];
  const dur = m.durations ? (m.durations.includes(duration) ? duration : m.durations[0]) : null;

  function send() {
    const t = text.trim();
    if (!t || busy) return;
    requireLogin(async () => {
      setFull(true); setText(''); setBusy(true);
      setMsgs((l) => [...l, { role: 'user', mode, text: t }]);
      let reply;
      try {
        if (mode === 'script') {
          const content = await generateScript({ idea: t, genre: '' });
          const { error } = await supabase.from('scripts').insert({ title: t.slice(0, 20), prompt: t, content });
          reply = { kind: 'script', content, saved: error ? error.message : '已自动保存到“我的剧本”', href: '/scripts' };
        } else {
          const r = await (mode === 'image' ? generateImage : generateVideo)({ prompt: t, model: m.name, quality: ql, duration: dur });
          const { error } = await supabase.from('assets').insert({
            category: 'other', name: t.slice(0, 20), prompt: t,
            images: [{ angle: mode === 'image' ? '图片' : '视频', kind: mode, url: r.url, model: m.name, quality: ql }],
          });
          reply = { kind: mode, url: r.url, info: `${m.name} · ${dur ? dur + '秒 · ' : ''}${ql}`, saved: error ? error.message : '已自动保存到素材库的“其他”', href: '/assets' };
        }
      } catch (e) {
        reply = { kind: 'err', content: e.message || '生成失败' };
      }
      setMsgs((l) => [...l, { role: 'ai', ...reply }]);
      setBusy(false);
    });
  }

  const controls = (
    <div className="row">
      {MODES.map(([k, v]) => <button key={k} className={'btn' + (mode === k ? ' p' : '')} style={{ minHeight: 34, padding: '2px 14px' }} onClick={() => setMode(k)}>{v}</button>)}
      {mode !== 'script' && (
        <>
          <select style={small} value={m.id} onChange={(e) => setMid({ ...mid, [mode]: e.target.value })}>{models.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}</select>
          <select style={small} value={ql} onChange={(e) => setQuality(e.target.value)}>{m.qualities.map((q) => <option key={q}>{q}</option>)}</select>
          {m.durations && <select style={small} value={dur} onChange={(e) => setDuration(Number(e.target.value))}>{m.durations.map((d) => <option key={d} value={d}>{d} 秒</option>)}</select>}
        </>
      )}
    </div>
  );

  return (
    <>
      <div style={{ textAlign: 'center', padding: '20px 0 16px' }}>
        <h1>把想法变成短剧</h1>
        <div className="mute" style={{ marginTop: 4 }}>写剧本、生成图片和视频，作品会自动保存</div>
      </div>
      <div className="card" style={{ maxWidth: 720, margin: '0 auto', display: 'grid', gap: 10, padding: 12 }}>
        <div role="button" tabIndex={0} onClick={() => setFull(true)} onKeyDown={(e) => e.key === 'Enter' && setFull(true)}
          style={{ ...fld, minHeight: 80, cursor: 'text', color: text ? 'var(--ink)' : 'var(--mute)', whiteSpace: 'pre-wrap' }}>
          {text || HINT[mode]}
        </div>
        {controls}
        {DEMO && <div className="mute"><span className="tag">演示模式</span> 结果是模拟的，不花钱。</div>}
      </div>

      <div style={{ marginTop: 28 }}>
        {ads === null ? null : ads.length === 0 ? (
          <div className="empty" style={{ border: '1px dashed var(--line)', borderRadius: 12 }}>广告位（在管理后台添加广告）</div>
        ) : <Ads ads={ads} />}
      </div>

      {full && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 90, background: 'var(--bg)', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 16px', borderBottom: '1px solid var(--line)' }}>
            <button className="btn" onClick={() => setFull(false)}>收起</button>
            <b>创作对话</b>
          </div>
          <div style={{ flex: 1, overflowY: 'auto', padding: 16, display: 'grid', gap: 12, alignContent: 'start' }}>
            {msgs.length === 0 && <div className="empty">选好下面的“剧本 / 图片 / 视频”，然后说说你想要什么。</div>}
            {msgs.map((x, i) =>
              x.role === 'user' ? (
                <div key={i} style={{ justifySelf: 'end', maxWidth: '85%', background: 'var(--acc)', borderRadius: 12, padding: '8px 12px' }}>
                  <div style={{ fontSize: 12, opacity: 0.8 }}>{MODES.find((a) => a[0] === x.mode)[1]}</div>{x.text}
                </div>
              ) : (
                <div key={i} className="card" style={{ justifySelf: 'start', maxWidth: '92%' }}>
                  {x.kind === 'script' && <div style={{ whiteSpace: 'pre-wrap' }}>{x.content}</div>}
                  {x.kind === 'err' && <div className="err">{x.content}</div>}
                  {(x.kind === 'image' || x.kind === 'video') && (
                    <>
                      <img src={x.url} alt="" style={{ width: '100%', maxWidth: 420, borderRadius: 8, display: 'block' }} />
                      <div className="mute" style={{ marginTop: 6 }}><span className="tag">{x.kind === 'video' ? '演示视频' : '演示图片'}</span> {x.info}</div>
                    </>
                  )}
                  {x.saved && <div className="mute" style={{ marginTop: 8 }}>{x.saved}　{x.href && <Link href={x.href} style={{ color: '#c7d2fe' }}>去查看</Link>}</div>}
                </div>
              )
            )}
            {busy && <div className="mute">生成中…</div>}
            <div ref={end} />
          </div>
          <div style={{ padding: '10px 12px calc(10px + env(safe-area-inset-bottom, 0px))', borderTop: '1px solid var(--line)', display: 'grid', gap: 8 }}>
            <div className="row" style={{ alignItems: 'flex-end', flexWrap: 'nowrap' }}>
              <textarea ref={input} style={{ ...fld, minHeight: 48, maxHeight: 140, flex: 1 }} value={text} placeholder={HINT[mode]} onChange={(e) => setText(e.target.value)} />
              <button className="btn p" disabled={busy || !text.trim()} onClick={send}>发送</button>
            </div>
            {controls}
          </div>
        </div>
      )}
    </>
  );
}

