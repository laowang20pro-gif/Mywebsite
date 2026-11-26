// 演示版规划：只是按剧本里的“第N场”拆成剧集和分镜，不是真实 AI。
// 以后接真实 AI，只需要把这个函数改成调用你自己的服务器接口，
// 返回同样结构的数据：{ name, genre, characters[], scenes[], episodes[{ title, synopsis, scene, shots[{ title, size, content, duration }] }] }

const wait = (ms) => new Promise((r) => setTimeout(r, ms));

export async function planProject(script) {
  await wait(1500);
  const blocks = [...(script.content || '').matchAll(/第(\d+)场[　\s]*([^\n]*)\n(?:画面[：:]([^\n]*))?/g)];
  const mk = (scene, text) => ({
    title: '', synopsis: text, scene,
    shots: [
      { title: '开场镜头', size: '远景', content: text, duration: 5 },
      { title: '主要镜头', size: '中景', content: text, duration: 5 },
    ],
  });
  let episodes = blocks.map((b, i) => {
    const scene = b[2].trim().split(/[　\s]+/).pop() || `场景${i + 1}`;
    return { ...mk(scene, (b[3] || '').trim()), title: `第${i + 1}集 ${scene}` };
  });
  if (!episodes.length) {
    episodes = [1, 2, 3].map((n) => ({ ...mk(`场景${n}`, (script.content || '').slice(0, 60)), title: `第${n}集` }));
  }
  return {
    name: script.title,
    genre: '短剧',
    characters: ['女主', '男主'],
    scenes: [...new Set(episodes.map((e) => e.scene))],
    episodes,
  };
}
