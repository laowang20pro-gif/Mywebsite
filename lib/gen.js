import { VIDEO_MODELS, generateVideo } from './demo';

const clean = (o) => Object.fromEntries(Object.entries(o || {}).filter(([, v]) => v !== '' && v != null));
const has = (o, k) => !!o && o[k] !== '' && o[k] != null;
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

// 三级继承：全局默认 → 项目默认 → 分镜单独设置，后面的覆盖前面的。
// 模型不支持的清晰度和时长会自动换成该模型的第一个可选项。
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

// 演示：根据分镜标题、本集梗概和引用的素材拼一条提示词。以后换成真实文字模型。
export async function suggestPrompt({ title, synopsis, names }) {
  await wait(600);
  return [names.join('、'), title, synopsis].filter(Boolean).join('，') + '。电影感画面，光线自然，竖屏。';
}

// 演示：调用 lib/demo.js 的 generateVideo。以后接真实 fal.ai，改 demo.js 里那一个函数即可。
export async function makeVideo(shot, params) {
  const prompt = shot.prompt_text || shot.title || '镜头';
  const r = await generateVideo({ prompt, model: params.model.name, duration: params.duration, quality: params.quality });
  return { url: r.url, model: params.model.name, quality: params.quality, duration: params.duration, prompt };
}
