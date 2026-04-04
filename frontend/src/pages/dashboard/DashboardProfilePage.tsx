import { MOCK_PROFILE } from './mockData'

export function DashboardProfilePage() {
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