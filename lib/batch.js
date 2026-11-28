import { supabase } from './supabase';
import { resolve, makeVideo, suggestPrompt } from './gen';

// 第一步：读出整部的数据，算出哪些分镜还没有视频（已有视频的不会被覆盖）
export async function prepareBatch(pid) {
  const [p, e, s, a, v, g] = await Promise.all([
    supabase.from('projects').select('*').eq('id', pid).single(),
    supabase.from('episodes').select('id,synopsis').eq('project_id', pid),
    supabase.from('storyboards').select('*').eq('project_id', pid).order('number'),
    supabase.from('assets').select('id,name'),
    supabase.from('video_versions').select('storyboard_id').eq('project_id', pid),
    supabase.from('user_settings').select('settings').maybeSingle(),
  ]);
  const have = new Set((v.data || []).map((x) => x.storyboard_id));
  const shots = (s.data || []).map((x) => ({ ...x, prompt_text: x.prompt_text || x.prompt?.content || '' }));
  return { pid, project: p.data, eps: e.data || [], assets: a.data || [], gs: g.data?.settings || {}, todo: shots.filter((x) => !have.has(x.id)) };
}

// 第二步：每次同时生成 3 个。没有提示词的先自动写一条。返回完成数和失败数。
export async function runBatch(ctx, onProgress) {
  const { pid, project, eps, assets, gs, todo } = ctx;
  let done = 0, failed = 0;
  const one = async (shot) => {
    try {
      let s = shot;
      if (!s.prompt_text.trim()) {
        const names = assets.filter((a) => (s.asset_ids || []).includes(a.id)).map((a) => a.name);
        const t = await suggestPrompt({ title: s.title, synopsis: eps.find((x) => x.id === s.episode_id)?.synopsis, names });
        s = { ...s, prompt_text: t };
        await supabase.from('storyboards').update({ prompt_text: t }).eq('id', s.id);
      }
      const v = await makeVideo(s, resolve(gs, project?.settings || {}, s.gen));
      const { error } = await supabase.from('video_versions').insert({ project_id: pid, storyboard_id: s.id, ...v, is_current: true });
      if (error) throw error;
    } catch (e) {
      failed++;
    }
    done++;
    onProgress?.(done, todo.length);
  };
  for (let i = 0; i < todo.length; i += 3) await Promise.all(todo.slice(i, i + 3).map(one));
  return { done, failed };
}
