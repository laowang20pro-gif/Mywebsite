import { fld, Field } from './ui';
import { VIDEO_MODELS } from './demo';

// value：这一级单独设置的值；eff：最终生效的参数（用来决定可选项）；onChange：传出改动的那一项
export function Pickers({ value, eff, onChange }) {
  const m = eff.model;
  const ph = <option value="">跟随上级</option>;
  return (
    <div className="row">
      <div className="g"><Field label="模型"><select style={fld} value={value.model || ''} onChange={(e) => onChange({ model: e.target.value })}>{ph}{VIDEO_MODELS.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}</select></Field></div>
      <div className="g"><Field label="清晰度"><select style={fld} value={value.quality || ''} onChange={(e) => onChange({ quality: e.target.value })}>{ph}{m.qualities.map((q) => <option key={q}>{q}</option>)}</select></Field></div>
      <div className="g"><Field label="时长"><select style={fld} value={value.duration || ''} onChange={(e) => onChange({ duration: e.target.value ? Number(e.target.value) : '' })}>{ph}{m.durations.map((d) => <option key={d} value={d}>{d} 秒</option>)}</select></Field></div>
    </div>
  );
}
