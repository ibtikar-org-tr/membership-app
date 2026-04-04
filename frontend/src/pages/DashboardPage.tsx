import { Link, NavLink, Outlet } from 'react-router-dom'

interface SidebarItem {
  to: string
  label: string
  helper: string
  end?: boolean
}

const SIDEBAR_ITEMS: SidebarItem[] = [
  { to: '/dashboard', label: 'الرئيسية', helper: 'الإحصائيات والأخبار', end: true },
  { to: '/dashboard/profile', label: 'الملف الشخصي', helper: 'بياناتك الشخصية' },
  { to: '/dashboard/settings', label: 'الإعدادات', helper: 'تفضيلات الحساب' },
]

export function DashboardPage() {
  return (
    <main className="min-h-screen w-full bg-linear-to-br from-slate-100 via-cyan-50 to-sky-100 text-slate-800 lg:h-screen lg:overflow-hidden" dir="rtl">
      <div className="flex min-h-screen w-full flex-col lg:h-screen lg:flex-row-reverse">
        <aside className="w-full border-b border-slate-200 bg-white p-4 shadow-sm lg:fixed lg:inset-y-0 lg:right-0 lg:flex lg:w-80 lg:flex-col lg:overflow-y-auto lg:border-b-0 lg:border-l">
          <p className="text-xs font-semibold uppercase tracking-wide text-cyan-700">لوحة التحكم</p>
          <h1 className="mt-2 text-xl font-black text-slate-900">مرحباً أحمد</h1>
          <p className="mt-1 text-sm text-slate-500">صفحة تجريبية بدون ربط خلفي</p>

          <nav className="mt-5 space-y-2">
            {SIDEBAR_ITEMS.map((item) => {
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) =>
                    `block w-full rounded-xl border px-4 py-3 text-right transition hover:cursor-pointer ${
                      isActive
                        ? 'border-cyan-200 bg-cyan-50 text-cyan-900'
                        : 'border-slate-200 bg-white text-slate-700 hover:border-cyan-200 hover:bg-cyan-50/60'
                    }`
                  }
                >
                  <p className="text-sm font-black">{item.label}</p>
                  <p className="mt-0.5 text-xs text-slate-500">{item.helper}</p>
                </NavLink>
              )
            })}
          </nav>

          <Link
            to="/"
            className="mt-5 inline-flex w-full items-center justify-center rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
          >
            العودة إلى الرئيسية
          </Link>

          <div className="mt-6 space-y-3 border-t border-slate-200 pt-4 lg:mt-auto">
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
              <p className="text-xs font-semibold text-slate-500">المستخدم الحالي</p>
              <p className="mt-1 text-sm font-black text-slate-900">أحمد سالم</p>
              <p className="mt-1 text-xs text-slate-600">ahmad.salem@example.com</p>
              <p className="mt-2 text-[11px] font-medium text-cyan-700"># العضوية: IBT-2026-0137</p>
            </div>

            <Link
              to="/login"
              className="inline-flex w-full items-center justify-center rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm font-bold text-red-700 transition hover:bg-red-100"
            >
              تسجيل الخروج
            </Link>
          </div>
        </aside>

        <section className="w-full flex-1 p-4 md:p-6 lg:h-screen lg:overflow-y-auto lg:pr-[22rem] lg:pl-8 lg:py-8">
          <Outlet />
        </section>
      </div>
    </main>
  )
}