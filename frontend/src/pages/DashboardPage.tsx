import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { AgeAnalyticsCard } from '../components/main-page/AgeAnalyticsCard'
import { GenderDistributionCard } from '../components/main-page/GenderDistributionCard'
import { MembersOverviewCard } from '../components/main-page/MembersOverviewCard'
import type { HomeStatsResponse } from '../types/home-stats'

type DashboardSection = 'main' | 'profile' | 'settings'

interface SidebarItem {
  key: DashboardSection
  label: string
  helper: string
}

const SIDEBAR_ITEMS: SidebarItem[] = [
  { key: 'main', label: 'الرئيسية', helper: 'الإحصائيات والأخبار' },
  { key: 'profile', label: 'الملف الشخصي', helper: 'بياناتك الشخصية' },
  { key: 'settings', label: 'الإعدادات', helper: 'تفضيلات الحساب' },
]

const MOCK_STATS: HomeStatsResponse = {
  overview: {
    totalMembers: 2841,
    cycleGrowthPercentage: 14,
    telegramActive: 1960,
    newMembers: 127,
    countriesCount: 23,
    universitiesCount: 78,
  },
  genderDistribution: {
    maleCount: 1562,
    femaleCount: 1279,
    malePercentage: 55,
    femalePercentage: 45,
  },
  ageDistribution: [
    { group: '15-18', count: 240 },
    { group: '19-22', count: 1070 },
    { group: '23-26', count: 930 },
    { group: '27-30', count: 420 },
    { group: '31+', count: 181 },
  ],
}

const MOCK_NEWS = [
  {
    title: 'إطلاق برنامج تدريب الربيع 2026',
    date: '04 نيسان 2026',
    summary: 'فتح التسجيل لبرنامج مكثف في تطوير الويب والذكاء الاصطناعي لطلاب الجامعات.',
  },
  {
    title: 'جلسة تعريفية للأعضاء الجدد',
    date: '30 آذار 2026',
    summary: 'لقاء مباشر للتعريف بمسارات العمل والفرق التطوعية وآلية المتابعة الدورية.',
  },
  {
    title: 'تحديث مجتمع التلغرام',
    date: '25 آذار 2026',
    summary: 'إضافة قنوات فرعية للمشاريع وفتح مساحات أسبوعية للأسئلة التقنية.',
  },
]

const MOCK_PROFILE = {
  enName: 'Ahmad Salem',
  arName: 'أحمد سالم',
  email: 'ahmad.salem@example.com',
  phoneNumber: '+90 5xx xxx xx xx',
  sex: 'ذكر',
  dateOfBirth: '2002-06-15',
  country: 'تركيا',
  region: 'إسطنبول',
  city: 'إسطنبول',
  address: 'Başakşehir Mah. No: 10',
  educationLevel: 'بكالوريوس (جامعة)',
  school: 'جامعة إسطنبول التقنية',
  graduationYear: '2025',
  fieldOfStudy: 'هندسة البرمجيات',
  bloodType: 'O+',
  skills: 'React, TypeScript, Node.js',
  languages: 'العربية, التركية, الإنجليزية',
}

const MOCK_SETTINGS = {
  language: 'العربية',
  theme: 'فاتح',
  emailNotifications: true,
  telegramNotifications: true,
  weeklyDigest: false,
  profileVisibility: 'للأعضاء فقط',
}

function MainSection() {
  return (
    <div className="space-y-5">
      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <h2 className="text-lg font-black text-slate-900 sm:text-xl">لوحة الإحصائيات</h2>
        <p className="mt-1 text-sm text-slate-500">بيانات تجريبية لعرض تصميم الصفحة حتى يتم ربطها بالواجهة الخلفية.</p>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <MembersOverviewCard overview={MOCK_STATS.overview} />
        <GenderDistributionCard genderDistribution={MOCK_STATS.genderDistribution} />
      </section>

      <section>
        <AgeAnalyticsCard ageDistribution={MOCK_STATS.ageDistribution} />
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <h3 className="text-base font-black text-slate-900 sm:text-lg">آخر الأخبار</h3>
        <div className="mt-4 space-y-3">
          {MOCK_NEWS.map((item) => (
            <article key={item.title} className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3">
              <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                <p className="font-bold text-slate-800">{item.title}</p>
                <span className="text-xs font-medium text-slate-500">{item.date}</span>
              </div>
              <p className="mt-2 text-sm text-slate-600">{item.summary}</p>
            </article>
          ))}
        </div>
      </section>
    </div>
  )
}

