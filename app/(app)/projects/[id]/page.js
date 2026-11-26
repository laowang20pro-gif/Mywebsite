'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { supabase } from '../../../../lib/supabase';
import { useAuth } from '../../../../lib/auth';
import { fld, Field, CATS } from '../../../../lib/ui';

const P_KEYS = [['content', '画面内容'], ['action', '人物动作'], ['scene', '场景描述'], ['camera', '镜头运动'], ['size', '景别'], ['light', '光线'], ['style', '视觉风格'], ['neg', '负面提示词']];

function EpisodeHead({ ep, onSave, onDelete }) {
  const [d, setD] = useState({ title: ep.title, synopsis: ep.synopsis || '' });
  return (
    <div className="card" style={{ display: 'grid', gap: 8 }}>
      <Field label="本集标题"><input style={fld} value={d.title} onChange={(e) => setD({ ...d, title: e.target.value })} /></Field>
      <Field label="剧情梗概"><textarea style={{ ...fld, minHeight: 70 }} value={d.synopsis} onChange={(e) => setD({ ...d, synopsis: e.target.value })} /></Field>
      <div className="row">
        <button className="btn p" onClick={() => onSave(d)}>保存本集</button>
        <button className="btn d" onClick={onDelete}>删除本集</button>
      </div>
    </div>
  );
}

function Shot({ s, i, n, assets, onSave, onMove, onDelete }) {
  const [d, setD] = useState({ title: s.title, duration: s.duration, prompt: s.prompt || {}, asset_ids: s.asset_ids || [] });
  const tog = (id) => setD({ ...d, asset_ids: d.asset_ids.includes(id) ? d.asset_ids.filter((x) => x !== id) : [...d.asset_ids, id] });
  return (
    <div className="card" style={{ display: 'grid', gap: 8 }}>
      <div className="row">
        <h3 className="g">镜头 {i + 1}</h3>
        <button className="btn" disabled={i === 0} onClick={() => onMove(-1)}>上移</button>
        <button className="btn" disabled={i === n - 1} onClick={() => onMove(1)}>下移</button>
      </div>
      <div className="row">
        <div className="g"><Field label="镜头标题"><input style={fld} value={d.title} onChange={(e) => setD({ ...d, title: e.target.value })} /></Field></div>
        <div className="g"><Field label="时长">
          <select style={fld} value={d.duration} onChange={(e) => setD({ ...d, duration: Number(e.target.value) })}>
            <option value={5}>5 秒</option><option value={10}>10 秒</option>
          </select>
        </Field></div>
      </div>
      <Field label="引用素材（点击选择）">
        {assets.length === 0 ? (
          <span className="mute">素材库里还没有素材，<Link href="/assets" style={{ color: '#c7d2fe' }}>去添加</Link></span>
        ) : (
          <div className="row">
            {assets.map((a) => (
              <button key={a.id} type="button" className={'btn' + (d.asset_ids.includes(a.id) ? ' p' : '')} style={{ minHeight: 32, padding: '2px 10px' }} onClick={() => tog(a.id)}>
                {CATS[a.category]}·{a.name}
              </button>
            ))}
          </div>
        )}
      </Field>
      {P_KEYS.map(([k, label]) => (
        <Field key={k} label={label}>
          <input style={fld} value={d.prompt[k] || ''} onChange={(e) => setD({ ...d, prompt: { ...d.prompt, [k]: e.target.value } })} />
        </Field>
      ))}
      <div className="row">
        <button className="btn p" onClick={() => onSave(d)}>保存镜头</button>
        <button className="btn d" onClick={onDelete}>删除镜头</button>
      </div>
    </div>
  );
}

