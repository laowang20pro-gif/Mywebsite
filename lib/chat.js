import { generateScript } from './demo';

// 语言模型：现在是演示名称。以后接真实文字模型时，在这里换成真实的模型列表。
export const LLM_MODELS = [
  { id: 'llm-a', name: '文字模型 A' },
  { id: 'llm-b', name: '文字模型 B' },
  { id: 'llm-c', name: '文字模型 C' },
];

export const GENRES = [
  { group: '女频', items: ['甜宠恋爱', '霸总豪门', '先婚后爱', '替身虐恋', '重生复仇', '穿越古风', '宫斗宅斗', '真假千金', '闪婚逆袭', '校园青春'] },
  { group: '男频', items: ['都市逆袭', '战神归来', '赘婿翻身', '神医下山', '系统金手指', '重生商战', '修仙玄幻', '末世求生', '武侠江湖', '鉴宝捡漏'] },
  { group: '通用', items: ['悬疑推理', '家庭伦理', '搞笑喜剧', '恐怖惊悚', '科幻', '治愈温情', '民国谍战', '职场'] },
];

const wait = (ms) => new Promise((r) => setTimeout(r, ms));

// 演示：写剧本。以后换成调用你自己的服务器接口（由服务器去调用真实的文字模型）。
export async function writeScript({ idea, genre, model }) {
  return generateScript({ idea, genre });
}

// 演示：按修改意见改剧本，只是在开头标注了意见，内容没有真的修改。
export async function reviseScript({ script, feedback, model }) {
  await wait(1200);
  const base = script.replace(/^【演示修改：[^\n]*】\n\n/, '');
  return `【演示修改：${feedback.slice(0, 40)}】\n\n${base}`;
}
