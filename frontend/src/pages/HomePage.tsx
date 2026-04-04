import { Link } from 'react-router-dom'
import { AgeAnalyticsCard } from './components/AgeAnalyticsCard'
import { VolunteersStatsCard } from './components/VolunteersStatsCard'
import { useCountUp } from './components/useCountUp'

export function HomePage() {
  const totalMembers = useCountUp(1284)
  const monthlyGrowth = useCountUp(12)
  const telegramActive = useCountUp(742)
  const newMembers = useCountUp(38)
  const countriesCount = useCountUp(2)
  const universitiesCount = useCountUp(62)
  const maleRatio = useCountUp(56)
  const femaleRatio = useCountUp(44)

  return (
    <main className="min-h-screen bg-gradient-to-br from-amber-50 via-teal-50 to-sky-100 px-6 py-10 text-slate-800" dir="rtl">
      <div className="mx-auto flex min-h-[80vh] w-full max-w-6xl items-center">
        <section className="grid w-full gap-8 rounded-3xl border border-white/60 bg-white/70 p-8 shadow-2xl backdrop-blur md:grid-cols-2 md:p-12">
          <div className="space-y-6">
            <p className="inline-block rounded-full bg-teal-100 px-4 py-1 text-sm font-semibold text-teal-700">
              #جيلٌ_يبتكر
            </p>
            <h1 className="text-4xl font-black leading-tight tracking-tight text-slate-900 md:text-5xl">
              منصّة أعضاء تجمّع إبتكار
            </h1>
            <Link
              to="/registration"
              className="inline-flex items-center rounded-xl bg-slate-900 px-6 py-3 text-base font-semibold text-white transition hover:-translate-y-0.5 hover:bg-slate-700"
            >
              نموذج الانتساب لتجمّع إبتكار
            </Link>
            <div className="flex flex-wrap items-center gap-3">
              <Link
                to="/login"
                className="inline-flex items-center rounded-xl border border-slate-300 bg-white px-6 py-3 text-base font-semibold text-slate-800 transition hover:-translate-y-0.5 hover:border-slate-400"
              >
                تسجيل الدخول
              </Link>
              <Link
                to="/iforgot"
                className="inline-flex items-center rounded-xl px-1 py-3 text-base font-semibold text-slate-600 underline-offset-4 transition hover:text-slate-900 hover:underline"
              >
                نسيت معلوماتي
              </Link>
            </div>

            <VolunteersStatsCard />
          </div>

          <div className="grid gap-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-lg">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-slate-500">إجمالي الأعضاء</p>
                  <p className="mt-2 text-3xl font-black text-slate-900">{totalMembers.toLocaleString('en-US')}</p>
                </div>
                <div className="rounded-2xl bg-emerald-100 px-4 py-2 text-right">
                  <p className="text-xs font-semibold text-emerald-700">+{monthlyGrowth}% هذه الدورة</p>
                  <p className="mt-1 text-sm text-emerald-900">نمو مستمر</p>
                </div>
              </div>
              <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-xl bg-slate-50 p-4">
                  <p className="text-slate-500">نشطون على التلغرام</p>
                  <p className="mt-1 text-xl font-bold text-slate-900">{telegramActive.toLocaleString('en-US')}</p>
                </div>
                <div className="rounded-xl bg-slate-50 p-4">
                  <p className="text-slate-500">منتسبين جدد</p>
                  <p className="mt-1 text-xl font-bold text-slate-900">{newMembers.toLocaleString('en-US')}</p>
                </div>
                <div className="rounded-xl bg-slate-50 p-4">
                  <p className="text-slate-500">الدول</p>
                  <p className="mt-1 text-xl font-bold text-slate-900">{countriesCount.toLocaleString('en-US')}</p>
                </div>
                <div className="rounded-xl bg-slate-50 p-4">
                  <p className="text-slate-500">الجامعات</p>
                  <p className="mt-1 text-xl font-bold text-slate-900">{universitiesCount.toLocaleString('en-US')}</p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl bg-gradient-to-r from-slate-900 to-slate-700 p-5 text-white shadow-lg">
              <p className="text-sm font-semibold text-slate-300">توزيع الأعضاء حسب الجنس</p>
              <div className="mt-4 space-y-4">
                <div>
                  <div className="mb-2 flex items-center justify-between text-sm">
                    <span>الذكور</span>
                    <span>{maleRatio}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-white/15">
                    <div className="h-2 rounded-full bg-emerald-400 transition-[width] duration-200" style={{ width: `${maleRatio}%` }} />
                  </div>
                </div>
                <div>
                  <div className="mb-2 flex items-center justify-between text-sm">
                    <span>الإناث</span>
                    <span>{femaleRatio}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-white/15">
                    <div className="h-2 rounded-full bg-cyan-400 transition-[width] duration-200" style={{ width: `${femaleRatio}%` }} />
                  </div>
                </div>
              </div>
            </div>

            <AgeAnalyticsCard />
          </div>
        </section>
      </div>
    </main>
  )
}
