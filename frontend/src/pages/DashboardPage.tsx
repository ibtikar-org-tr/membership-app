import { Link, NavLink, Navigate, Outlet } from 'react-router-dom'
import { useMemo } from 'react'
import { clearStoredUser, getStoredUser } from '../utils/auth'
import {
  LayoutDashboard,
  Users,
  FolderKanban,
  CalendarDays,
  UserCircle,
  Settings,
  LogOut,
  Home,
} from 'lucide-react'

interface SidebarItem {
  to: string
  label: string
  helper: string
  icon: React.ComponentType<{ className?: string }>
  end?: boolean
}

const SIDEBAR_ITEMS: SidebarItem[] = [
  { to: '/dashboard', label: 'الرئيسية', helper: 'الإحصائيات والأخبار', icon: LayoutDashboard, end: true },
  { to: '/dashboard/community', label: 'المجتمع', helper: 'قنوات ومجموعات الأعضاء', icon: Users },
  { to: '/dashboard/projects', label: 'المشاريع', helper: 'متابعة المبادرات النشطة', icon: FolderKanban },
  { to: '/dashboard/events', label: 'الفعاليات', helper: 'اللقاءات والورش القادمة', icon: CalendarDays },
  { to: '/dashboard/profile', label: 'الملف الشخصي', helper: 'بياناتك الشخصية', icon: UserCircle },
  { to: '/dashboard/settings', label: 'الإعدادات', helper: 'تفضيلات الحساب', icon: Settings },
]

export function DashboardPage() {
  const user = useMemo(() => getStoredUser(), [])

  if (!user) {
    return <Navigate to="/login" replace />
  }

  const handleLogout = () => {
    clearStoredUser()
  }

  return (
    <main className="min-h-screen w-full bg-slate-50 text-slate-800 lg:h-screen lg:overflow-hidden" dir="rtl">
      <div className="flex min-h-screen w-full flex-col lg:h-screen lg:flex-row-reverse">
        <aside className="w-full border-b border-slate-200 bg-white p-4 lg:fixed lg:inset-y-0 lg:right-0 lg:flex lg:w-80 lg:flex-col lg:overflow-y-auto lg:border-b-0 lg:border-l lg:shadow-sm">
          {/* Brand Section */}
          <div className="mb-6 border-b border-slate-200 pb-5">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 shadow-sm">
                <Home className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-base font-bold text-slate-900">لوحة التحكم</h1>
                <p className="text-xs text-slate-500">نظام إدارة الأعضاء</p>
              </div>
            </div>
          </div>

          {/* Navigation Menu */}
          <nav className="space-y-1">
            {SIDEBAR_ITEMS.map((item) => {
              const IconComponent = item.icon
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) =>
                    `group flex items-center gap-3 rounded-xl border px-4 py-3 text-right transition-all duration-200 ${
                      isActive
                        ? 'border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 shadow-sm'
                        : 'border-transparent text-slate-600 hover:border-slate-200 hover:bg-slate-50 hover:text-slate-900'
                    }`
                  }
                >
                  <IconComponent className={`h-5 w-5 flex-shrink-0 transition-colors`} />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold">{item.label}</p>
                    <p className="mt-0.5 text-xs opacity-70">{item.helper}</p>
                  </div>
                </NavLink>
              )
            })}
          </nav>

          {/* Back to Home Link */}
          <Link
            to="/"
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition-all duration-200 hover:border-slate-400 hover:bg-slate-50 hover:shadow-md"
          >
            <Home className="h-4 w-4" />
            <span>العودة إلى الرئيسية</span>
          </Link>

          {/* User Profile Section */}
          <div className="mt-6 space-y-4 border-t border-slate-200 pt-5 lg:mt-auto">
            <div className="rounded-xl border border-slate-200 bg-gradient-to-br from-slate-50 to-white p-4 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 text-white shadow-sm">
                  <UserCircle className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-slate-900">{user.role}</p>
                  <p className="truncate text-xs text-slate-600">{user.email}</p>
                  <p className="mt-1 text-[11px] font-medium text-slate-500">
                    رقم العضوية: {user.membershipNumber}
                  </p>
                </div>
              </div>
            </div>

            <Link
              to="/login"
              onClick={handleLogout}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-red-200 bg-white px-4 py-2.5 text-sm font-semibold text-red-600 shadow-sm transition-all duration-200 hover:border-red-300 hover:bg-red-50 hover:shadow-md"
            >
              <LogOut className="h-4 w-4" />
              <span>تسجيل الخروج</span>
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