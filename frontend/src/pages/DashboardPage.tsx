import { Link, NavLink, Navigate, Outlet } from 'react-router-dom'
import { useEffect, useMemo, useState } from 'react'
import { Seo } from '../components/Seo'
import { clearStoredUser, getStoredUser } from '../utils/auth'
import {
  LayoutDashboard,
  HeartHandshake,
  Users,
  FolderKanban,
  CalendarDays,
  Shapes,
  UserCircle,
  Settings,
  LogOut,
  Home,
  ChevronRight,
  ChevronLeft,
  Menu,
  X,
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
  { to: '/dashboard/clubs', label: 'الأندية', helper: 'استكشاف أندية المشاريع', icon: Shapes },
  { to: '/dashboard/volunteering', label: 'التطوع', helper: 'الفرص التطوعية المفتوحة', icon: HeartHandshake },
  { to: '/dashboard/profile', label: 'الملف الشخصي', helper: 'بياناتك الشخصية', icon: UserCircle },
  { to: '/dashboard/settings', label: 'الإعدادات', helper: 'تفضيلات الحساب', icon: Settings },
]

export function DashboardPage() {
  const user = useMemo(() => getStoredUser(), [])
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false)

  useEffect(() => {
    if (!isMobileSidebarOpen) {
      return
    }

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [isMobileSidebarOpen])

  if (!user) {
    return <Navigate to="/login" replace />
  }

  const handleLogout = () => {
    clearStoredUser()
  }

  const handleMobileNavigation = () => {
    setIsMobileSidebarOpen(false)
  }

  return (
    <>
      <Seo
        title="لوحة التحكم"
        description="لوحة التحكم الخاصة بالأعضاء في منصة أعضاء إبتكار لمتابعة المشاريع والفعاليات والأندية وإعدادات الحساب."
        noIndex
      />
      <main className="min-h-screen w-full bg-slate-50 text-slate-800 lg:h-screen lg:overflow-hidden" dir="rtl">
        <div className="flex min-h-screen w-full flex-col lg:h-screen lg:flex-row-reverse">
          <div className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 px-4 py-3 backdrop-blur lg:hidden">
            <div className="flex items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-3">
                <img src="/square_logo.svg" alt="Logo" className="h-10 w-10 rounded-xl" />
                <div className="min-w-0">
                  <h1 className="truncate text-sm font-bold text-slate-900">منصّة تجمّع إبتكار</h1>
                  <p className="truncate text-xs text-slate-500">لوحة التحكم</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsMobileSidebarOpen(true)}
                className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:bg-slate-50"
                aria-label="فتح القائمة"
              >
                <Menu className="h-5 w-5" />
              </button>
            </div>
          </div>

          {isMobileSidebarOpen ? (
            <button
              type="button"
              aria-label="إغلاق القائمة"
              className="fixed inset-0 z-40 cursor-default bg-slate-900/40 lg:hidden"
              onClick={() => setIsMobileSidebarOpen(false)}
            />
          ) : null}

          <aside
            className={`fixed inset-y-0 right-0 z-50 flex w-[min(20rem,88vw)] flex-col overflow-y-auto border-l border-slate-200 bg-white p-4 shadow-2xl transition-transform duration-300 lg:relative lg:z-40 lg:w-auto lg:border-b-0 lg:shadow-none ${
              isMobileSidebarOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'
            } ${isSidebarCollapsed ? 'lg:w-20' : 'lg:w-80'}`}
          >
            <div className="mb-6 flex items-center justify-between border-b border-slate-200 pb-5">
              {!isSidebarCollapsed ? (
                <div className="flex items-center gap-3">
                  <img src="/square_logo.svg" alt="Logo" className="h-11 w-11 rounded-xl" />
                  <div>
                    <h1 className="text-base font-bold text-slate-900">منصّة تجمّع إبتكار</h1>
                    <p className="text-xs text-slate-500">نظام إدارة المتطوّعين</p>
                  </div>
                </div>
              ) : null}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                  className="hidden h-9 w-9 shrink-0 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-700 lg:flex"
                  aria-label={isSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                >
                  {isSidebarCollapsed ? <ChevronLeft className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
                </button>
                <button
                  type="button"
                  onClick={() => setIsMobileSidebarOpen(false)}
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-700 lg:hidden"
                  aria-label="إغلاق القائمة"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            <nav className="space-y-1">
              {SIDEBAR_ITEMS.map((item) => {
                const IconComponent = item.icon
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.end}
                    onClick={handleMobileNavigation}
                    className={({ isActive }) =>
                      `group relative flex items-center gap-3 rounded-xl border px-4 py-3 text-right transition-all duration-200 ${
                        isSidebarCollapsed ? 'justify-center px-2' : ''
                      } ${
                        isActive
                          ? 'border-blue-200 bg-linear-to-r from-blue-50 to-indigo-50 text-blue-700 shadow-sm'
                          : 'border-transparent text-slate-600 hover:border-slate-200 hover:bg-slate-50 hover:text-slate-900'
                      }`
                    }
                    title={isSidebarCollapsed ? item.label : undefined}
                  >
                    <IconComponent className="h-5 w-5 shrink-0 transition-colors" />
                    {!isSidebarCollapsed && (
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold">{item.label}</p>
                        <p className="mt-0.5 text-xs opacity-70">{item.helper}</p>
                      </div>
                    )}
                  </NavLink>
                )
              })}
            </nav>

            <Link
              to="/"
              onClick={handleMobileNavigation}
              className={`group relative mt-6 flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition-all duration-200 hover:border-slate-400 hover:bg-slate-50 hover:shadow-md ${
                isSidebarCollapsed ? 'px-2' : ''
              }`}
              title={isSidebarCollapsed ? 'العودة إلى الرئيسية' : undefined}
            >
              <Home className="h-4 w-4 shrink-0" />
              {!isSidebarCollapsed && <span>العودة إلى الرئيسية</span>}
            </Link>

            <div className="mt-6 space-y-4 border-t border-slate-200 pt-5 lg:mt-auto">
              <div
                className={`rounded-xl border border-slate-200 bg-linear-to-br from-slate-50 to-white p-4 shadow-sm ${
                  isSidebarCollapsed ? 'p-2' : ''
                }`}
              >
                <div className={`flex items-center ${isSidebarCollapsed ? 'justify-center' : 'gap-3'}`}>
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-linear-to-br from-blue-500 to-indigo-500 text-white shadow-sm">
                    <UserCircle className="h-5 w-5" />
                  </div>
                  {!isSidebarCollapsed && (
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-slate-900">{user.role === 'admin' ? 'مدير' : 'عضو'}</p>
                      <p className="truncate text-xs text-slate-600">{user.email}</p>
                      <p className="mt-1 text-[11px] font-medium text-slate-500">رقم العضوية: {user.membershipNumber}</p>
                    </div>
                  )}
                </div>
              </div>

              <Link
                to="/login"
                onClick={() => {
                  handleLogout()
                  handleMobileNavigation()
                }}
                className={`relative flex items-center justify-center gap-2 rounded-xl border border-red-200 bg-white px-4 py-2.5 text-sm font-semibold text-red-600 shadow-sm transition-all duration-200 hover:border-red-300 hover:bg-red-50 hover:shadow-md ${
                  isSidebarCollapsed ? 'px-2' : ''
                }`}
                title={isSidebarCollapsed ? 'تسجيل الخروج' : undefined}
              >
                <LogOut className="h-4 w-4 shrink-0" />
                {!isSidebarCollapsed && <span>تسجيل الخروج</span>}
              </Link>
            </div>
          </aside>

          <section
            className={`relative z-0 w-full flex-1 p-3 pb-6 sm:p-4 md:p-6 lg:h-screen lg:overflow-y-auto transition-all duration-300 ${
              isSidebarCollapsed ? 'lg:pr-22 lg:pl-8' : 'lg:pr-88 lg:pl-8'
            }`}
          >
            <div className="w-full">
              <Outlet />
            </div>
          </section>
        </div>
      </main>
    </>
  )
}
