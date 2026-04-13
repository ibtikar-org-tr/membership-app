import { Link, NavLink, Navigate, Outlet } from 'react-router-dom'
import { clearStoredUser, getStoredUser } from '../utils/auth'

interface SidebarItem {
  to: string
  label: string
  helper: string
  end?: boolean
}

const SIDEBAR_ITEMS: SidebarItem[] = [
  { to: '/dashboard', label: 'الرئيسية', helper: 'الإحصائيات والأخبار', end: true },
  { to: '/dashboard/community', label: 'المجتمع', helper: 'قنوات ومجموعات الأعضاء' },
  { to: '/dashboard/projects', label: 'المشاريع', helper: 'متابعة المبادرات النشطة' },
  { to: '/dashboard/events', label: 'الفعاليات', helper: 'اللقاءات والورش القادمة' },
  { to: '/dashboard/profile', label: 'الملف الشخصي', helper: 'بياناتك الشخصية' },
  { to: '/dashboard/settings', label: 'الإعدادات', helper: 'تفضيلات الحساب' },
]

export function DashboardPage() {
  const user = getStoredUser()

  if (!user) {
    return <Navigate to="/login" replace />
  }

  const handleLogout = () => {
    clearStoredUser()
  }

  return (
    <main className="min-h-screen w-full bg-[#f7f7f5] text-slate-800 lg:h-screen lg:overflow-hidden" dir="rtl">
      <div className="flex min-h-screen w-full flex-col lg:h-screen lg:flex-row-reverse">
        <aside className="w-full border-b border-slate-200/80 bg-[#fbfbfa] p-4 lg:fixed lg:inset-y-0 lg:right-0 lg:flex lg:w-80 lg:flex-col lg:overflow-y-auto lg:border-b-0 lg:border-l">
          <div className="rounded-xl border border-slate-200/80 bg-white p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">لوحة التحكم</p>
            <h1 className="mt-2 text-lg font-semibold text-slate-900">مرحباً أحمد</h1>
            <p className="mt-1 text-sm text-slate-500">نظرة عامة على حسابك ومحتوى المجتمع</p>
          </div>

          <nav className="mt-5 space-y-2">
            {SIDEBAR_ITEMS.map((item) => {
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) =>
                    `block w-full rounded-lg border px-4 py-3 text-right transition ${
                      isActive
                        ? 'border-slate-300 bg-white text-slate-900'
                        : 'border-transparent bg-transparent text-slate-600 hover:border-slate-200 hover:bg-white/80'
                    }`
                  }
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold">{item.label}</p>
                      <p className="mt-0.5 text-xs text-slate-500">{item.helper}</p>
                    </div>
                    <span className="mt-1 inline-block h-1.5 w-1.5 rounded-full bg-current opacity-60" />
                  </div>
                </NavLink>
              )
            })}
          </nav>

          <Link
            to="/"
            className="mt-5 inline-flex w-full items-center justify-center rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            العودة إلى الرئيسية
          </Link>

          <div className="mt-6 space-y-3 border-t border-slate-200 pt-4 lg:mt-auto">
            <div className="rounded-lg border border-slate-200 bg-white px-4 py-3">
              <p className="text-xs font-semibold text-slate-500">المستخدم الحالي</p>
              <p className="mt-1 text-sm font-semibold text-slate-900">{user.role}</p>
              <p className="mt-1 text-xs text-slate-600">{user.email}</p>
              <p className="mt-2 text-[11px] font-medium text-slate-500"># العضوية: {user.membershipNumber}</p>
            </div>

            <Link
              to="/login"
              onClick={handleLogout}
              className="inline-flex w-full items-center justify-center rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              تسجيل الخروج
            </Link>
          </div>
        </aside>

        <section className="w-full flex-1 p-4 md:p-6 lg:h-screen lg:overflow-y-auto lg:pr-[22rem] lg:pl-8 lg:py-8">
          <div className="w-full">
            <Outlet />
          </div>
        </section>
      </div>
    </main>
  )
}