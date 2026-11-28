'use client';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';

export const FONTS = {
  hei: '"PingFang SC","Microsoft YaHei",sans-serif',
  song: '"Songti SC","Noto Serif SC",SimSun,serif',
  kai: '"Kaiti SC",KaiTi,STKaiti,serif',
  round: '"Yuanti SC","Hiragino Maru Gothic ProN","Microsoft YaHei",sans-serif',
};
const DEF_ASPECT = { hero: '16:9', banner: '4:1', carousel: '16:9', video: '16:9' };
const ALIGN = { t: 'flex-start', m: 'center', b: 'flex-end', l: 'flex-start', c: 'center', r: 'flex-end' };
const fill = { position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' };
const isVideo = (u) => /\.(mp4|webm|mov)(\?|$)/i.test(u || '');
const ratio = (a) => { const [w, h] = String(a).split(':').map(Number); return w && h ? `${w} / ${h}` : '16 / 9'; };
const layer = (p) => ({ position: 'absolute', inset: 0, display: 'flex', padding: '5%', alignItems: ALIGN[p[0]], justifyContent: ALIGN[p[1]], pointerEvents: 'none' });

// 单个广告：背景（图片或静音循环视频）+ 遮罩 + 文字 + 按钮。文字大小随广告宽度缩放，手机上自动变小。
export function Ad({ ad }) {
  const c = ad.config || {};
  const tp = c.text_pos || 'bl', bp = c.btn_pos || 'br';
  const size = (c.font_size || 28) / 6;
  const url = ad.media_url;
  const solid = (c.btn_style || 'solid') === 'solid';
  const col = c.btn_color || '#6366f1';
  const btnStyle = {
    pointerEvents: 'auto', textDecoration: 'none', padding: '0.5em 1.2em', fontWeight: 600,
    fontSize: `max(13px, ${size * 0.6}cqw)`, borderRadius: c.btn_radius ?? 999,
    background: solid ? col : 'transparent', color: solid ? '#fff' : col, border: `2px solid ${col}`,
  };
  const link = ad.btn_link || '';
  return (
    <div style={{ position: 'relative', width: '100%', aspectRatio: ratio(c.aspect || DEF_ASPECT[ad.style]), borderRadius: c.radius ?? 12, overflow: 'hidden', background: 'linear-gradient(135deg,#312e81,#0f172a)', containerType: 'inline-size' }}>
      {url && (ad.style === 'video' || isVideo(url)
        ? <video src={url} autoPlay muted loop playsInline preload="metadata" style={fill} />
        : <img src={url} alt="" style={fill} />)}
      {c.overlay > 0 && <div style={{ position: 'absolute', inset: 0, background: c.overlay_color || '#000', opacity: c.overlay / 100 }} />}
      {(ad.title || ad.subtitle) && (
        <div style={layer(tp)}>
          <div style={{ maxWidth: '70%', textAlign: tp[1] === 'r' ? 'right' : tp[1] === 'c' ? 'center' : 'left', fontFamily: FONTS[c.font] || FONTS.hei, color: c.color || '#fff', textShadow: c.shadow === false ? 'none' : '0 1px 6px rgba(0,0,0,.6)' }}>
            {ad.title && <div style={{ fontSize: `max(16px, ${size}cqw)`, lineHeight: 1.25, fontWeight: c.bold === false ? 400 : 700 }}>{ad.title}</div>}
            {ad.subtitle && <div style={{ fontSize: `max(12px, ${size * 0.55}cqw)`, marginTop: '0.4em', opacity: 0.92 }}>{ad.subtitle}</div>}
          </div>
        </div>
      )}
      {ad.btn_text && (
        <div style={layer(bp)}>
          {link.startsWith('/')
            ? <Link href={link} style={btnStyle}>{ad.btn_text}</Link>
            : <a href={link || '#'} target="_blank" rel="noopener noreferrer" style={btnStyle}>{ad.btn_text}</a>}
        </div>
      )}
    </div>
  );
}

// 卡片轮播：自动切换，可左右滑，下面有小圆点
export function Carousel({ ads }) {
  const [i, setI] = useState(0);
  const x0 = useRef(null);
  const n = ads.length;
  useEffect(() => {
    if (n < 2) return;
    const t = setTimeout(() => setI((v) => (v + 1) % n), 4000);
    return () => clearTimeout(t);
  }, [i, n]);
  const go = (d) => setI((v) => (v + d + n) % n);
  return (
    <div>
      <div style={{ overflow: 'hidden', borderRadius: 12, touchAction: 'pan-y' }}
        onTouchStart={(e) => { x0.current = e.touches[0].clientX; }}
        onTouchEnd={(e) => { if (x0.current == null) return; const dx = e.changedTouches[0].clientX - x0.current; if (Math.abs(dx) > 40) go(dx < 0 ? 1 : -1); x0.current = null; }}>
        <div style={{ display: 'flex', transform: `translateX(-${i * 100}%)`, transition: 'transform .4s' }}>
          {ads.map((a) => <div key={a.id} style={{ flex: '0 0 100%' }}><Ad ad={a} /></div>)}
        </div>
      </div>
      {n > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 8 }}>
          {ads.map((a, k) => <button key={a.id} aria-label={`第${k + 1}张`} onClick={() => setI(k)} style={{ width: 8, height: 8, borderRadius: 4, border: 0, padding: 0, cursor: 'pointer', background: k === i ? 'var(--acc)' : 'var(--line)' }} />)}
        </div>
      )}
    </div>
  );
}

// 把所有上架的广告按顺序排出来；所有“卡片轮播”合并成一个轮播，放在第一张的位置
export function Ads({ ads }) {
  const blocks = [];
  let car = null;
  [...ads].sort((a, b) => a.sort - b.sort).forEach((a) => {
    if (a.style === 'carousel') {
      if (!car) { car = { key: 'carousel', list: [] }; blocks.push(car); }
      car.list.push(a);
    } else blocks.push({ key: a.id, ad: a });
  });
  return (
    <div style={{ display: 'grid', gap: 16 }}>
      {blocks.map((b) => (b.list ? <Carousel key={b.key} ads={b.list} /> : <Ad key={b.key} ad={b.ad} />))}
    </div>
  );
}
