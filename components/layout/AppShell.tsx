
"use client";

import { useState } from "react";
import {
  LayoutDashboard,
  FolderKanban,
  Images,
  Clapperboard,
  ListTodo,
  Film,
  UserRound,
  Settings,
  Bell,
  Search,
  Menu,
  X,
  Sparkles,
  ChevronRight
} from "lucide-react";

const navigation = [
  { name: "项目管理", icon: FolderKanban, href: "/", active: true },
  { name: "素材库", icon: Images, href: "/assets" },
  { name: "视频生成", icon: Clapperboard, href: "/generate" },
  { name: "任务中心", icon: ListTodo, href: "/tasks" },
  { name: "视频与成片", icon: Film, href: "/videos" }
];

const secondaryNavigation = [
  { name: "个人中心", icon: UserRound, href: "/profile" },
  { name: "系统设置", icon: Settings, href: "/settings" }
];

export default function AppShell({
  children
}: {
  children: React.ReactNode;
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notice, setNotice] = useState("");

  function handleNavigation(name: string, href: string) {
    if (href === "/") {
      window.location.href = "/";
      return;
    }

    setNotice(`${name}模块正在开发中，敬请期待`);
    setMobileMenuOpen(false);

    window.setTimeout(() => setNotice(""), 2500);
  }

  return (
    <div className="min-h-screen bg-[#F7F8FA] text-slate-800">
      {/* 桌面端侧边栏 */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[248px] border-r border-slate-200 bg-white lg:flex lg:flex-col">
        <div className="flex h-[72px] items-center gap-3 border-b border-slate-100 px-6">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand text-white">
            <Sparkles size={20} />
          </div>
          <div>
            <div className="text-[16px] font-bold tracking-tight text-slate-900">
              DRAMA AI
            </div>
            <div className="text-[10px] tracking-[2px] text-slate-400">
              CREATIVE STUDIO
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-6">
          <div className="mb-3 px-3 text-[11px] font-semibold tracking-wider text-slate-400">
            工作空间
          </div>

          <nav className="space-y-1">
            {navigation.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.name}
                  onClick={() => handleNavigation(item.name, item.href)}
                  className={`flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left text-sm transition ${
                    item.active
                      ? "bg-brand-light font-semibold text-brand"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  }`}
                >
                  <Icon size={18} />
                  <span>{item.name}</span>
                  {item.active && (
                    <span className="ml-auto h-1.5 w-1.5 rounded-full bg-brand" />
                  )}
                </button>
              );
            })}
          </nav>

          <div className="mb-3 mt-9 px-3 text-[11px] font-semibold tracking-wider text-slate-400">
            账户
          </div>

          <nav className="space-y-1">
            {secondaryNavigation.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.name}
                  onClick={() => handleNavigation(item.name, item.href)}
                  className="flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left text-sm text-slate-600 transition hover:bg-slate-50 hover:text-slate-900"
                >
                  <Icon size={18} />
                  <span>{item.name}</span>
                </button>
              );
            })}
          </nav>
        </div>

        <div className="border-t border-slate-100 p-4">
          <div className="rounded-xl bg-slate-50 p-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
              <Sparkles size={16} className="text-brand" />
              AI 创作工作台
            </div>
            <p className="mt-2 text-xs leading-5 text-slate-500">
              从创意到剧本，再到视频制作。
            </p>
          </div>
        </div>
      </aside>

      {/* 主内容区域 */}
      <div className="min-h-screen lg:pl-[248px]">
        {/* 顶部导航 */}
        <header className="sticky top-0 z-30 flex h-[72px] items-center justify-between border-b border-slate-200 bg-white/95 px-4 backdrop-blur md:px-8">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 lg:hidden"
              aria-label="打开菜单"
            >
              <Menu size={21} />
            </button>

            <div className="hidden items-center gap-2 text-sm text-slate-400 sm:flex">
              <LayoutDashboard size={16} />
              <ChevronRight size={14} />
              <span className="font-medium text-slate-800">项目管理</span>
            </div>

            <div className="font-semibold text-slate-900 sm:hidden">
              DRAMA AI
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden h-9 w-[220px] items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 md:flex">
              <Search size={16} className="text-slate-400" />
              <span className="text-xs text-slate-400">搜索项目...</span>
            </div>

            <button
              className="relative rounded-lg p-2 text-slate-500 transition hover:bg-slate-100"
              aria-label="通知"
              onClick={() => setNotice("目前没有新通知")}
            >
              <Bell size={19} />
            </button>

            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-light text-sm font-semibold text-brand">
              游
            </div>
          </div>
        </header>

        <main className="page-container py-6 pb-24 md:py-8 lg:pb-10">
          {children}
        </main>
      </div>

      {/* 手机端底部导航 */}
      <nav className="fixed bottom-0 left-0 right-0 z-30 grid grid-cols-4 border-t border-slate-200 bg-white px-2 pb-[env(safe-area-inset-bottom)] pt-2 lg:hidden">
        {[
          { name: "项目", icon: FolderKanban, href: "/" },
          { name: "素材", icon: Images, href: "/assets" },
          { name: "任务", icon: ListTodo, href: "/tasks" },
          { name: "我的", icon: UserRound, href: "/profile" }
        ].map((item) => {
          const Icon = item.icon;
          const active = item.href === "/";
          return (
            <button
              key={item.name}
              onClick={() => handleNavigation(item.name, item.href)}
              className={`flex flex-col items-center gap-1 py-1 text-[11px] ${
                active ? "font-semibold text-brand" : "text-slate-400"
              }`}
            >
              <Icon size={20} />
              {item.name}
            </button>
          );
        })}
      </nav>

      {/* 手机端侧边菜单 */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            className="absolute inset-0 bg-slate-950/40"
            onClick={() => setMobileMenuOpen(false)}
            aria-label="关闭菜单"
          />

          <div className="absolute bottom-0 left-0 top-0 flex w-[280px] flex-col bg-white shadow-xl">
            <div className="flex h-[72px] items-center justify-between border-b border-slate-100 px-5">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand text-white">
                  <Sparkles size={20} />
                </div>
                <span className="font-bold text-slate-900">DRAMA AI</span>
              </div>
              <button
                onClick={() => setMobileMenuOpen(false)}
                aria-label="关闭菜单"
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              <div className="mb-3 px-3 text-xs font-semibold text-slate-400">
                工作空间
              </div>
              {navigation.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.name}
                    onClick={() => handleNavigation(item.name, item.href)}
                    className={`mb-1 flex w-full items-center gap-3 rounded-lg px-3 py-3 text-sm ${
                      item.active
                        ? "bg-brand-light font-semibold text-brand"
                        : "text-slate-600"
                    }`}
                  >
                    <Icon size={18} />
                    {item.name}
                  </button>
                );
              })}

              <div className="mb-3 mt-7 px-3 text-xs font-semibold text-slate-400">
                账户
              </div>
              {secondaryNavigation.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.name}
                    onClick={() => handleNavigation(item.name, item.href)}
                    className="mb-1 flex w-full items-center gap-3 rounded-lg px-3 py-3 text-sm text-slate-600"
                  >
                    <Icon size={18} />
                    {item.name}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {notice && (
        <div className="fixed bottom-20 left-1/2 z-[60] -translate-x-1/2 rounded-lg bg-slate-900 px-4 py-3 text-sm text-white shadow-lg lg:bottom-8">
          {notice}
        </div>
      )}
    </div>
  );
}
