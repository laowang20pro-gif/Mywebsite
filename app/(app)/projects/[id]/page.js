'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '../../../../lib/supabase';
import { useAuth } from '../../../../lib/auth';
import { fld, Field, CATS } from '../../../../lib/ui';
import { Pickers } from '../../../../lib/Pickers';
import { resolve, source, makeVideo, suggestPrompt } from '../../../../lib/gen';

const sm = { minHeight: 32, padding: '2px 10px' };
const ASPECTS = ['9:16', '16:9', '1:1'];
const rowBtn = (danger) => ({ display: 'block', width: '100%', textAlign: 'left', background: 'none', border: 0, borderBottom: '1px solid var(--line)', padding: '12px 4px', fontSize: 16, cursor: 'pointer', color: danger ? 'var(--danger)' : 'var(--ink)' });
const Item = ({ onClick, danger, children }) => <button style={rowBtn(danger)} onClick={onClick}>{children}</button>;

export default function ProjectDetail() {
  const { id } = useParams();
  const router = useRouter();
  const { user, ready, requireLogin } = useAuth();
  const [project, setProject] = useState(undefined);
  const [gs, setGs] = useState({});
  const [eps, setEps] = useState([]);
  const [shots, setShots] = useState([]);
  const [assets, setAssets] = useState([]);
  const [vers, setVers] = useState([]);
  const [run, setRun] = useState({});
  const [fail, setFail] = useState({});
  const [msg, setMsg] = useState('');
  const [menu, setMenu] = useState(false);
  const [panel, setPanel] = useState(null); // 'edit' | 'params'
  const [edit, setEdit] = useState(null);
  const [openEp, setOpenEp] = useState(null);
  const [epMenu, setEpMenu] = useState(null);

  async function load() {
    const [p, e, s, a, v, g] = await Promise.all([
      supabase.from('projects').select('*').eq('id', id).single(),
      supabase.from('episodes').select('*').eq('project_id', id).order('number'),
      supabase.from('storyboards').select('*').eq('project_id', id).order('number'),
      supabase.from('assets').select('id,name,category').order('name'),
      supabase.from('video_versions').select('*').eq('project_id', id).order('created_at', { ascending: false }),
      supabase.from('user_settings').select('settings').maybeSingle(),
    ]);
    setProject(p.data || null);
    setEps(e.data || []);
    setShots((s.data || []).map((x) => ({ ...x, prompt_text: x.prompt_text || x.prompt?.content || '' })));
    setAssets(a.data || []);
    setVers(v.data || []);
    setGs(g.data?.settings || {});
    const err = [e, s, a, v].find((r) => r.error);
    if (err) setMsg(err.error.message);
  }
  useEffect(() => {
    if (!ready) return;
    if (user) load(); else setProject(null);
  }, [user, ready, id]);

  const ps = project?.settings || {};
  const hasVid = (s) => vers.some((v) => v.storyboard_id === s.id);
  const count = (list) => `${list.filter(hasVid).length}/${list.length}`;
  const shotsOf = (eid) => shots.filter((s) => s.episode_id === eid);

  const q = async (p) => { const { error } = await p; setMsg(error ? error.message : ''); await load(); };
  const patchShot = (sid, patch) => setShots((l) => l.map((x) => (x.id === sid ? { ...x, ...patch } : x)));
  const saveShot = (sid, patch) => supabase.from('storyboards').update(patch).eq('id', sid);
  const patchEp = (eid, patch) => setEps((l) => l.map((x) => (x.id === eid ? { ...x, ...patch } : x)));
  const saveEp = (eid, patch) => supabase.from('episodes').update(patch).eq('id', eid);
  const busyOn = (sid) => setRun((r) => ({ ...r, [sid]: true }));
  const busyOff = (sid) => setRun((r) => { const n = { ...r }; delete n[sid]; return n; });
  const namesOf = (s) => assets.filter((a) => (s.asset_ids || []).includes(a.id)).map((a) => a.name);
  const synopsisOf = (s) => eps.find((x) => x.id === s.episode_id)?.synopsis;

  /* ---------- 项目级操作（三个点菜单） ---------- */
  function setProjDefaults(patch) {
    const settings = { ...ps, ...patch };
    setProject({ ...project, settings });
    supabase.from('projects').update({ settings }).eq('id', id);
  }
  async function saveProject() {
    const { name, genre, aspect, style, episode_seconds, synopsis } = edit;
    const { error } = await supabase.from('projects').update({
      name: name.trim(), genre, aspect, style, synopsis,
      episode_seconds: episode_seconds ? Number(episode_seconds) : null, updated_at: new Date().toISOString(),
    }).eq('id', id);
    setMsg(error ? error.message : '');
    if (!error) setPanel(null);
    load();
  }
  async function toggleArchive() {
    const status = project.status === 'archived' ? 'active' : 'archived';
    await supabase.from('projects').update({ status, updated_at: new Date().toISOString() }).eq('id', id);
    router.push('/projects');
  }
  async function delProject() {
    if (!confirm(`确定删除“${project.name}”？项目里的剧集、分镜和视频也会一起删除，无法恢复。`)) return;
    await supabase.from('projects').delete().eq('id', id);
    router.push('/projects');
  }
  async function copyProject() {
    const p = project;
    setMsg('复制中…');
    const { data: np, error } = await supabase.from('projects').insert({
      name: p.name + '（副本）', genre: p.genre, synopsis: p.synopsis, aspect: p.aspect, style: p.style,
      episode_seconds: p.episode_seconds, settings: p.settings,
    }).select().single();
    if (error) return setMsg(error.message);
    if (eps.length) {
      const ne = (await supabase.from('episodes').insert(eps.map((e) => ({ project_id: np.id, number: e.number, title: e.title, synopsis: e.synopsis }))).select('id,number')).data || [];
      const map = Object.fromEntries(eps.map((e) => [e.id, ne.find((x) => x.number === e.number)?.id]));
      if (shots.length) {
        await supabase.from('storyboards').insert(shots.map((s) => ({
          project_id: np.id, episode_id: map[s.episode_id], number: s.number, title: s.title, duration: s.duration,
          prompt: s.prompt, prompt_text: s.prompt_text, asset_ids: s.asset_ids, gen: s.gen,
        })));
      }
    }
    setMsg(`已复制，在项目列表里可以看到“${np.name}”（不复制已生成的视频）`);
  }

  /* ---------- 分镜与生成 ---------- */
  function setShotGen(s, patch) {
    const gen = { ...(s.gen || {}), ...patch };
    patchShot(s.id, { gen });
    saveShot(s.id, { gen });
  }
  function tog(s, aid) {
    const ids = s.asset_ids || [];
    const next = ids.includes(aid) ? ids.filter((x) => x !== aid) : [...ids, aid];
    patchShot(s.id, { asset_ids: next });
    saveShot(s.id, { asset_ids: next });
  }
  async function aiPrompt(s) {
    busyOn(s.id);
    const t = await suggestPrompt({ title: s.title, synopsis: synopsisOf(s), names: namesOf(s) });
    patchShot(s.id, { prompt_text: t });
    await saveShot(s.id, { prompt_text: t });
    busyOff(s.id);
  }
  async function genOne(shot) {
    busyOn(shot.id);
    setFail((f) => ({ ...f, [shot.id]: '' }));
    try {
      let s = shot;
      if (!s.prompt_text.trim()) {
        const t = await suggestPrompt({ title: s.title, synopsis: synopsisOf(s), names: namesOf(s) });
        s = { ...s, prompt_text: t };
        await saveShot(s.id, { prompt_text: t });
      }
      const v = await makeVideo(s, resolve(gs, ps, s.gen));
      const hasCur = vers.some((x) => x.storyboard_id === s.id && x.is_current);
      const { error } = await supabase.from('video_versions').insert({ project_id: id, storyboard_id: s.id, ...v, is_current: !hasCur });
      if (error) throw error;
    } catch (e) {
      setFail((f) => ({ ...f, [shot.id]: e.message || '生成失败' }));
    }
    busyOff(shot.id);
  }
  async function genAndReload(s) { await genOne(s); load(); }
  async function batch(list, label) {
    const todo = list.filter((s) => !hasVid(s));
    if (!todo.length) return setMsg('没有需要生成的分镜：都已经有视频了。想重新生成，请在分镜里点“生成新版本”。');
    if (!confirm(`${label}：将为 ${todo.length} 个还没有视频的分镜生成视频（演示）。已有视频的不会被覆盖。继续？`)) return;
    setMsg('');
    for (let i = 0; i < todo.length; i += 3) await Promise.all(todo.slice(i, i + 3).map(genOne));
    load();
  }
  async function setCurrent(v) {
    await supabase.from('video_versions').update({ is_current: false }).eq('storyboard_id', v.storyboard_id);
    await supabase.from('video_versions').update({ is_current: true }).eq('id', v.id);
    load();
  }
  async function delVer(v) {
    if (!confirm('确定删除这个视频版本？其他版本不受影响。')) return;
    await supabase.from('video_versions').delete().eq('id', v.id);
    if (v.is_current) {
      const next = vers.find((x) => x.storyboard_id === v.storyboard_id && x.id !== v.id);
      if (next) await supabase.from('video_versions').update({ is_current: true }).eq('id', next.id);
    }
    load();
  }
  function addEp() {
    const number = eps.length ? Math.max(...eps.map((x) => x.number)) + 1 : 1;
    q(supabase.from('episodes').insert({ project_id: id, number, title: `第${number}集` }));
  }
  function addShot(ep, list) {
    const number = list.length ? Math.max(...list.map((x) => x.number)) + 1 : 1;
    q(supabase.from('storyboards').insert({ project_id: id, episode_id: ep.id, number, title: `镜头${number}` }));
  }
  async function move(s, dir, list) {
    const o = list[list.findIndex((x) => x.id === s.id) + dir];
    if (!o) return;
    await Promise.all([saveShot(s.id, { number: o.number }), saveShot(o.id, { number: s.number })]);
    load();
  }

  function renderShot(s, i, list) {
    const eff = resolve(gs, ps, s.gen);
    const mine = vers.filter((x) => x.storyboard_id === s.id);
    const cur = mine.find((x) => x.is_current) || mine[0];
    const busy = !!run[s.id];
    return (
      <div key={s.id} className="card" style={{ display: 'grid', gap: 8, background: 'var(--bg)' }}>
        <div className="row">
          <span className="mute">镜头 {i + 1}</span>
          <div className="g"><input style={fld} value={s.title} onChange={(e) => patchShot(s.id, { title: e.target.value })} onBlur={() => saveShot(s.id, { title: s.title })} /></div>
          <button className="btn" style={sm} disabled={i === 0} onClick={() => move(s, -1, list)}>上移</button>
          <button className="btn" style={sm} disabled={i === list.length - 1} onClick={() => move(s, 1, list)}>下移</button>
          <button className="btn d" style={sm} onClick={() => confirm('确定删除这个镜头？') && q(supabase.from('storyboards').delete().eq('id', s.id))}>删除</button>
        </div>
        <Field label="提示词（用来生成视频）">
          <textarea style={{ ...fld, minHeight: 80 }} value={s.prompt_text} placeholder="还没有提示词，点下面的“AI 生成提示词”，或自己写"
            onChange={(e) => patchShot(s.id, { prompt_text: e.target.value })} onBlur={() => saveShot(s.id, { prompt_text: s.prompt_text })} />
        </Field>
        <details>
          <summary className="mute">引用素材（{(s.asset_ids || []).length}）</summary>
          <div className="row" style={{ marginTop: 8 }}>
            {assets.length === 0 && <span className="mute">素材库还没有素材，<Link href="/assets" style={{ color: '#c7d2fe' }}>去添加</Link></span>}
            {assets.map((a) => (
              <button key={a.id} className={'btn' + ((s.asset_ids || []).includes(a.id) ? ' p' : '')} style={sm} onClick={() => tog(s, a.id)}>{CATS[a.category]}·{a.name}</button>
            ))}
          </div>
        </details>
        <details>
          <summary className="mute">生成参数：{eff.model.name} · {eff.quality} · {eff.duration} 秒（来自{source('model', gs, ps, s.gen)}）</summary>
          <div style={{ marginTop: 8 }}><Pickers value={s.gen || {}} eff={eff} onChange={(patch) => setShotGen(s, patch)} /></div>
        </details>
        <div className="row">
          <button className="btn" disabled={busy} onClick={() => aiPrompt(s)}>AI 生成提示词</button>
          <button className="btn p" disabled={busy} onClick={() => genAndReload(s)}>{busy ? '生成中…' : mine.length ? '生成新版本' : '生成视频'}</button>
          {fail[s.id] && <span className="err">失败：{fail[s.id]}，可以再点一次重试</span>}
        </div>
        {cur && (
          <div className="row" style={{ alignItems: 'flex-start' }}>
            <div style={{ width: 200 }}>
              <img src={cur.url} alt="" style={{ width: '100%', borderRadius: 8, display: 'block' }} />
              <div className="mute"><span className="tag">演示视频</span> {cur.model} · {cur.quality} · {cur.duration}秒</div>
            </div>
            {mine.length > 1 && (
              <details className="g">
                <summary className="mute">历史版本（{mine.length}）</summary>
                <div className="row" style={{ marginTop: 8 }}>
                  {mine.map((v) => (
                    <div key={v.id} style={{ width: 120 }}>
                      <img src={v.url} alt="" style={{ width: '100%', borderRadius: 6, display: 'block', outline: v.id === cur.id ? '2px solid var(--acc)' : 'none' }} />
                      <div className="mute">{new Date(v.created_at).toLocaleString('zh-CN')}</div>
                      <div className="row">
                        {v.id !== cur.id && <button className="btn" style={sm} onClick={() => setCurrent(v)}>设为当前</button>}
                        <button className="btn d" style={sm} onClick={() => delVer(v)}>删除</button>
                      </div>
                    </div>
                  ))}
                </div>
              </details>
            )}
          </div>
        )}
      </div>
    );
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

  const setE = (k) => (e) => setEdit({ ...edit, [k]: e.target.value });
  const archivedNow = project.status === 'archived';

  return (
    <>
      <div className="row">
        <Link href="/projects" className="btn">返回</Link>
        <h1 className="g">{project.name}</h1>
        <button className="btn" aria-label="更多操作" style={{ fontSize: 20, padding: '0 14px' }} onClick={() => setMenu(!menu)}>⋮</button>
      </div>
      <div className="mute">
        {[project.genre, project.aspect, project.style].filter(Boolean).join(' · ')}{archivedNow && <span className="tag" style={{ marginLeft: 8 }}>已归档</span>}
        <div>{eps.length} 集 · {shots.length} 个分镜 · {count(shots)} 个已有视频</div>
      </div>
      {msg && <p className="err">{msg}</p>}

      {menu && (
        <div className="card" style={{ marginTop: 12, padding: '4px 14px' }}>
          <Item onClick={() => { setEdit({ ...project }); setPanel('edit'); setMenu(false); }}>编辑项目</Item>
          <Item onClick={() => { setPanel('params'); setMenu(false); }}>默认参数</Item>
          <Item onClick={() => { setMenu(false); batch(shots, '批量生成整部'); }}>批量生成整部（已有 {count(shots)}）</Item>
          <Item onClick={() => { setMenu(false); copyProject(); }}>复制项目</Item>
          <Item onClick={toggleArchive}>{archivedNow ? '恢复项目' : '归档项目'}</Item>
          <Item danger onClick={delProject}>删除项目</Item>
        </div>
      )}

      {panel === 'edit' && edit && (
        <div className="card" style={{ marginTop: 12, display: 'grid', gap: 8 }}>
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
          <div className="row"><button className="btn p" onClick={saveProject}>保存</button><button className="btn" onClick={() => setPanel(null)}>取消</button></div>
        </div>
      )}

      {panel === 'params' && (
        <div className="card" style={{ marginTop: 12, display: 'grid', gap: 8 }}>
          <h3>项目默认参数</h3>
          <Pickers value={ps} eff={resolve(gs, ps, {})} onChange={setProjDefaults} />
          <div className="mute">分镜没有单独设置时用这里。“跟随上级”就是用全局默认，在“设置”页修改。</div>
          <div className="row"><button className="btn" onClick={() => setPanel(null)}>收起</button></div>
        </div>
      )}

      <div className="mute" style={{ margin: '16px 0 8px' }}><span className="tag">演示模式</span> 视频是模拟的占位图，不花钱。</div>
      <div style={{ display: 'grid', gap: 8 }}>
        {eps.length === 0 && <div className="empty">还没有剧集，点下面的“新增一集”开始。</div>}
        {eps.map((ep) => {
          const list = shotsOf(ep.id);
          const open = openEp === ep.id;
          return (
            <div key={ep.id} className="card" style={{ padding: 0 }}>
              <button onClick={() => { setOpenEp(open ? null : ep.id); setEpMenu(null); }}
                style={{ width: '100%', textAlign: 'left', background: 'none', border: 0, color: 'inherit', padding: 14, cursor: 'pointer', display: 'flex', gap: 8, alignItems: 'center', font: 'inherit' }}>
                <b style={{ flex: 1 }}>第{ep.number}集　{ep.title}</b>
                <span className="mute">{list.length} 镜头 · {count(list)} 视频</span>
                <span className="mute">{open ? '▲' : '▼'}</span>
              </button>
              {open && (
                <div style={{ padding: '0 14px 14px', display: 'grid', gap: 12 }}>
                  <div className="row">
                    <div className="g"><Field label="本集标题"><input style={fld} value={ep.title} onChange={(e) => patchEp(ep.id, { title: e.target.value })} onBlur={() => saveEp(ep.id, { title: ep.title })} /></Field></div>
                    <button className="btn" aria-label="本集操作" style={{ fontSize: 20, padding: '0 14px', alignSelf: 'flex-end' }} onClick={() => setEpMenu(epMenu === ep.id ? null : ep.id)}>⋮</button>
                  </div>
                  {epMenu === ep.id && (
                    <div style={{ padding: '0 4px', border: '1px solid var(--line)', borderRadius: 8 }}>
                      <Item onClick={() => { setEpMenu(null); batch(list, '批量生成本集'); }}>批量生成本集（已有 {count(list)}）</Item>
                      <Item danger onClick={() => { setEpMenu(null); confirm(`确定删除“${ep.title}”？这一集的所有分镜和视频也会被删除。`) && q(supabase.from('episodes').delete().eq('id', ep.id)); }}>删除本集</Item>
                    </div>
                  )}
                  <Field label="剧情梗概"><textarea style={{ ...fld, minHeight: 70 }} value={ep.synopsis || ''} onChange={(e) => patchEp(ep.id, { synopsis: e.target.value })} onBlur={() => saveEp(ep.id, { synopsis: ep.synopsis })} /></Field>
                  {list.length === 0 && <div className="empty">这一集还没有分镜。</div>}
                  {list.map((s, i) => renderShot(s, i, list))}
                  <button className="btn p" onClick={() => addShot(ep, list)}>新增分镜</button>
                </div>
              )}
            </div>
          );
        })}
        <button className="btn p" onClick={addEp}>新增一集</button>
      </div>
    </>
  );
}

