'use client'

import { useState, useEffect } from 'react'

type Project = {
  id: string
  name: string
  outline: string
  genre: string
  episodes: number
  duration: number
  ratio: string
  style: string
  createdAt: number
}

export default function Dashboard() {
  const [projects, setProjects] = useState<Project[]>([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  
  const [formData, setFormData] = useState({
    name: '',
    outline: '',
    genre: '都市/霸总',
    episodes: 12,
    duration: 60,
    ratio: '9:16',
    style: '赛博朋克'
  })

  useEffect(() => {
    const saved = localStorage.getItem('ai_drama_projects')
    if (saved) setProjects(JSON.parse(saved))
  }, [])

  const handleCreateProject = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name) return alert('请输入项目名称')

    const newProject: Project = {
      id: crypto.randomUUID(),
      name: formData.name,
      outline: formData.outline,
      genre: formData.genre,
      episodes: formData.episodes,
      duration: formData.duration,
      ratio: formData.ratio,
      style: formData.style,
      createdAt: Date.now()
    }

    const updated = [newProject, ...projects]
    setProjects(updated)
    localStorage.setItem('ai_drama_projects', JSON.stringify(updated))
    setIsModalOpen(false)
    setFormData({ name: '', outline: '', genre: '都市/霸总', episodes: 12, duration: 60, ratio: '9:16', style: '赛博朋克' })
  }

  const deleteProject = (id: string) => {
    if(confirm('确认删除该项目吗？')) {
      const updated = projects.filter(p => p.id !== id)
      setProjects(updated)
      localStorage.setItem('ai_drama_projects', JSON.stringify(updated))
    }
  }

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 text-slate-800 font-sans">
      {/* 左侧导航栏 */}
      <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col hidden md:flex shrink-0">
        <div className="h-16 flex items-center px-6 border-b border-slate-800 text-white">
          <span className="text-xl font-bold tracking-wider">🎬 短剧 AI 工作台</span>
        </div>
        
        {/* 醒目提示：免登录 */}
        <div className="mx-4 mt-4 p-3 bg-indigo-500/20 border border-indigo-500/30 rounded-lg text-center">
          <p className="text-xs text-indigo-200">当前状态</p>
          <p className="text-sm font-bold text-white">免登录直接体验</p>
        </div>

        <nav className="flex-1 p-4 space-y-1 mt-2">
          {['项目管理', '素材库', '视频生成', '任务中心', '视频与成片'].map((item, i) => (
            <a key={i} href="#" className={`block px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${i === 0 ? 'bg-indigo-600 text-white' : 'hover:bg-slate-800 hover:text-white'}`}>
              {item}
            </a>
          ))}
        </nav>
      </aside>

      {/* 右侧主内容 */}
      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 shrink-0">
          <h2 className="text-xl font-bold text-slate-800">我的短剧项目</h2>
          <button onClick={() => setIsModalOpen(true)} className="px-5 py-2.5 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-all shadow-sm">
            + 新建项目
          </button>
        </header>

        <div className="flex-1 overflow-y-auto p-8">
          {projects.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400">
              <div className="text-6xl mb-4">🎬</div>
              <p className="text-lg font-medium text-slate-600 mb-2">还没有任何项目</p>
              <p className="text-sm">点击右上角“新建项目”，开始你的 AI 创作</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {projects.map((project) => (
                <div key={project.id} className="bg-white rounded-xl border border-slate-200 overflow-hidden hover:shadow-lg transition-all flex flex-col">
                  <div className="h-44 w-full bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 relative flex items-center justify-center">
                    <span className="text-white/70 text-2xl font-bold">{project.style}</span>
                    <span className="absolute top-3 right-3 bg-black/50 text-white text-xs px-2 py-1 rounded-md">{project.ratio}</span>
                  </div>
                  <div className="p-5 flex-1 flex flex-col">
                    <h3 className="font-bold text-lg text-slate-800 mb-2 truncate">{project.name}</h3>
                    <p className="text-sm text-slate-500 line-clamp-2 mb-4 flex-1">{project.outline || '暂无大纲'}</p>
                    <div className="flex justify-between text-xs text-slate-400 mb-4">
                      <span>{project.genre}</span>
                      <span>{project.episodes}集 · {project.duration}秒</span>
                    </div>
                    <div className="pt-4 border-t border-slate-100 flex justify-between items-center">
                       <button className="text-indigo-600 font-medium text-sm hover:text-indigo-800">进入项目详情 →</button>
                       <button onClick={() => deleteProject(project.id)} className="text-slate-400 hover:text-red-500 text-sm">删除</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* 新建项目弹窗 */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b flex justify-between items-center">
              <h2 className="text-lg font-bold">新建短剧项目</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 text-xl">✕</button>
            </div>
            <form onSubmit={handleCreateProject} className="p-6 overflow-y-auto space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium mb-1">项目名称 *</label>
                  <input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} type="text" className="w-full px-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-indigo-500" placeholder="例如：重生之我在古代做首富" />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium mb-1">故事大纲 / 创意想法</label>
                  <textarea value={formData.outline} onChange={e => setFormData({...formData, outline: e.target.value})} rows={3} className="w-full px-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-indigo-500" placeholder="输入一句话创意..." />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">题材</label>
                  <select value={formData.genre} onChange={e => setFormData({...formData, genre: e.target.value})} className="w-full px-4 py-2 border rounded-lg outline-none">
                    <option>都市/霸总</option>
                    <option>悬疑/推理</option>
                    <option>古装/穿越</option>
                    <option>科幻/赛博</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">视觉风格</label>
                  <select value={formData.style} onChange={e => setFormData({...formData, style: e.target.value})} className="w-full px-4 py-2 border rounded-lg outline-none">
                    <option>真实写实</option>
                    <option>动漫二次元</option>
                    <option>赛博朋克</option>
                    <option>国风水墨</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">总集数</label>
                  <input type="number" value={formData.episodes} onChange={e => setFormData({...formData, episodes: Number(e.target.value)})} className="w-full px-4 py-2 border rounded-lg outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">单集时长(秒)</label>
                  <input type="number" value={formData.duration} onChange={e => setFormData({...formData, duration: Number(e.target.value)})} className="w-full px-4 py-2 border rounded-lg outline-none" />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium mb-1">画面比例</label>
                  <div className="flex gap-4">
                    {['9:16', '16:9', '1:1'].map(ratio => (
                      <label key={ratio} className={`flex-1 text-center py-2 rounded-lg border cursor-pointer text-sm ${formData.ratio === ratio ? 'bg-indigo-50 border-indigo-600 text-indigo-700' : 'bg-slate-50 border-slate-200'}`}>
                        <input type="radio" checked={formData.ratio === ratio} onChange={e => setFormData({...formData, ratio: e.target.value})} className="hidden" />
                        {ratio}
                      </label>
                    ))}
                  </div>
                </div>
              </div>
              <div className="pt-4 border-t flex justify-end gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2 text-sm text-slate-600 border rounded-lg">取消</button>
                <button type="submit" className="px-5 py-2 text-sm text-white bg-indigo-600 rounded-lg">✨ 确认创建</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
