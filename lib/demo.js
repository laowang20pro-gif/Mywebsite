// 演示模式：下面三个 generate 函数返回的都是模拟结果。
// 以后接真实接口，只需要把这三个函数改成调用你自己的服务器接口，页面不用动。
// 真实版本应当要求登录，并在生成前检查积分或次数限制。

export const DEMO = true;

export const IMAGE_MODELS = [
  { id: 'img-a', name: '图片模型 A', qualities: ['标准', '高清'] },
  { id: 'img-b', name: '图片模型 B', qualities: ['标准', '高清', '超清'] },
];

export const VIDEO_MODELS = [
  { id: 'vid-a', name: '视频模型 A', durations: [5, 10], qualities: ['480p', '720p'] },
  { id: 'vid-b', name: '视频模型 B', durations: [5], qualities: ['720p', '1080p'] },
];

const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const esc = (s) => String(s).replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));

function poster(title, sub) {
  const t = esc(title.length > 22 ? title.slice(0, 22) + '…' : title);
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="360"><defs>` +
    `<linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#312e81"/><stop offset="1" stop-color="#0f172a"/></linearGradient></defs>` +
    `<rect width="640" height="360" fill="url(#g)"/>` +
    `<text x="320" y="170" fill="#e5e7eb" font-size="24" text-anchor="middle">${t}</text>` +
    `<text x="320" y="205" fill="#8b95a5" font-size="14" text-anchor="middle">${esc(sub)}</text></svg>`;
  return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
}

export async function generateScript({ idea, genre }) {
  await wait(1200);
  return (
    `《${idea.slice(0, 12)}》（${genre || '短剧'}）\n\n` +
    `【演示文本，不是真实 AI 生成】\n\n` +
    `第1场　清晨　主角家中\n画面：${idea}\n对白：（开场独白）……\n\n` +
    `第2场　白天　公司\n画面：矛盾出现，主角被迫做出选择。\n对白：……\n\n` +
    `第3场　夜晚　街头\n画面：反转出现，留下悬念。\n对白：……\n`
  );
}

export async function generateImage({ prompt, model, quality }) {
  await wait(1200);
  return { url: poster(prompt, `演示图片 · ${model} · ${quality}`) };
}

export async function generateVideo({ prompt, model, duration, quality }) {
  await wait(1800);
  return { url: poster(prompt, `演示视频（无真实视频）· ${model} · ${duration}秒 · ${quality}`) };
}
