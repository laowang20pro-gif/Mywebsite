export const fld = {
  width: '100%', background: 'var(--bg)', color: 'var(--ink)', border: '1px solid var(--line)',
  borderRadius: 8, padding: '10px 12px', fontSize: 16, fontFamily: 'inherit',
};

export const Field = ({ label, children }) => (
  <label style={{ display: 'grid', gap: 4 }}>
    <span className="mute">{label}</span>
    {children}
  </label>
);

export const CATS = { character: '人物', scene: '场景', prop: '道具', costume: '服装', other: '其他' };
