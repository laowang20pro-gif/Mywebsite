
"use client";

import { useEffect, useState } from "react";
import {
  Plus,
  FolderOpen,
  MoreHorizontal,
  Trash2,
  Clapperboard,
  Clock3,
  Sparkles,
  Search,
  X,
  Film,
  ArrowUpRight
} from "lucide-react";
import AppShell from "@/components/layout/AppShell";

type Project = {
  id: string;
  name: string;
  outline: string;
  genre: string;
  episodes: number;
  duration: string;
  ratio: string;
  style: string;
  createdAt: string;
};

const STORAGE_KEY = "ai_drama_projects";

export default function HomePage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [menuId, setMenuId] = useState<string | null>(null);

  const [form, setForm] = useState({
    name: "",
    outline: "",
    genre: "都市情感",
    episodes: "20",
    duration: "60秒",
    ratio: "9:16",
    style: "电影写实"
  });

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) setProjects(parsed);
      }
    } catch {
      console.error("项目数据读取失败");
    }
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (loaded) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
    }
  }, [projects, loaded]);

  function createProject() {
    if (!form.name.trim()) {
      alert("请填写项目名称");
      return;
    }

    const newProject: Project = {
      id: `project_${Date.now()}`,
      name: form.name.trim(),
      outline: form.outline.trim(),
      genre: form.genre,
      episodes: Number(form.episodes) || 20,
      duration: form.duration,
      ratio: form.ratio,
      style: form.style,
      createdAt: new Date().toISOString()
    };

    setProjects((current) => [newProject, ...current]);
    setForm({
      name: "",
      outline: "",
      genre: "都市情感",
      episodes: "20",
      duration: "60秒",
      ratio: "9:16",
      style: "电影写实"
    });
    setModalOpen(false);
  }

  function deleteProject(id: string) {
    const confirmed = window.confirm(
      "确定删除这个项目吗？删除后无法恢复。"
    );

    if (!confirmed) return;

    setProjects((current) => current.filter((item) => item.id !== id));
    setMenuId(null);
  }

  const filteredProjects = projects.filter((project) => {
    const keyword = search.trim().toLowerCase();
    return (
      project.name.toLowerCase().includes(keyword) ||
      project.genre.toLowerCase().includes(keyword)
    );
  });

  const totalEpisodes = projects.reduce(
    (sum, project) => sum + project.episodes,
    0
  );

  return (
    <AppShell>
      <div className="mx-auto max-w-[1400px]">
        {/* 页面标题 */}
        <div className="mb-8 flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
          <div>
            <div className="mb-2 flex items-center gap-2 text-xs font-medium text-brand">
              <Sparkles size={14} />
              AI CREATIVE WORKSPACE
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 md:text-[28px]">
              项目管理
            </h1>
            <p className="mt-2 text-sm text-slate-500">
              管理你的短剧创作项目，从故事构思到视频成片。
            </p>
          </div>

          <button
            onClick={() => setModalOpen(true)}
            className="flex h-11 items-center justify-center gap-2 rounded-lg bg-brand px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-dark"
          >
            <Plus size={18} />
            新建项目
          </button>
        </div>

        {/* 数据概览 */}
        <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="panel p-5">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-500">我的项目</span>
              <div className="rounded-lg bg-indigo-50 p-2 text-brand">
                <FolderOpen size={18} />
              </div>
            </div>
            <div className="mt-4 text-3xl font-bold tabular-nums text-slate-900">
              {projects.length}
            </div>
            <div className="mt-1 text-xs text-slate-400">当前创建的项目数量</div>
          </div>

          <div className="panel p-5">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-500">规划剧集</span>
              <div className="rounded-lg bg-blue-50 p-2 text-blue-600">
                <Clapperboard size={18} />
              </div>
            </div>
            <div className="mt-4 text-3xl font-bold tabular-nums text-slate-900">
              {totalEpisodes}
            </div>
            <div className="mt-1 text-xs text-slate-400">项目设定的剧集总数</div>
          </div>

          <div className="panel p-5">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-500">创作模式</span>
              <div className="rounded-lg bg-amber-50 p-2 text-amber-600">
                <Film size={18} />
              </div>
            </div>
            <div className="mt-4 text-xl font-bold text-slate-900">
              AI 短剧创作
            </div>
            <div className="mt-2 text-xs text-slate-400">项目数据暂存在本地浏览器</div>
          </div>
        </div>

        {/* 项目列表标题 */}
        <div className="mb-5 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h2 className="text-lg font-bold text-slate-900">全部项目</h2>
            <p className="mt-1 text-xs text-slate-400">
              共 {projects.length} 个项目
            </p>
          </div>

          <div className="flex h-10 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 sm:w-[260px]">
            <Search size={16} className="text-slate-400" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="搜索项目名称或题材"
              className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400"
            />
          </div>
        </div>

        {/* 项目列表 */}
        {!loaded ? (
          <div className="panel p-12 text-center text-sm text-slate-400">
            正在加载项目...
          </div>
        ) : filteredProjects.length === 0 ? (
          <div className="panel flex min-h-[320px] flex-col items-center justify-center px-5 py-12 text-center">
            <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-light text-brand">
              {search ? <Search size={28} /> : <FolderOpen size={28} />}
            </div>

            <h3 className="text-base font-semibold text-slate-900">
              {search ? "没有找到匹配的项目" : "还没有创作项目"}
            </h3>

            <p className="mt-2 max-w-sm text-sm leading-6 text-slate-400">
              {search
                ? "试试其他关键词，或者清空搜索内容。"
                : "创建你的第一个短剧项目，开始规划故事、人物、剧集和分镜。"}
            </p>

            {!search && (
              <button
                onClick={() => setModalOpen(true)}
                className="mt-6 flex h-10 items-center gap-2 rounded-lg bg-brand px-4 text-sm font-semibold text-white transition hover:bg-brand-dark"
              >
                <Plus size={17} />
                创建第一个项目
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filteredProjects.map((project) => (
              <div
                key={project.id}
                className="panel group relative p-5 transition hover:-translate-y-0.5 hover:shadow-soft"
              >
                <div className="mb-4 flex items-start justify-between">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-light text-brand">
                    <Film size={21} />
                  </div>

                  <div className="relative">
                    <button
                      onClick={() =>
                        setMenuId(menuId === project.id ? null : project.id)
                      }
                      className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                      aria-label="项目操作"
                    >
                      <MoreHorizontal size={19} />
                    </button>

                    {menuId === project.id && (
                      <div className="absolute right-0 top-10 z-20 w-36 rounded-lg border border-slate-200 bg-white p-1 shadow-lg">
                        <button
                          onClick={() => deleteProject(project.id)}
                          className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50"
                        >
                          <Trash2 size={15} />
                          删除项目
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <h3 className="truncate text-base font-bold text-slate-900">
                  {project.name}
                </h3>

                <p className="mt-2 min-h-[40px] text-sm leading-5 text-slate-500">
                  {project.outline || "暂未填写故事大纲"}
                </p>

                <div className="mt-4 flex flex-wrap gap-2">
                  <span className="rounded-md bg-slate-100 px-2 py-1 text-xs text-slate-600">
                    {project.genre}
                  </span>
                  <span className="rounded-md bg-slate-100 px-2 py-1 text-xs text-slate-600">
                    {project.episodes} 集
                  </span>
                  <span className="rounded-md bg-slate-100 px-2 py-1 text-xs text-slate-600">
                    {project.ratio}
                  </span>
                </div>

                <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4">
                  <div className="flex items-center gap-1.5 text-xs text-slate-400">
                    <Clock3 size={13} />
                    {new Date(project.createdAt).toLocaleDateString("zh-CN")}
                  </div>

                  <button
                    onClick={() =>
                      alert("项目详情页面将在后续开发批次中接入。")
                    }
                    className="flex items-center gap-1 text-xs font-semibold text-brand hover:text-brand-dark"
                  >
                    进入项目
                    <ArrowUpRight size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 新建项目弹窗 */}
      {modalOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/40 p-4">
          <div className="max-h-[90vh] w-full max-w-[600px] overflow-y-auto rounded-2xl bg-white shadow-2xl">
            <div className="sticky top-0 flex items-center justify-between border-b border-slate-100 bg-white px-6 py-5">
              <div>
                <h2 className="text-lg font-bold text-slate-900">新建项目</h2>
                <p className="mt-1 text-xs text-slate-400">
                  创建你的短剧创作项目
                </p>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-100"
                aria-label="关闭弹窗"
              >
                <X size={19} />
              </button>
            </div>

            <div className="space-y-5 p-6">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  项目名称 <span className="text-red-500">*</span>
                </label>
                <input
                  value={form.name}
                  onChange={(event) =>
                    setForm({ ...form, name: event.target.value })
                  }
                  placeholder="例如：重生之商业女王"
                  className="input-field"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  故事大纲
                </label>
                <textarea
                  value={form.outline}
                  onChange={(event) =>
                    setForm({ ...form, outline: event.target.value })
                  }
                  placeholder="简单描述你的短剧故事、人物关系和核心冲突..."
                  rows={4}
                  className="input-field resize-y"
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    题材
                  </label>
                  <select
                    value={form.genre}
                    onChange={(event) =>
                      setForm({ ...form, genre: event.target.value })
                    }
                    className="input-field"
                  >
                    {["都市情感", "豪门恩怨", "悬疑推理", "古装玄幻", "甜宠爱情", "逆袭复仇", "科幻未来", "其他"].map((item) => (
                      <option key={item}>{item}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    预计集数
                  </label>
                  <select
                    value={form.episodes}
                    onChange={(event) =>
                      setForm({ ...form, episodes: event.target.value })
                    }
                    className="input-field"
                  >
                    {["10", "20", "30", "40", "50", "60", "80", "100"].map((item) => (
                      <option key={item} value={item}>{item} 集</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    单集时长
                  </label>
                  <select
                    value={form.duration}
                    onChange={(event) =>
                      setForm({ ...form, duration: event.target.value })
                    }
                    className="input-field"
                  >
                    {["30秒", "60秒", "90秒", "120秒", "180秒"].map((item) => (
                      <option key={item}>{item}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    视频比例
                  </label>
                  <select
                    value={form.ratio}
                    onChange={(event) =>
                      setForm({ ...form, ratio: event.target.value })
                    }
                    className="input-field"
                  >
                    <option>9:16</option>
                    <option>16:9</option>
                    <option>1:1</option>
                    <option>4:3</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    视觉风格
                  </label>
                  <select
                    value={form.style}
                    onChange={(event) =>
                      setForm({ ...form, style: event.target.value })
                    }
                    className="input-field"
                  >
                    {["电影写实", "动漫风格", "3D动画", "国风", "赛博朋克", "水墨风格"].map((item) => (
                      <option key={item}>{item}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">
                <button
                  onClick={() => setModalOpen(false)}
                  className="h-10 rounded-lg border border-slate-200 px-5 text-sm font-medium text-slate-600 hover:bg-slate-50"
                >
                  取消
                </button>
                <button
                  onClick={createProject}
                  className="flex h-10 items-center justify-center gap-2 rounded-lg bg-brand px-5 text-sm font-semibold text-white hover:bg-brand-dark"
                >
                  <Plus size={16} />
                  创建项目
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}


