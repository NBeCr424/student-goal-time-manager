import { NavLink, Outlet, useLocation } from "react-router-dom";

const tabs = [
  { to: "/", label: "首页" },
  { to: "/goals", label: "目标" },
  { to: "/todos", label: "待办" },
  { to: "/focus", label: "计时" },
  { to: "/settings", label: "导出" },
];

function titleByPath(pathname: string): string {
  if (pathname.startsWith("/goals")) return "目标管理";
  if (pathname.startsWith("/todos")) return "待办清单";
  if (pathname.startsWith("/focus")) return "专注计时";
  if (pathname.startsWith("/settings")) return "本地导出";
  return "学生极简时间管理";
}

export function Layout() {
  const location = useLocation();

  return (
    <div className="mx-auto min-h-screen w-full max-w-4xl bg-brand-soft pb-24 text-slate-900">
      <header className="sticky top-0 z-20 border-b border-brand/20 bg-brand-soft/95 px-4 py-3 backdrop-blur">
        <h1 className="text-lg font-semibold text-brand-dark">{titleByPath(location.pathname)}</h1>
      </header>

      <main className="px-4 py-4">
        <Outlet />
      </main>

      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-brand/20 bg-white/95 px-2 py-2 backdrop-blur" aria-label="主导航">
        <ul className="mx-auto flex max-w-4xl items-center justify-between gap-2">
          {tabs.map((tab) => (
            <li key={tab.to} className="flex-1">
              <NavLink
                to={tab.to}
                className={({ isActive }) =>
                  `flex min-h-12 items-center justify-center rounded-xl text-sm font-medium ${
                    isActive ? "bg-brand text-white" : "text-brand-dark"
                  }`
                }
              >
                {tab.label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}
