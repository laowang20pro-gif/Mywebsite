
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
    <div className="flex flex-col md:flex-row h-screen overflow-hidden bg-slate-50 text-slate-800 font-sans pb-16 md:pb-0">
      
      {/* 电脑端左侧导航栏 */}
      <aside className="w-64 bg-slate-900 text-slate-300 hidden md:flex flex-col shrink-0">
        <div className="h-16 flex items-center px-6 border-b border-slate-800 text-white">
          <span className="text-xl font-bold tracking-wider">🎬 短剧 AI 工作台</span>
        </div>
        <div className="mx-4 mt-6 p-4 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-center shadow-inner">
          <p className="text-xs text-indigo-300 mb-1">当前状态</p>
          <p className="text-sm font-bold text-white">✅ 免登录体验版</p>
        </div>
        <nav className="flex-1 p-4 space-y-1 mt-4">
          {['项目管理', '素材库', '视频生成', '任务中心', '视频与成片'].map((item, i) => (
            <a key={i} href="#" className={`block px-4 py-3 rounded-lg text-sm font-medium transition-all ${i === 0 ? 'bg-indigo-600 text-white shadow-md' : 'hover:bg-slate-800 hover:text-white'}`}>
              {item}
            </a>
          ))}
        </nav>
      </aside>

      {/* 手机端底部导航栏 */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-slate-900 text-slate-400 flex justify-around items-center h-16 z-40 border-t border-slate-800">
        {['项目', '素材', '生成', '任务'].map((item, i) => (
          <a key={i} href="#" className={`flex flex-col items-center justify-center w-full h-full text-xs ${i === 0 ? 'text-indigo-400 font-bold' : ''}`}>
             <span className="text-lg mb-1">{['📁', '🖼️', '🎬', '⏳'][i]}</span>
             {item}
          </a>
        ))}
      </nav>

      {/* 右侧主内容 */}
      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 md:px-8 shrink-0 shadow-sm z-10">
          <h2 className="text-lg md:text-xl font-bold text-slate-800">我的短剧项目</h2>
          <button onClick={() => setIsModalOpen(true)} className="px-4 py-2 md:px-5 md:py-2.5 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-all shadow-md hover:shadow-lg flex items-center gap-1">
            <span>+</span> 新建
          </button>
        </header>

        <div className="flex-1 overflow-y-auto p-4 md:p-8">
          {projects.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 mt-20 md:mt-0">
              <div className="text-6xl mb-6 opacity-50">🎬</div>
              <p className="text-lg font-medium text-slate-600 mb-2">还没有任何项目</p>
              <p className="text-sm text-center">点击右上角“新建”，开启你的 AI 创作</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
              {projects.map((project) => (
                <div key={project.id} className="bg-white rounded-xl border border-slate-200 overflow-hidden hover:shadow-xl transition-all duration-300 flex flex-col group">
                  <div className="h-36 md:h-44 w-full bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 relative flex items-center justify-center overflow-hidden">
                    <div className="absolute inset-0 bg-black/10 group-hover:bg-black/0 transition-colors"></div>
                    <span className="text-white/80 text-2xl font-bold z-10">{project.style}</span>
                    <span className="absolute top-3 right-3 bg-black/60 text-white text-xs px-2.5 py-1 rounded-md backdrop-blur-sm z-10">{project.ratio}</span>
                  </div>
                  <div className="p-4 md:p-5 flex-1 flex flex-col">
                    <h3 className="font-bold text-base md:text-lg text-slate-800 mb-2 truncate">{project.name}</h3>
                    <p className="text-xs md:text-sm text-slate-500 line-clamp-2 mb-3 flex-1">{project.outline || '暂无大纲...'}</p>
                    <div className="flex justify-between text-[11px] md:text-xs text-slate-400 mb-3 bg-slate-50 p-2 rounded-md">
                      <span>{project.genre}</span>
                      <span>{project.episodes}集 · {project.duration}秒</span>
                    </div>
                    <div className="pt-3 border-t border-slate-100 flex justify-between items-center">
                       <button className="text-indigo-600 font-bold text-sm hover:text-indigo-800 transition-colors">进入项目详情 →</button>
                       <button onClick={() => deleteProject(project.id)} className="text-slate-400 hover:text-red-500 text-xs font-medium transition-colors bg-slate-100 px-2 py-1 rounded">删除</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* 新建项目弹窗 (手机适配版) */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-end md:items-center justify-center z-50 p-0 md:p-4 backdrop-blur-sm">
          <div className="bg-white rounded-t-2xl md:rounded-2xl w-full max-w-2xl shadow-2xl flex flex-col max-h-[90vh] md:max-h-[85vh] animate-slide-up">
            <div className="px-5 py-4 md:px-6 md:py-5 border-b flex justify-between items-center bg-slate-50/50 rounded-t-2xl">
              <h2 className="text-lg md:text-xl font-bold text-slate-800">新建短剧项目</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-700 text-2xl leading-none p-2">&times;</button>
            </div>
            
            <form onSubmit={handleCreateProject} className="p-5 md:p-6 overflow-y-auto space-y-4 md:space-y-5 flex-1">
              {/* 手机端单列，电脑端双列 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5">
                <div className="col-span-1 md:col-span-2">
                  <label className="block text-sm font-bold mb-2 text-slate-700">项目名称 <span className="text-red-500">*</span></label>
                  <input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} type="text" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all text-sm" placeholder="例如：重生之我在古代做首富" />
                </div>
                <div className="col-span-1 md:col-span-2">
                  <label className="block text-sm font-bold mb-2 text-slate-700">故事大纲 / 创意想法</label>
                  <textarea value={formData.outline} onChange={e => setFormData({...formData, outline: e.target.value})} rows={3} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all text-sm" placeholder="输入一句话创意..." />
                </div>
                <div>
                  <label className="block text-sm font-bold mb-2 text-slate-700">题材</label>
                  <select value={formData.genre} onChange={e => setFormData({...formData, genre: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white text-sm">
                    <option>都市/霸总</option>
                    <option>悬疑/推理</option>
                    <option>古装/穿越</option>
                    <option>科幻/赛博</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold mb-2 text-slate-700">视觉风格</label>
                  <select value={formData.style} onChange={e => setFormData({...formData, style: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white text-sm">
                    <option>真实写实</option>
                    <option>动漫二次元</option>
                    <option>赛博朋克</option>
                    <option>国风水墨</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold mb-2 text-slate-700">总集数</label>
                  <input type="number" value={formData.episodes} onChange={e => setFormData({...formData, episodes: Number(e.target.value)})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-bold mb-2 text-slate-700">单集时长(秒)</label>
                  <input type="number" value={formData.duration} onChange={e => setFormData({...formData, duration: Number(e.target.value)})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white text-sm" />
                </div>
                <div className="col-span-1 md:col-span-2">
                  <label className="block text-sm font-bold mb-2 text-slate-700">画面比例</label>
                  <div className="flex gap-2 md:gap-4">
                    {['9:16', '16:9', '1:1'].map(ratio => (
                      <label key={ratio} className={`flex-1 text-center py-3 rounded-lg border-2 cursor-pointer text-sm font-bold transition-all ${formData.ratio === ratio ? 'bg-indigo-50 border-indigo-600 text-indigo-700' : 'bg-slate-50 border-slate-200 text-slate-500 hover:border-slate-300'}`}>
                        <input type="radio" checked={formData.ratio === ratio} onChange={e => setFormData({...formData, ratio: e.target.value})} className="hidden" />
                        {ratio}
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </form>
            
            {/* 底部固定按钮区 */}
            <div className="p-4 md:p-6 border-t border-slate-100 bg-white rounded-b-2xl flex gap-3 shrink-0 pb-safe">
              <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-3.5 text-sm font-bold text-slate-600 bg-slate-100 rounded-xl hover:bg-slate-200 transition-colors">取消</button>
              <button onClick={handleCreateProject} className="flex-[2] py-3.5 text-sm font-bold text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 shadow-md transition-all flex justify-center items-center gap-2">
                ✨ 确认创建
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  )
}
