// 素材多角度图片。图片本身由 lib/demo.js 里的 generateImage 生成（目前是演示占位图）。
// 以后接真实图片模型：改 demo.js 里的 generateImage，并把图片上传到 Supabase Storage，
// 这里只保存链接，不要把大图片直接存进数据库。
import { generateImage } from './demo';

export const ANGLES = {
  character: ['正面', '左侧面', '右侧面', '背面', '全身'],
  scene: ['全景', '广角', '近景', '俯视', '夜景'],
  prop: ['正面', '侧面', '背面', '俯视', '细节特写'],
  costume: ['正面', '侧面', '背面', '细节特写'],
  other: ['正面', '侧面', '背面'],
};

export async function generateAngles({ category, name, description, model, quality }) {
  const angles = ANGLES[category] || ANGLES.other;
  const res = await Promise.all(
    angles.map((a) => generateImage({ prompt: `${name} ${a}`, model, quality }))
  );
  return angles.map((a, i) => ({ angle: a, url: res[i].url, model, quality }));
}

// 演示：AI 自动起名和写描述。以后换成真实文字模型。
export async function suggestAsset({ category, idea }) {
  await new Promise((r) => setTimeout(r, 800));
  return { name: idea.slice(0, 10), description: idea };
}
