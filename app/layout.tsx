'use client'

import { useState } from 'react'

export default function Dashboard() {
  // 模拟的项目数据
  const mockProjects = [
    { id: 1, title: '霸道总裁的 AI 娇妻', status: '制作中', episodes: 12, progress: 45, cover: 'https://images.unsplash.com/photo-1518676590629-3dcbd9c5a5c9?q=80&w=600&auto=format&fit=crop' },
    { id: 2, title: '赛博朋克 2077 衍生短剧', status: '已完成', episodes: 8, progress: 100, cover: 'https://images.unsplash.com/photo-1618336753974-aae8e04506aa?q=80&w=600&auto=format&fit=crop' },
    { id: 3, title: '悬疑：消失的代码', status: '规划中', episodes: 15, progress: 10, cover: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=80&w=600&auto=format&fit=crop' },
  ]

  return (
    <div className="flex h-screen overflow-hidden">
      {/* 左侧导航栏 */}
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col hidden md:flex">
        <div className="h-16 flex items-center px-6 border-b border-slate-200">
          <span className="text-xl font-bold text-indigo-600">🎬 AI ShortDrama</span>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          {['项目管理', '素材库', '视频生成', '任务中心', '视频与成片'].map((item, i) => (
            <a key={i} href="#" className={`block px-4 py-2 rounded-lg text-sm font-medium transition-colors ${i === 0 ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-100'}`}>
              {item}
            </a>
          ))}
        </nav>
        {/* 底部改为静态的游客状态，没有任何登录按钮 */}
        <div className="p-4 border-t border-slate-200">
          <div className="flex items-center gap-3 px-4 py-2 text-sm text-slate-600 bg-slate-50 rounded-lg">
            <div className="w-8 h-8 rounded-full bg-indigo-200 flex items-center justify-center text-indigo-700 font-bold">
              游
            </div>
            <div>
              <p className="font-medium text-slate-800">游客模式</p>
              <p className="text-xs text-slate-400">积分: 0</p>
            </div>
          </div>
        </div>
      </aside>

      {/* 右侧主内容区 */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* 顶部 Header */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8">
          <h2 className="text-lg font-semibold text-slate-800">我的项目</h2>
          <button className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors shadow-sm">
            + 新建项目
          </button>
        </header>

        {/* 项目列表区 */}
        <div className="flex-1 overflow-y-auto p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {mockProjects.map((project) => (
              <div key={project.id} className="bg-white rounded-xl border border-slate-200 overflow-hidden hover:shadow-md transition-shadow cursor-pointer group">
                <div className="h-40 w-full overflow-hidden relative">
                  <img src={project.cover} alt={project.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  <div className="absolute top-3 right-3 bg-black/60 text-white text-xs px-2 py-1 rounded-md backdrop-blur-sm">
                    {project.status}
                  </div>
                </div>
                <div className="p-5">
                  <h3 className="font-bold text-slate-800 mb-2 truncate">{project.title}</h3>
                  <div className="flex justify-between text-sm text-slate-500 mb-4">
                    <span>共 {project.episodes} 集</span>
                    <span>进度 {project.progress}%</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2">
                    <div className="bg-indigo-600 h-2 rounded-full" style={{ width: `${project.progress}%` }}></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}
