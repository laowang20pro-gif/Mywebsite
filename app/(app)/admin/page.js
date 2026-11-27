'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../lib/auth';
import { fld, Field } from '../../../lib/ui';

function PkgRow({ p, onSave, onDelete }) {
  const [d, setD] = useState({ name: p.name, price: p.price_cents / 100, credits: p.credits, bonus: p.bonus, active: p.active });
  const set = (k) => (e) => setD({ ...d, [k]: e.target.value });
  return (
    <div className="card" style={{ display: 'grid', gap: 8 }}>
      <div className="row">
        <div className="g"><Field label="套餐名称"><input style={fld} value={d.name} onChange={set('name')} /></Field></div>
        <div className="g"><Field label="价格（元）"><input style={fld} type="number" min="0" step="0.01" value={d.price} onChange={set('price')} /></Field></div>
      </div>
      <div className="row">
        <div className="g"><Field label="获得积分"><input style={fld} type="number" min="0" value={d.credits} onChange={set('credits')} /></Field></div>
        <div className="g"><Field label="赠送积分"><input style={fld} type="number" min="0" value={d.bonus} onChange={set('bonus')} /></Field></div>
        <div className="g"><Field label="状态"><select style={fld} value={d.active ? '1' : '0'} onChange={(e) => setD({ ...d, active: e.target.value === '1' })}><option value="1">上架</option><option value="0">下架</option></select></Field></div>
      </div>
      <div className="row">
        <button className="btn p" onClick={() => onSave({ name: d.name, price_cents: Math.round(Number(d.price) * 100), credits: Number(d.credits), bonus: Number(d.bonus), active: d.active })}>保存</button>
        <button className="btn d" onClick={onDelete}>删除</button>
      </div>
    </div>
  );
}

export default function AdminPage() {
  const { user, ready, requireLogin } = useAuth();
  const [ok, setOk] = useState(undefined);
  const [tab, setTab] = useState('users');
  const [users, setUsers] = useState([]);
  const [bal, setBal] = useState({});
  const [pk, setPk] = useState([]);
  const [adj, setAdj] = useState(null);
  const [form, setForm] = useState({ amount: '', type: 'gift', note: '' });
  const [msg, setMsg] = useState('');

  async function load() {
    const { data: a } = await supabase.from('admins').select('user_id').maybeSingle();
    if (!a) return setOk(false);
    setOk(true);
    const [u, c, p] = await Promise.all([
      supabase.from('profiles').select('id,nickname,created_at').order('created_at', { ascending: false }),
      supabase.from('credit_accounts').select('user_id,balance'),
      supabase.from('credit_packages').select('*').order('sort').order('price_cents'),
    ]);
    setUsers(u.data || []);
    setBal(Object.fromEntries((c.data || []).map((x) => [x.user_id, x.balance])));
    setPk(p.data || []);
  }
  useEffect(() => {
    if (!ready) return;
    if (user) load(); else setOk(false);
  }, [user, ready]);

  async function adjust() {
    const amount = parseInt(form.amount, 10);
    if (!amount) return setMsg('请填写不为 0 的整数');
    const { error } = await supabase.rpc('admin_adjust_credits', { p_user: adj, p_amount: amount, p_type: form.type, p_note: form.note });
    setMsg(error ? error.message : '已调整，并留下了流水记录');
    if (!error) { setAdj(null); setForm({ amount: '', type: 'gift', note: '' }); load(); }
  }
  const run = async (p) => { const { error } = await p; setMsg(error ? error.message : ''); load(); };

  if (ok === undefined) return <div className="empty">加载中…</div>;
  if (!ok) {
    return (
      <div className="empty">
        你没有管理员权限。{!user && <div style={{ marginTop: 12 }}><button className="btn p" onClick={() => requireLogin()}>登录</button></div>}
      </div>
    );
  }

  return (
    <>
      <div className="row"><Link href="/account" className="btn">返回个人中心</Link><h1 className="g">管理后台</h1></div>
      <div className="row" style={{ marginTop: 12 }}>
        <button className={'btn' + (tab === 'users' ? ' p' : '')} onClick={() => setTab('users')}>用户与积分</button>
        <button className={'btn' + (tab === 'pk' ? ' p' : '')} onClick={() => setTab('pk')}>充值套餐</button>
      </div>
      {msg && <p className="mute">{msg}</p>}

      {tab === 'users' && (
        <div style={{ display: 'grid', gap: 8, marginTop: 16 }}>
          {adj && (
            <div className="card" style={{ display: 'grid', gap: 8 }}>
              <h3>调整积分：{users.find((x) => x.id === adj)?.nickname}</h3>
              <div className="row">
                <div className="g"><Field label="变动积分（扣减填负数）"><input style={fld} type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} /></Field></div>
                <div className="g"><Field label="类型"><select style={fld} value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}><option value="gift">管理员赠送</option><option value="adjust">人工调整</option><option value="reward">活动奖励</option><option value="other">其他</option></select></Field></div>
              </div>
              <Field label="原因（必填，会记录）"><input style={fld} value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} /></Field>
              <div className="row"><button className="btn p" onClick={adjust}>确认调整</button><button className="btn" onClick={() => setAdj(null)}>取消</button></div>
            </div>
          )}
          <div className="mute">共 {users.length} 个用户</div>
          {users.map((u) => (
            <div key={u.id} className="card row">
              <div className="g"><b>{u.nickname || '未命名'}</b><div className="mute">{new Date(u.created_at).toLocaleDateString('zh-CN')} 注册 · 积分 {bal[u.id] ?? 0}</div></div>
              <button className="btn" onClick={() => { setAdj(u.id); setMsg(''); }}>调整积分</button>
            </div>
          ))}
        </div>
      )}

      {tab === 'pk' && (
        <div style={{ display: 'grid', gap: 12, marginTop: 16 }}>
          <button className="btn p" onClick={() => run(supabase.from('credit_packages').insert({ name: '新套餐', sort: pk.length }))}>新增套餐</button>
          {pk.length === 0 && <div className="empty">还没有套餐。</div>}
          {pk.map((p) => (
            <PkgRow key={p.id} p={p}
              onSave={(d) => run(supabase.from('credit_packages').update(d).eq('id', p.id))}
              onDelete={() => confirm(`确定删除“${p.name}”？`) && run(supabase.from('credit_packages').delete().eq('id', p.id))} />
          ))}
        </div>
      )}
    </>
  );
}