export default function ProjectDetail() {
  const { id } = useParams();
  const { user, ready, requireLogin } = useAuth();
  const [project, setProject] = useState(undefined);
  const [eps, setEps] = useState([]);
  const [shots, setShots] = useState([]);
  const [assets, setAssets] = useState([]);
  const [epId, setEpId] = useState(null);
  const [msg, setMsg] = useState('');

  async function load() {
    const [p, e, s, a] = await Promise.all([
      supabase.from('projects').select('*').eq('id', id).single(),
      supabase.from('episodes').select('*').eq('project_id', id).order('number'),
      supabase.from('storyboards').select('*').eq('project_id', id).order('number'),
      supabase.from('assets').select('id,name,category').order('name'),
    ]);
    setProject(p.data || null);
    setEps(e.data || []);
    setShots(s.data || []);
    setAssets(a.data || []);
    setEpId((cur) => (e.data?.some((x) => x.id === cur) ? cur : e.data?.[0]?.id ?? null));
    const err = [e, s, a].find((r) => r.error);
    if (err) setMsg(err.error.message);
  }
  useEffect(() => {
    if (!ready) return;
    if (user) load(); else setProject(null);
  }, [user, ready, id]);

  const run = async (q) => { const { error } = await q; setMsg(error ? error.message : ''); await load(); };

  const ep = eps.find((x) => x.id === epId);
  const epShots = shots.filter((s) => s.episode_id === epId);

  function addEp() {
    const number = eps.length ? Math.max(...eps.map((x) => x.number)) + 1 : 1;
    run(supabase.from('episodes').insert({ project_id: id, number, title: `第${number}集` }));
  }
  function delEp() {
    if (confirm(`确定删除“${ep.title}”？这一集的所有分镜也会被删除。`)) run(supabase.from('episodes').delete().eq('id', ep.id));
  }
  function addShot() {
    const number = epShots.length ? Math.max(...epShots.map((x) => x.number)) + 1 : 1;
    run(supabase.from('storyboards').insert({ project_id: id, episode_id: ep.id, number, title: `镜头${number}` }));
  }
  async function move(s, dir) {
    const j = epShots.findIndex((x) => x.id === s.id) + dir;
    const o = epShots[j];
    if (!o) return;
    await Promise.all([
      supabase.from('storyboards').update({ number: o.number }).eq('id', s.id),
      supabase.from('storyboards').update({ number: s.number }).eq('id', o.id),
    ]);
    load();
  }

  if (ready && !user) {
    return (
      <div className="card row">
        <div className="g mute">登录后才能查看项目。</div>
        <button className="btn p" onClick={() => requireLogin()}>登录 / 注册</button>
      </div>
    );
  }
  if (project === undefined) return <div className="empty">加载中…</div>;
  if (project === null) return <div className="empty">找不到这个项目。<br /><Link href="/projects" style={{ color: '#c7d2fe' }}>返回项目列表</Link></div>;

  return (
    <>
      <div className="row">
        <Link href="/projects" className="btn">返回项目列表</Link>
        <h1 className="g">{project.name}</h1>
      </div>
      <div className="mute">{project.genre || '未设题材'} · {eps.length} 集 · {shots.length} 个分镜</div>
      {msg && <p className="err">{msg}</p>}

      <div className="row" style={{ margin: '16px 0' }}>
        {eps.map((x) => (
          <button key={x.id} className={'btn' + (x.id === epId ? ' p' : '')} onClick={() => setEpId(x.id)}>第{x.number}集</button>
        ))}
        <button className="btn" onClick={addEp}>新增一集</button>
      </div>

      {!ep ? (
        <div className="empty">还没有剧集，点“新增一集”开始。</div>
      ) : (
        <div style={{ display: 'grid', gap: 12 }}>
          <EpisodeHead key={ep.id} ep={ep} onSave={(d) => run(supabase.from('episodes').update(d).eq('id', ep.id))} onDelete={delEp} />
          <h2>分镜（{epShots.length}）</h2>
          {epShots.length === 0 && <div className="empty">这一集还没有分镜。</div>}
          {epShots.map((s, i) => (
            <Shot
              key={s.id} s={s} i={i} n={epShots.length} assets={assets}
              onSave={(d) => run(supabase.from('storyboards').update(d).eq('id', s.id))}
              onMove={(dir) => move(s, dir)}
              onDelete={() => confirm('确定删除这个镜头？') && run(supabase.from('storyboards').delete().eq('id', s.id))}
            />
          ))}
          <button className="btn p" onClick={addShot}>新增分镜</button>
        </div>
      )}
    </>
  );
}
