'use client';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../lib/auth';
import { fld } from '../../../lib/ui';
import { Ads } from '../../../lib/Ad';
import { DEMO } from '../../../lib/demo';
import { LLM_MODELS, GENRES, writeScript, reviseScript } from '../../../lib/chat';

const chip = { minHeight: 34, padding: '2px 12px' };

export default function HomePage() {
  const { requireLogin } = useAuth();
  const [full, setFull] = useState(false);
  const [text, setText] = useState('');
  const [msgs, setMsgs] = useState([]);
  const [busy, setBusy] = useState(false);
  const [ads, setAds] = useState(null);
  const [model, setModel] = useState(LLM_MODELS[0]);
  const [genre, setGenre] = useState('');
  const [open, setOpen] = useState(null); // 'model' | 'genre'
  const [savedId, setSavedId] = useState(null);
  const [saveMsg, setSaveMsg] = useState('');
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

  const lastIdx = msgs.map((x) => x.kind).lastIndexOf('script');
  const last = lastIdx >= 0 ? msgs[lastIdx] : null;
  const idea = msgs.find((x) => x.role === 'user')?.text;
  const hint = last ? '说说想怎么改，比如：第二场加一点冲突' : '说说你的故事想法，AI 帮你写剧本';

  function send() {
    const t = text.trim();
    if (!t || busy) return;
    requireLogin(async () => {
      setFull(true); setText(''); setOpen(null); setBusy(true);
      setMsgs((l) => [...l, { role: 'user', text: t }]);
      try {
        const content = last
          ? await reviseScript({ script: last.content, feedback: t, model: model.name })
          : await writeScript({ idea: t, genre, model: model.name });
        setMsgs((l) => [...l, { role: 'ai', kind: 'script', content }]);
      } catch (e) {
        setMsgs((l) => [...l, { role: 'ai', kind: 'err', content: e.message || '生成失败' }]);
      }
      setBusy(false);
    });
  }

  function saveScript(content) {
    requireLogin(async () => {
      setSaveMsg('');
      const res = savedId
        ? await supabase.from('scripts').update({ content, updated_at: new Date().toISOString() }).eq('id', savedId)
        : await supabase.from('scripts').insert({ title: (idea || '未命名').slice(0, 20), prompt: idea, content }).select('id').single();
      if (res.error) return setSaveMsg(res.error.message);
      if (!savedId) setSavedId(res.data.id);
      setSaveMsg('已保存到“我的剧本”');
    });
  }

  function newChat() { setMsgs([]); setSavedId(null); setSaveMsg(''); setText(''); }

  const controls = (
    <div style={{ position: 'relative' }}>
      {open && (
        <div style={{ position: 'absolute', left: 0, right: 0, bottom: '100%', marginBottom: 6, zIndex: 5, background: 'var(--panel)', border: '1px solid var(--line)', borderRadius: 10, padding: 10, maxHeight: '45vh', overflowY: 'auto', boxShadow: '0 -6px 20px rgba(0,0,0,.4)' }}>
          {open === 'model' ? (
            <div className="row">
              {LLM_MODELS.map((m) => (
                <button key={m.id} className={'btn' + (m.id === model.id ? ' p' : '')} style={chip} onClick={() => { setModel(m); setOpen(null); }}>{m.name}</button>
              ))}
            </div>
          ) : (
            <>
              <button className={'btn' + (!genre ? ' p' : '')} style={chip} onClick={() => { setGenre(''); setOpen(null); }}>不限</button>
              {GENRES.map((g) => (
                <div key={g.group}>
                  <div className="mute" style={{ margin: '10px 0 6px' }}>{g.group}</div>
                  <div className="row">
                    {g.items.map((it) => (
                      <button key={it} className={'btn' + (genre === it ? ' p' : '')} style={chip} onClick={() => { setGenre(it); setOpen(null); }}>{it}</button>
                    ))}
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      )}
      <div className="row">
        <button className="btn" style={chip} onClick={() => setOpen(open === 'model' ? null : 'model')}>语言模型：{model.name} {open === 'model' ? '▼' : '▲'}</button>
        <button className="btn" style={chip} onClick={() => setOpen(open === 'genre' ? null : 'genre')}>题材：{genre || '不限'} {open === 'genre' ? '▼' : '▲'}</button>
      </div>
    </div>
  );

  return (
    <>
      <div style={{ textAlign: 'center', padding: '20px 0 16px' }}>
        <h1>把想法变成短剧</h1>
        <div className="mute" style={{ marginTop: 4 }}>说出你的想法，AI 帮你写剧本，满意了再保存</div>
      </div>
      <div className="card" style={{ maxWidth: 720, margin: '0 auto', display: 'grid', gap: 10, padding: 12 }}>
        <div role="button" tabIndex={0} onClick={() => setFull(true)} onKeyDown={(e) => e.key === 'Enter' && setFull(true)}
          style={{ ...fld, minHeight: 80, cursor: 'text', color: text ? 'var(--ink)' : 'var(--mute)', whiteSpace: 'pre-wrap' }}>
          {text || hint}
        </div>
        {controls}
        {DEMO && <div className="mute"><span className="tag">演示模式</span> 剧本是模拟的，不花钱。</div>}
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
            <b style={{ flex: 1 }}>创作对话</b>
            {msgs.length > 0 && <button className="btn" onClick={newChat}>新对话</button>}
          </div>
          <div style={{ flex: 1, overflowY: 'auto', padding: 16, display: 'grid', gap: 12, alignContent: 'start' }}>
            {msgs.length === 0 && <div className="empty">说说你的故事想法，AI 会写出剧本。不满意就继续说修改意见，满意了再点“保存剧本”。</div>}
            {msgs.map((x, i) =>
              x.role === 'user' ? (
                <div key={i} style={{ justifySelf: 'end', maxWidth: '85%', background: 'var(--acc)', borderRadius: 12, padding: '8px 12px', whiteSpace: 'pre-wrap' }}>{x.text}</div>
              ) : x.kind === 'err' ? (
                <div key={i} className="card err" style={{ justifySelf: 'start' }}>{x.content}</div>
              ) : (
                <div key={i} className="card" style={{ justifySelf: 'start', maxWidth: '95%', display: 'grid', gap: 10 }}>
                  <div style={{ whiteSpace: 'pre-wrap' }}>{x.content}</div>
                  {i === lastIdx && (
                    <>
                      <div className="row">
                        <button className="btn p" onClick={() => saveScript(x.content)}>{savedId ? '保存更改' : '保存剧本'}</button>
                        <span className="mute">不满意？直接在下面说修改意见</span>
                      </div>
                      {saveMsg && <div className="mute">{saveMsg}　{!saveMsg.includes('错') && <Link href="/scripts" style={{ color: '#c7d2fe' }}>去我的剧本</Link>}</div>}
                    </>
                  )}
                </div>
              )
            )}
            {busy && <div className="mute">AI 正在写…</div>}
            <div ref={end} />
          </div>
          <div style={{ padding: '10px 12px calc(10px + env(safe-area-inset-bottom, 0px))', borderTop: '1px solid var(--line)', display: 'grid', gap: 8 }}>
            <div className="row" style={{ alignItems: 'flex-end', flexWrap: 'nowrap' }}>
              <textarea ref={input} style={{ ...fld, minHeight: 48, maxHeight: 140, flex: 1 }} value={text} placeholder={hint} onChange={(e) => setText(e.target.value)} />
              <button className="btn p" disabled={busy || !text.trim()} onClick={send}>发送</button>
            </div>
            {controls}
          </div>
        </div>
      )}
    </>
  );
}