function ProfileSection() {
  const profileRows = [
    { label: 'الاسم بالإنكليزية', value: MOCK_PROFILE.enName },
    { label: 'الاسم بالعربية', value: MOCK_PROFILE.arName },
    { label: 'البريد الإلكتروني', value: MOCK_PROFILE.email },
    { label: 'رقم الهاتف', value: MOCK_PROFILE.phoneNumber },
    { label: 'الجنس', value: MOCK_PROFILE.sex },
    { label: 'تاريخ الميلاد', value: MOCK_PROFILE.dateOfBirth },
    { label: 'الدولة', value: MOCK_PROFILE.country },
    { label: 'المنطقة', value: MOCK_PROFILE.region },
    { label: 'المدينة', value: MOCK_PROFILE.city },
    { label: 'العنوان', value: MOCK_PROFILE.address },
    { label: 'المستوى التعليمي', value: MOCK_PROFILE.educationLevel },
    { label: 'المدرسة / الجامعة', value: MOCK_PROFILE.school },
    { label: 'سنة التخرج', value: MOCK_PROFILE.graduationYear },
    { label: 'مجال الدراسة', value: MOCK_PROFILE.fieldOfStudy },
    { label: 'زمرة الدم', value: MOCK_PROFILE.bloodType },
    { label: 'المهارات', value: MOCK_PROFILE.skills },
    { label: 'اللغات', value: MOCK_PROFILE.languages },
  ]

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
      <h2 className="text-lg font-black text-slate-900 sm:text-xl">الملف الشخصي</h2>
      <p className="mt-1 text-sm text-slate-500">بيانات مطابقة تقريباً لحقول نموذج التسجيل.</p>
      <div className="mt-5 grid gap-3 md:grid-cols-2">
        {profileRows.map((row) => (
          <div key={row.label} className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3">
            <p className="text-xs font-semibold text-slate-500">{row.label}</p>
            <p className="mt-1 text-sm font-bold text-slate-800">{row.value}</p>
          </div>
        ))}
      </div>
    </section>
  )
}

function SettingsSection() {
  const settingsRows = [
    { label: 'لغة الواجهة', value: MOCK_SETTINGS.language },
    { label: 'نمط العرض', value: MOCK_SETTINGS.theme },
    { label: 'تنبيهات البريد الإلكتروني', value: MOCK_SETTINGS.emailNotifications ? 'مفعّل' : 'غير مفعّل' },
    { label: 'تنبيهات التلغرام', value: MOCK_SETTINGS.telegramNotifications ? 'مفعّل' : 'غير مفعّل' },
    { label: 'النشرة الأسبوعية', value: MOCK_SETTINGS.weeklyDigest ? 'مفعّلة' : 'غير مفعّلة' },
    { label: 'ظهور الملف الشخصي', value: MOCK_SETTINGS.profileVisibility },
  ]

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
      <h2 className="text-lg font-black text-slate-900 sm:text-xl">الإعدادات</h2>
      <p className="mt-1 text-sm text-slate-500">تفضيلات الحساب الحالية مع عرض توضيحي قابل للتطوير لاحقاً.</p>
      <div className="mt-5 space-y-3">
        {settingsRows.map((item) => (
          <div key={item.label} className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 px-4 py-3">
            <span className="text-sm font-semibold text-slate-600">{item.label}</span>
            <span className="text-sm font-black text-slate-900">{item.value}</span>
          </div>
        ))}
      </div>
    </section>
  )
}

export function DashboardPage() {
  const [activeSection, setActiveSection] = useState<DashboardSection>('main')

  const renderedSection = useMemo(() => {
    if (activeSection === 'profile') {
      return <ProfileSection />
    }

    if (activeSection === 'settings') {
      return <SettingsSection />
    }

    return <MainSection />
  }, [activeSection])

  return (
    <main className="min-h-screen w-full bg-linear-to-br from-slate-100 via-cyan-50 to-sky-100 text-slate-800" dir="rtl">
      <div className="flex min-h-screen w-full flex-col lg:flex-row-reverse">
        <aside className="w-full border-b border-slate-200 bg-white p-4 shadow-sm lg:fixed lg:inset-y-0 lg:right-0 lg:w-80 lg:overflow-y-auto lg:border-b-0 lg:border-l">
          <p className="text-xs font-semibold uppercase tracking-wide text-cyan-700">لوحة التحكم</p>
          <h1 className="mt-2 text-xl font-black text-slate-900">مرحباً أحمد</h1>
          <p className="mt-1 text-sm text-slate-500">صفحة تجريبية بدون ربط خلفي</p>

          <nav className="mt-5 space-y-2">
            {SIDEBAR_ITEMS.map((item) => {
              const isActive = activeSection === item.key
              return (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => setActiveSection(item.key)}
                  className={`w-full rounded-xl border px-4 py-3 text-right transition hover:cursor-pointer ${
                    isActive
                      ? 'border-cyan-200 bg-cyan-50 text-cyan-900'
                      : 'border-slate-200 bg-white text-slate-700 hover:border-cyan-200 hover:bg-cyan-50/60'
                  }`}
                >
                  <p className="text-sm font-black">{item.label}</p>
                  <p className="mt-0.5 text-xs text-slate-500">{item.helper}</p>
                </button>
              )
            })}
          </nav>

          <Link
            to="/"
            className="mt-5 inline-flex w-full items-center justify-center rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
          >
            العودة إلى الرئيسية
          </Link>
        </aside>

        <section className="w-full flex-1 p-4 md:p-6 lg:pr-[22rem] lg:pl-8 lg:py-8">{renderedSection}</section>
      </div>
    </main>
  )
}