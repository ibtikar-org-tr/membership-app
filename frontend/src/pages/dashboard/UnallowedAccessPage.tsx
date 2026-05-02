import { useNavigate } from 'react-router-dom'
import conanImage from '../../assets/conan.png'

export function UnallowedAccessPage() {
  const navigate = useNavigate()

  return (
    <section className="rounded-3xl border border-slate-200/70 bg-white p-5 shadow-sm sm:p-6">
      <div className="flex flex-col items-center justify-center space-y-6 py-12 text-center">
        <img
          src={conanImage}
          alt="Unallowed Access"
          className="h-48 w-48 object-cover"
        />

        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-slate-900">
            عذراً, لا يمكنك الوصول إلى هذا المشروع
          </h1>
          <p className="text-slate-600">
            ليس لديك الصلاحيات الكافية للوصول إلى هذا المشروع. يرجى التأكد من أنك عضو في المشروع أو التواصل مع مسؤول المشروع.
          </p>
        </div>

        <button
          type="button"
          onClick={() => navigate('/dashboard/projects')}
          className="inline-flex items-center justify-center rounded-2xl bg-slate-950 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
        >
          العودة للمشاريع
        </button>
      </div>
    </section>
  )
}
