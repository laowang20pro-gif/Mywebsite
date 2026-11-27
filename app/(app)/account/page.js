'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../lib/auth';
import { fld, Field } from '../../../lib/ui';

const TYPES = { recharge: '充值', video: '视频生成消费', image: '图片生成消费', plan: 'AI 规划消费', refund: '任务失败退款', gift: '管理员赠送', reward: '活动奖励', adjust: '人工调整', other: '其他' };
const TABS = [['acct', '积分账户'], ['topup', '充值中心'], ['log', '积分明细'], ['sec', '账号安全']];

export default function AccountPage() {
  const { user, ready, requireLogin } = useAuth();
  const [tab, setTab] = useState('acct');
  const [acct, setAcct] = useState(null);
  const [pk, setPk] = useState([]);
  const [tx, setTx] = useState([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [type, setType] = useState('');
  const [pw, setPw] = useState('');
  const [msg, setMsg] = useState('');

  useEffect(() => {
    if (!ready || !user) return;
    (async () => {
      const [a, p, t, ad] = await Promise.all([
        supabase.from('credit_accounts').select('*').eq('user_id', user.id).maybeSingle(),
        supabase.from('credit_packages').select('*').eq('active', true).order('sort').order('price_cents'),
        supabase.from('credit_transactions').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(200),
        supabase.from('admins').select('user_id').maybeSingle(),
      ]);
      setAcct(a.data); setPk(p.data || []); setTx(t.data || []); setIsAdmin(!!ad.data);
    })();
  }, [user, ready]);

  async function changePw() {
    const { error } = await supabase.auth.updateUser({ password: pw });
    setMsg(error ? error.message : '密码已修改'); if (!error) setPw('');
  }

  if (ready && !user) {
    return (
      <>
        <h1>个人中心</h1>
        <div className="card row" style={{ marginTop: 16 }}>
          <div className="g mute">登录后可以查看积分和账号信息。</div>
          <button className="btn p" onClick={() => requireLogin()}>登录 / 注册</button>
        </div>
      </>
    );
  }

  const shownTx = tx.filter((x) => !type || x.type === type);

  return (
    <>
      <h1>个人中心</h1>
      <div className="mute">{user?.email}</div>
      <div className="row" style={{ marginTop: 12 }}>
        {TABS.map(([k, v]) => <button key={k} className={'btn' + (tab === k ? ' p' : '')} onClick={() => { setTab(k); setMsg(''); }}>{v}</button>)}
      </div>

      {tab === 'acct' && (
        <div className="card" style={{ marginTop: 16, display: 'grid', gap: 12 }}>
          <div><div className="mute">当前可用积分</div><div style={{ fontSize: 40, fontWeight: 700 }}>{acct?.balance ?? 0}</div></div>
          <div className="row">
            <div className="g"><div className="mute">累计充值</div><b>{acct?.total_recharged ?? 0}</b></div>
            <div className="g"><div className="mute">累计消费</div><b>{acct?.total_spent ?? 0}</b></div>
          </div>
          <div className="row"><button className="btn p" onClick={() => setTab('topup')}>去充值</button>
            {isAdmin && <Link href="/admin" className="btn">进入管理后台</Link>}</div>
          <div className="mute">目前生成功能是演示模式，不会扣积分。真实生成接入后才会按规则扣费，失败自动退款，并留下流水。</div>
        </div>
      )}

      {tab === 'topup' && (
        <div style={{ marginTop: 16, display: 'grid', gap: 12 }}>
          <div className="card mute"><span className="tag">支付未接入</span> 支付功能还没有接入，现在不能充值。接入后，只有支付平台确认付款成功才会加积分。</div>
          {pk.length === 0 && <div className="empty">管理员还没有设置充值套餐。</div>}
          <div className="grid" style={{ marginTop: 0 }}>
            {pk.map((p) => (
              <div key={p.id} className="card" style={{ display: 'grid', gap: 6 }}>
                <h3>{p.name}</h3>
                <div style={{ fontSize: 24, fontWeight: 700 }}>¥{(p.price_cents / 100).toFixed(2)}</div>
                <div className="mute">获得 {p.credits} 积分{p.bonus ? `，赠送 ${p.bonus}` : ''}，到账 {p.credits + p.bonus}</div>
                <button className="btn" disabled>暂不能充值</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'log' && (
        <div style={{ marginTop: 16, display: 'grid', gap: 8 }}>
          <select style={fld} value={type} onChange={(e) => setType(e.target.value)}>
            <option value="">全部类型</option>
            {Object.entries(TYPES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
          {shownTx.length === 0 && <div className="empty">还没有积分记录。</div>}
          {shownTx.map((x) => (
            <div key={x.id} className="card row">
              <div className="g">
                <b>{TYPES[x.type] || x.type}</b>
                <div className="mute">{new Date(x.created_at).toLocaleString('zh-CN')}{x.note ? ` · ${x.note}` : ''}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <b style={{ color: x.amount > 0 ? '#34d399' : 'var(--danger)' }}>{x.amount > 0 ? '+' : ''}{x.amount}</b>
                <div className="mute">余额 {x.balance_after}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'sec' && (
        <div className="card" style={{ marginTop: 16, display: 'grid', gap: 10 }}>
          <Field label="修改密码（至少 6 位）"><input style={fld} type="password" value={pw} onChange={(e) => setPw(e.target.value)} placeholder="新密码" /></Field>
          <div className="row">
            <button className="btn p" disabled={pw.length < 6} onClick={changePw}>修改密码</button>
            <button className="btn" onClick={() => supabase.auth.signOut()}>退出登录</button>
          </div>
          {msg && <div className="mute">{msg}</div>}
        </div>
      )}
    </>
  );
}
