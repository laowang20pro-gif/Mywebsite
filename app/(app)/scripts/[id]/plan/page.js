'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '../../../../../lib/supabase';
import { useAuth } from '../../../../../lib/auth';
import { planProject } from '../../../../../lib/plan';
import { fld, Field } from '../../../../../lib/ui';

export default function PlanPage() {
  const { id } = useParams();
  const router = useRouter();
  const { user, ready, requireLogin } = useAuth();
  const [script, setScript] = useState(undefined);
  const [plan, setPlan] = useState(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    if (!ready) return;
    if (!user) return setScript(null);
    supabase.from('scripts').select('*').eq('id', id).single().then(({ data }) => setScript(data || null));
  }, [user, ready, id]);

  async function run() {
    setBusy(true); setMsg('');
    setPlan(await planProject(script));
    setBusy(false);
  }

  const setEp = (i, patch) => setPlan((p) => ({ ...p, episodes: p.episodes.map((e, k) => (k === i ? { ...e, ...patch } : e)) }));
  const setShot = (i, j, patch) => setEp(i, { shots: plan.episodes[i].shots.map((s, k) => (k === j ? { ...s, ...patch } : s)) });
  const setList = (key, i, v) => setPlan((p) => ({ ...p, [key]: p[key].map((x, k) => (k === i ? v : x)) }));
  const dropList = (key, i) => setPlan((p) => ({ ...p, [key]: p[key].filter((_, k) => k !== i) }));

  async function confirmCreate() {
    setBusy(true); setMsg('');
    const { data: p, error } = await supabase.from('projects').insert({ name: plan.name.trim() || '未命名', genre: plan.genre.trim(), synopsis: script.content.slice(0, 500) }).select().single();
    if (error) { setBusy(false); return setMsg(error.message); }
    const fail = async (e) => { await supabase.from('projects').delete().eq('id', p.id); setBusy(false); setMsg('创建失败：' + e.message); };

    const rows = [...plan.characters.map((n) => ({ category: 'character', name: n })), ...plan.scenes.map((n) => ({ category: 'scene', name: n }))];
    let assets = [];
    if (rows.length) {
      const r = await supabase.from('assets').insert(rows).select('id,category,name');
      if (r.error) return fail(r.error);
      assets = r.data;
    }
    const charIds = assets.filter((a) => a.category === 'character').map((a) => a.id);

    const er = await supabase.from('episodes').insert(plan.episodes.map((e, i) => ({ project_id: p.id, number: i + 1, title: e.title, synopsis: e.synopsis }))).select('id,number');
    if (er.error) return fail(er.error);

    const shots = plan.episodes.flatMap((e, i) => {
      const epId = er.data.find((x) => x.number === i + 1).id;
      const sceneId = assets.find((a) => a.category === 'scene' && a.name === e.scene)?.id;
      return e.shots.map((s, j) => ({
        project_id: p.id, episode_id: epId, number: j + 1, title: s.title, duration: s.duration || 5,
        prompt: { content: s.content, size: s.size || '' },
        asset_ids: [...charIds, ...(sceneId ? [sceneId] : [])],
      }));
    });
    if (shots.length) {
      const sr = await supabase.from('storyboards').insert(shots);
      if (sr.error) return fail(sr.error);
    }
    router.push(`/projects/${p.id}`);
  }

  if (ready && !user) {
    return (
      <div className="card row">
        <div className="g mute">登录后才能使用。</div>
        <button className="btn p" onClick={() => requireLogin()}>登录 / 注册</button>
      </div>
    );
  }
  if (script === undefined) return <div className="empty">加载中…</div>;
  if (script === null) return <div className="empty">找不到这个剧本。<br /><Link href="/scripts" style={{ color: '#c7d2fe' }}>返回我的剧本</Link></div>;

  return (
    <>
      <div className="row">
        <Link href="/scripts" className="btn">返回我的剧本</Link>
        <h1 className="g">用剧本生成项目</h1>
      </div>
      <div className="card" style={{ marginTop: 16 }}>
        <h3>{script.title}</h3>
        <div className="mute" style={{ whiteSpace: 'pre-wrap', maxHeight: 120, overflow: 'auto' }}>{script.content}</div>
        {!plan && <button className="btn p" style={{ marginTop: 12 }} onClick={run} disabled={busy}>{busy ? '规划中…' : '开始 AI 规划'}</button>}
      </div>
      {msg && <p className="err">{msg}</p>}

      {plan && (
        <div style={{ display: 'grid', gap: 12, marginTop: 16 }}>
          <div className="mute"><span className="tag">演示规划</span> 现在只是按“第N场”简单拆分，不是真实 AI。你可以先修改，确认后才会创建项目，不会生成视频。</div>
          <div className="card row">
            <div className="g"><Field label="项目名称"><input style={fld} value={plan.name} onChange={(e) => setPlan({ ...plan, name: e.target.value })} /></Field></div>
            <div className="g"><Field label="题材"><input style={fld} value={plan.genre} onChange={(e) => setPlan({ ...plan, genre: e.target.value })} /></Field></div>
          </div>
          {[['characters', '人物'], ['scenes', '场景']].map(([key, label]) => (
            <div key={key} className="card" style={{ display: 'grid', gap: 8 }}>
              <h3>{label}（将加入素材库）</h3>
              {plan[key].map((n, i) => (
                <div key={i} className="row">
                  <div className="g"><input style={fld} value={n} onChange={(e) => setList(key, i, e.target.value)} /></div>
                  <button className="btn d" onClick={() => dropList(key, i)}>删除</button>
                </div>
              ))}
            </div>
          ))}
          {plan.episodes.map((e, i) => (
            <div key={i} className="card" style={{ display: 'grid', gap: 8 }}>
              <div className="row">
                <div className="g"><input style={fld} value={e.title} onChange={(ev) => setEp(i, { title: ev.target.value })} /></div>
                <button className="btn d" onClick={() => setPlan((p) => ({ ...p, episodes: p.episodes.filter((_, k) => k !== i) }))}>删除本集</button>
              </div>
              <textarea style={{ ...fld, minHeight: 60 }} value={e.synopsis} onChange={(ev) => setEp(i, { synopsis: ev.target.value })} placeholder="剧情梗概" />
              {e.shots.map((s, j) => (
                <div key={j} className="row">
                  <div className="g"><input style={fld} value={s.title} onChange={(ev) => setShot(i, j, { title: ev.target.value })} /></div>
                  <div className="g" style={{ flex: 3 }}><input style={fld} value={s.content} onChange={(ev) => setShot(i, j, { content: ev.target.value })} placeholder="画面内容" /></div>
                  <button className="btn d" onClick={() => setEp(i, { shots: e.shots.filter((_, k) => k !== j) })}>删除</button>
                </div>
              ))}
            </div>
          ))}
          <div className="row">
            <button className="btn p" onClick={confirmCreate} disabled={busy || !plan.episodes.length}>{busy ? '创建中…' : '确认并创建项目'}</button>
            <button className="btn" onClick={run} disabled={busy}>重新规划</button>
          </div>
        </div>
      )}
    </>
  );
}
