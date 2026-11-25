'use client'

import { useState, useEffect } from 'react'

// 定义项目数据类型（严格遵循你的需求）
type Project = {
  id: string
  name: string
  outline: string
  genre: string
  episodes: number
  duration: number
  ratio: string
  style: string
  cover: string
  createdAt: number
}

export default function Dashboard() {
  const [projects, setProjects] = useState<Project[]>([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  
  // 新建项目表单状态
  const [formData, setFormData] = useState({
    name: '',
    outline: '',
    genre: '都市/霸总',
    episodes: 12,
    duration: 60,
    ratio: '9:16',
    style: '赛博朋克'
  })

  // 页面加载时，从本地读取项目（免登录体验核心）
  useEffect(() => {
    const saved = localStorage.getItem('ai_drama_projects')
    if (saved) {
      setProjects(JSON.parse(saved))
    }
  }, [])

  // 新建项目逻辑
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
      cover: `https://images.unsplash.com/photo-${1550000000000 + Math.floor(Math.random()*100000)}?q=80&w=600&auto=format&fit=crop`, // 临时随机图
      createdAt: Date.now()
    }

    const updatedProjects = [newProject, ...projects]
    setProjects(updatedProjects)
    localStorage.setItem('ai_drama_projects', JSON.stringify(updatedProjects))
    setIsModalOpen(false)
    // 重置表单
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
      {/* 左侧导航栏（严格遵循你的需求文档） */}
      <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col hidden md:flex shrink-0">
        <div className="h-16 flex items-center px-6 border-b border-slate-800 text-white">
          <span className="text-xl font-bold tracking-wider">🎬 ShortDrama AI</span>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {[
            { name: '项目管理', active: true },
            { name: '素材库', active: false },
            { name: '视频生成', active: false },
            { name: '任务中心', active: false },
            { name: '视频与成片', active: false },
            { name: '个人中心', active: false },
            { name: '设置', active: false }
          ].map((item, i) => (
            <a key={i} href="#" className={`block px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${item.active ? 'bg-indigo-600 text-white' : 'hover:bg-slate-800 hover:text-white'}`}>
              {item.name}
            </a>
          ))}
        </nav>
      </aside>

      {/* 右侧主内容 */}
      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 shrink-0">
          <h2 className="text-xl font-bold text-slate-800">项目管理</h2>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="px-5 py-2.5 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-all shadow-sm flex items-center gap-2"
          >
            <span>+</span> 新建项目
          </button>
        </header>

        <div className="flex-1 overflow-y-auto p-8">
          {projects.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400">
              <div className="text-6xl mb-4">🎬</div>
              <p className="text-lg font-medium text-slate-600 mb-2">还没有任何项目</p>
              <p className="text-sm">点击右上角“新建项目”，从一句创意开始你的 AI 短剧创作。</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {projects.map((project) => (
                <div key={project.id} className="bg-white rounded-xl border border-slate-200 overflow-hidden hover:shadow-lg transition-all group flex flex-col">
                  <div className="h-44 w-full bg-slate-200 relative overflow-hidden">
                     {/* 用渐变色代替封面，显得更高级 */}
                    <div className="absolute inset-0 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 opacity-80"></div>
                    <div className="absolute inset-0 flex items-center justify-center text-white/50 text-4xl font-bold tracking-widest">
                      {project.style}
                    </div>
                    <div className="absolute top-3 right-3 bg-black/60 text-white text-xs px-2.5 py-1 rounded-full backdrop-blur-md">
                      {project.ratio}
                    </div>
                  </div>
                  <div className="p-5 flex-1 flex flex-col">
                    <h3 className="font-bold text-lg text-slate-800 mb-2 truncate">{project.name}</h3>
                    <p className="text-sm text-slate-500 line-clamp-2 mb-4 flex-1">
                      {project.outline || '暂无大纲，进入项目由 AI 辅助生成...'}
                    </p>
                    <div className="flex items-center justify-between text-xs text-slate-400 mb-4">
                      <span>题材：{project.genre}</span>
                      <span>{project.episodes}集 · {project.duration}秒/集</span>
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

      {/* 新建项目弹窗（严格遵循你的需求文档） */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h2 className="text-lg font-bold text-slate-800">新建短剧项目</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-700 text-xl">✕</button>
            </div>
            
            <form onSubmit={handleCreateProject} className="p-6 overflow-y-auto flex-1 space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">项目名称 <span className="text-red-500">*</span></label>
                  <input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} type="text" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none" placeholder="例如：重生之我在古代做首富" />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">故事大纲 / 创意想法</label>
                  <textarea value={formData.outline} onChange={e => setFormData({...formData, outline: e.target.value})} rows={3} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none" placeholder="输入一句话创意，或者详细的剧本大纲..." />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">题材类型</label>
                  <select value={formData.genre} onChange={e => setFormData({...formData, genre: e.target.value})} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none">
                    <option>都市/霸总</option>
                    <option>悬疑/推理</option>
                    <option>古装/穿越</option>
                    <option>科幻/赛博</option>
                    <option>甜宠/虐恋</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">视觉风格</label>
                  <select value={formData.style} onChange={e => setFormData({...formData, style: e.target.value})} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none">
                    <option>真实写实</option>
                    <option>动漫二次元</option>
                    <option>赛博朋克</option>
                    <option>国风水墨</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">总集数</label>
                  <input type="number" value={formData.episodes} onChange={e => setFormData({...formData, episodes: Number(e.target.value)})} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">单集时长（秒）</label>
                  <input type="number" value={formData.duration} onChange={e => setFormData({...formData, duration: Number(e.target.value)})} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">视频画面比例</label>
                  <div className="flex gap-4">
                    {['9:16', '16:9', '1:1'].map(ratio => (
                      <label key={ratio} className={`flex-1 text-center py-2.5 rounded-lg border cursor-pointer text-sm font-medium transition-colors ${formData.ratio === ratio ? 'bg-indigo-50 border-indigo-600 text-indigo-700' : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'}`}>
                        <input type="radio" name="ratio" value={ratio} checked={formData.ratio === ratio} onChange={e => setFormData({...formData, ratio: e.target.value})} className="hidden" />
                        {ratio} 竖屏/横屏
                      </label>
                    ))}
                  </div>
                </div>
              </div>
              
              <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 text-sm font-medium text-slate-600 bg-white border border-slate-300 rounded-lg hover:bg-slate-50">取消</button>
                <button type="submit" className="px-5 py-2.5 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 shadow-sm flex items-center gap-2">
                  ✨ 确认创建 (自动进入规划)
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
