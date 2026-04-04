import { TextField } from '../TextField'
import { FiExternalLink } from 'react-icons/fi'

type BylawsAcknowledgementSectionProps = {
  value: string
  onChange: (value: string) => void
}

const commitmentItems = [
  'قبول جميع بنود النّظام الدّاخلي لتجمّع إبتكار.',
  'قبول التّواجد في التّجمّع وفقاً لقيمه (الإحسان – الجودة – الإبداع – التّشارك – الاستقلالية).',
  'الإخلاص التّام وعدم استغلال التّجمّع لأهداف شخصيّة.',
  'عدم الإساءة لأي من أعضاء التّجمّع، مهما كان نوع الإساءة.',
  'عدم إلحاق الضّرر المتعمّد بالتّجمّع، مهما كان نوع الضّرر.',
  'معرفة الحقوق والواجبات.',
  'الموافقة على الآليّات المتّبعة من قبل التّجمّع في اتّخاذ القرارات.',
  'عدم القيام بأي عمل أو التّحدّث باسم تجمّع إبتكار دون توكيل أو موافقة من المسؤولين.',
  'تقديم مصلحة المجتمع على مصلحة الفرد.',
]

export function BylawsAcknowledgementSection({ value, onChange }: BylawsAcknowledgementSectionProps) {
  return (
    <section className="rounded-2xl border border-amber-200 bg-amber-50 p-4 shadow-md md:p-6">
      <h2 className="text-xl font-black text-slate-900 md:text-2xl">إقرار الالتزام بالنظام الداخلي</h2>
      <p className="mt-2 text-sm leading-relaxed text-slate-700 md:text-base">
        بالانتساب إلى تجمّع إبتكار، أقرّ بالاطلاع على البنود التالية والالتزام بها:
      </p>
      <ol className="mt-4 space-y-2 rounded-xl border border-amber-200 bg-white p-4 text-sm font-medium leading-relaxed text-slate-800 md:text-base">
        {commitmentItems.map((item) => (
          <li key={item} className="list-inside list-decimal">
            {item}
          </li>
        ))}
      </ol>
      <div className="mt-4 flex flex-wrap items-center gap-3 text-sm">
        <a
          href="https://github.com/ibtikar-org-tr/bylaws"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-3 py-2 font-semibold text-slate-700 transition hover:border-slate-500 hover:text-slate-900"
        >
          ملف النظام الداخلي
          <FiExternalLink aria-hidden="true" className="text-sm" />
        </a>
        <a
          href="https://data.ibtikar.org.tr/documents/ar/intro.pdf"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-3 py-2 font-semibold text-slate-700 transition hover:border-slate-500 hover:text-slate-900"
        >
          الملف التّعريفي
          <FiExternalLink aria-hidden="true" className="text-sm" />
        </a>
      </div>
      <div className="mt-4">
        <TextField
          id="bylaws-acknowledgement"
          label="هل قرأت النظام الداخلي وتوافق عليه؟"
          value={value}
          onChange={onChange}
          required
          placeholder="اكتب: نعم"
          validationPattern={/^نعم$/}
          validationMessage="عليك كتابة عبارة «نعم» في المربع كما هي تماماً."
          helperText="صيغة الإدخال المطلوبة: نعم"
        />
      </div>
    </section>
  )
}
