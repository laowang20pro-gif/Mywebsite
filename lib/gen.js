import { VIDEO_MODELS, generateVideo } from './demo';

const clean = (o) => Object.fromEntries(Object.entries(o || {}).filter(([, v]) => v !== '' && v != null));
const has = (o, k) => !!o && o[k] !== '' && o[k] != null;

// 三级继承：全局默认 → 项目默认 → 分镜单独设置，后面的覆盖前面的。
// 模型不支持的清晰度和时长会自动换成该模型的第一个可选项，不会提交不支持的参数。
export function resolve(g, p, s) {
  const x = { model: VIDEO_MODELS[0].id, ...clean(g), ...clean(p), ...clean(s) };
  const model = VIDEO_MODELS.find((m) => m.id === x.model) || VIDEO_MODELS[0];
  return {
    model,
    quality: model.qualities.includes(x.quality) ? x.quality : model.qualities[0],
    duration: model.durations.includes(x.duration) ? x.duration : model.durations[0],
  };
}

export const source = (k, g, p, s) => (has(s, k) ? '分镜' : has(p, k) ? '项目' : has(g, k) ? '全局' : '默认');

const ORDER = ['content', 'action', 'scene', 'camera', 'size', 'light', 'style'];
export function composePrompt(pr = {}) {
  const main = ORDER.map((k) => pr[k]).filter(Boolean).join('，');
  return pr.neg ? `${main}。避免：${pr.neg}` : main;
}

// 演示：调用 lib/demo.js 的 generateVideo。以后接真实 fal.ai 时，改 demo.js 里那一个函数即可。
export async function makeVideo(shot, params) {
  const prompt = composePrompt(shot.prompt) || shot.title || '镜头';
  const r = await generateVideo({ prompt, model: params.model.name, duration: params.duration, quality: params.quality });
  return { url: r.url, model: params.model.name, quality: params.quality, duration: params.duration, prompt };
}
