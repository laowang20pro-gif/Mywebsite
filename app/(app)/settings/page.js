'use client';
import { useEffect, useState } from 'react';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../lib/auth';
import { fld, Field } from '../../../lib/ui';
import { VIDEO_MODELS } from '../../../lib/demo';
import { resolve } from '../../../lib/gen';

export default function SettingsPage() {
  const { user, ready, requireLogin } = useAuth();
  const [s, setS] = useState({});
  const [msg, setMsg] = useState('');

  useEffect(() => {
    if (!ready || !user) return;
    supabase.from('user_settings').select('settings').maybeSingle().then(({ data }) => setS(data?.settings || {}));
  }, [user, ready]);

  const eff = resolve(s, {}, {});

  function save() {
    requireLogin(async () => {
      const { data: u } = await supabase.auth.getUser();
      const settings = { model: eff.model.id, quality: eff.quality, duration: eff.duration };
      const { error } = await supabase.from('user_settings').upsert({ user_id: u.user.id, settings });
      setMsg(error ? error.message : '已保存');
      if (!error) setS(settings);
    });
  }

  return (
    <>
      <h1>设置</h1>
      <p className="mute">全局默认的视频生成参数。新项目和分镜默认沿用这里，也可以在项目里或某个分镜里单独覆盖。</p>
      <div className="card" style={{ marginTop: 16, display: 'grid', gap: 12 }}>
        <h3>全局默认</h3>
        <div className="row">
          <div className="g"><Field label="视频模型"><select style={fld} value={eff.model.id} onChange={(e) => setS({ ...s, model: e.target.value })}>{VIDEO_MODELS.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}</select></Field></div>
          <div className="g"><Field label="清晰度"><select style={fld} value={eff.quality} onChange={(e) => setS({ ...s, quality: e.target.value })}>{eff.model.qualities.map((q) => <option key={q}>{q}</option>)}</select></Field></div>
          <div className="g"><Field label="时长"><select style={fld} value={eff.duration} onChange={(e) => setS({ ...s, duration: Number(e.target.value) })}>{eff.model.durations.map((d) => <option key={d} value={d}>{d} 秒</option>)}</select></Field></div>
        </div>
        <div className="row">
          <button className="btn p" onClick={save}>保存</button>
          {msg && <span className="mute">{msg}</span>}
        </div>
        <div className="mute">继承顺序：全局默认 → 项目默认 → 分镜单独设置，后面的覆盖前面的。</div>
      </div>
    </>
  );
}
