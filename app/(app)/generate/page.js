'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../lib/auth';
import { fld, Field } from '../../../lib/ui';
import { VIDEO_MODELS } from '../../../lib/demo';
import { resolve, source, makeVideo } from '../../../lib/gen';

function Pickers({ value, eff, onChange }) {
  const m = eff.model;
  return (
    <div className="row">
      <div className="g"><Field label="模型"><select style={fld} value={value.model || ''} onChange={(e) => onChange({ model: e.target.value })}><option value="">跟随上级</option>{VIDEO_MODELS.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}</select></Field></div>
      <div className="g"><Field label="清晰度"><select style={fld} value={value.quality || ''} onChange={(e) => onChange({ quality: e.target.value })}><option value="">跟随上级</option>{m.qualities.map((q) => <option key={q}>{q}</option>)}</select></Field></div>
      <div className="g"><Field label="时长"><select style={fld} value={value.duration || ''} onChange={(e) => onChange({ duration: e.target.value ? Number(e.target.value) : '' })}><option value="">跟随上级</option>{m.durations.map((d) => <option key={d} value={d}>{d} 秒</option>)}</select></Field></div>
    </div>
  );
}

export default function GeneratePage() {
  const { user, ready, requireLogin } = useAuth();
  const [gs, setGs] = useState({});
  const [projects, setProjects] = useState(null);
  const [pid, setPid] = useState('');
  const [eps, setEps] = useState([]);
  const [epId, setEpId] = useState(null);
  const [shots, setShots] = useState([]);
  const [vers, setVers] = useState([]);
  const [busy, setBusy] = useState(null);
  const [msg, setMsg] = useState('');

  async function loadBase() {
    const [p, g] = await Promise.all([
      supabase.from('projects').select('id,name,settings').eq('status', 'active').order('created_at', { ascending: false }),
      supabase.from('user_settings').select('settings').maybeSingle(),
    ]);
    setProjects(p.data || []);
    setGs(g.data?.settings || {});
    setPid((c) => c || p.data?.[0]?.id || '');
  }
  async function loadProject() {
    if (!pid) return;
    const [e, s, v] = await Promise.all([
      supabase.from('episodes').select('*').eq('project_id', pid).order('number'),
      supabase.from('storyboards').select('*').eq('project_id', pid).order('number'),
      supabase.from('video_versions').select('*').eq('project_id', pid).order('created_at', { ascending: false }),
    ]);
    setEps(e.data || []);
    setShots(s.data || []);
    setVers(v.data || []);
    setEpId((c) => (e.data?.some((x) => x.id === c) ? c : e.data?.[0]?.id ?? null));
  }
  useEffect(() => {
    if (!ready) return;
    if (user) loadBase(); else setProjects([]);
  }, [user, ready]);
  useEffect(() => { loadProject(); }, [pid]);

  const proj = projects?.find((x) => x.id === pid);
  const ps = proj?.settings || {};
  const epShots = shots.filter((s) => s.episode_id === epId);

  function setProjDefaults(patch) {
    const settings = { ...ps, ...patch };
    setProjects((l) => l.map((x) => (x.id === pid ? { ...x, settings } : x)));
    supabase.from('projects').update({ settings }).eq('id', pid);
  }
  function setShotGen(shot, patch) {
    const gen = { ...(shot.gen || {}), ...patch };
    setShots((l) => l.map((x) => (x.id === shot.id ? { ...x, gen } : x)));
    supabase.from('storyboards').update({ gen }).eq('id', shot.id);
  }
  async function generate(shot) {
    setBusy(shot.id); setMsg('');
    const v = await makeVideo(shot, resolve(gs, ps, shot.gen));
    const mine = vers.filter((x) => x.storyboard_id === shot.id);
    const { error } = await supabase.from('video_versions').insert({ project_id: pid, storyboard_id: shot.id, ...v, is_current: !mine.some((x) => x.is_current) });
    setMsg(error ? error.message : '');
    setBusy(null);
    loadProject();
  }
  async function setCurrent(v) {
    await supabase.from('video_versions').update({ is_current: false }).eq('storyboard_id', v.storyboard_id);
    await supabase.from('video_versions').update({ is_current: true }).eq('id', v.id);
    loadProject();
  }
  async function delVer(v) {
    if (!confirm('确定删除这个视频版本？其他版本不受影响。')) return;
    await supabase.from('video_versions').delete().eq('id', v.id);
    if (v.is_current) {
      const next = vers.find((x) => x.storyboard_id === v.storyboard_id && x.id !== v.id);
      if (next) await supabase.from('video_versions').update({ is_current: true }).eq('id', next.id);
    }
    loadProject();
  }

  return (
    <>
      <h1>视频生成</h1>
      <p className="mute">给每个分镜单独生成视频。每次生成都是一个新版本，不会覆盖旧的。</p>
      {ready && !user ? (
        <div className="card row" style={{ marginTop: 16 }}>
          <div className="g mute">登录后才能生成视频。</div>
          <button className="btn p" onClick={() => requireLogin()}>登录 / 注册</button>
        </div>
      ) : projects === null ? (
        <div className="empty">加载中…</div>
      ) : projects.length === 0 ? (
        <div className="empty">还没有项目。<Link href="/projects" style={{ color: '#c7d2fe' }}>去新建一个</Link></div>
      ) : (
        <div style={{ display: 'grid', gap: 12, marginTop: 16 }}>
          <div className="mute"><span className="tag">演示模式</span> 视频是模拟的占位图，不花钱。</div>
          <div className="card" style={{ display: 'grid', gap: 8 }}>
            <Field label="选择项目">
              <select style={fld} value={pid} onChange={(e) => setPid(e.target.value)}>{projects.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}</select>
            </Field>
            <h3 style={{ marginTop: 4 }}>项目默认参数</h3>
            <Pickers value={ps} eff={resolve(gs, ps, {})} onChange={setProjDefaults} />
            <div className="mute">“跟随上级”就是用全局默认（在设置页修改）。</div>
          </div>

          <div className="row">
            {eps.map((x) => <button key={x.id} className={'btn' + (x.id === epId ? ' p' : '')} onClick={() => setEpId(x.id)}>第{x.number}集</button>)}
          </div>
          {msg && <p className="err">{msg}</p>}
          {eps.length === 0 && <div className="empty">这个项目还没有剧集和分镜，先去项目管理里添加。</div>}
          {epShots.map((shot, i) => {
            const eff = resolve(gs, ps, shot.gen);
            const mine = vers.filter((x) => x.storyboard_id === shot.id);
            return (
              <div key={shot.id} className="card" style={{ display: 'grid', gap: 8 }}>
                <h3>镜头 {i + 1}　{shot.title}</h3>
                <div className="mute">当前使用：{eff.model.name}（来自{source('model', gs, ps, shot.gen)}）· {eff.quality} · {eff.duration} 秒</div>
                <Pickers value={shot.gen || {}} eff={eff} onChange={(patch) => setShotGen(shot, patch)} />
                <div className="row">
                  <button className="btn p" disabled={busy === shot.id} onClick={() => generate(shot)}>{busy === shot.id ? '生成中…' : mine.length ? '生成新版本' : '生成视频'}</button>
                  <span className="mute">已有 {mine.length} 个版本</span>
                </div>
                {mine.length > 0 && (
                  <div className="row">
                    {mine.map((v) => (
                      <div key={v.id} style={{ width: 150 }}>
                        <img src={v.url} alt="" style={{ width: '100%', borderRadius: 6, display: 'block', outline: v.is_current ? '2px solid var(--acc)' : 'none' }} />
                        <div className="mute">{v.is_current && <span className="tag">当前使用</span>}</div>
                        <div className="mute">{v.model} · {v.quality} · {v.duration}秒</div>
                        <div className="mute">{new Date(v.created_at).toLocaleString('zh-CN')}</div>
                        <div className="row" style={{ marginTop: 4 }}>
                          {!v.is_current && <button className="btn" style={{ minHeight: 32, padding: '2px 8px' }} onClick={() => setCurrent(v)}>设为当前</button>}
                          <button className="btn d" style={{ minHeight: 32, padding: '2px 8px' }} onClick={() => delVer(v)}>删除</button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}
