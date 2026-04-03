import { useEffect, useMemo, useRef, useState } from 'react'
import { gsap } from 'gsap'
import { SearchableTagsField } from '../components/SearchableTagsField'
import { SelectField } from '../components/SelectField'
import { SectionCard } from '../components/SectionCard'
import { TextAreaField } from '../components/TextAreaField'
import { whereHeardAboutUsOptions, volunteeringInterestOptions, bloodTypeOptions } from '../config/registrationOptions'
import type { RegistrationFormData } from '../types/registration'

type RegistrationInfoSectionProps = {
  data: RegistrationFormData
  onFieldChange: (field: keyof RegistrationFormData, value: string) => void
}

const MOTIVATION_LETTER_MIN_LENGTH = 50

const VOLUNTEER_CIRCLE_STYLES = [
  'h-28 w-28 bg-emerald-300/35 blur-[1px]',
  'h-16 w-16 bg-teal-300/35',
  'h-32 w-32 bg-cyan-300/25',
  'h-20 w-20 bg-emerald-200/40',
]

export function RegistrationInfoSection({ data, onFieldChange }: RegistrationInfoSectionProps) {
  const [motivationLetterTouched, setMotivationLetterTouched] = useState(false)
  const volunteeringAreaRef = useRef<HTMLDivElement | null>(null)
  const volunteerCirclePositions = useMemo(
    () =>
      VOLUNTEER_CIRCLE_STYLES.map(() => ({
        top: `${Math.floor(Math.random() * 85)}%`,
        left: `${Math.floor(Math.random() * 85)}%`,
      })),
    [],
  )

  useEffect(() => {
    const area = volunteeringAreaRef.current
    if (!area) return

    const circles = Array.from(area.querySelectorAll<HTMLElement>('[data-volunteer-circle]'))
    if (circles.length === 0) return

    const ctx = gsap.context(() => {
      circles.forEach((circle, index) => {
        gsap.to(circle, {
          x: index % 2 === 0 ? 20 : -24,
          y: index % 2 === 0 ? -16 : 18,
          rotation: index % 2 === 0 ? 18 : -14,
          duration: 6 + index * 1.2,
          repeat: -1,
          yoyo: true,
          ease: 'sine.inOut',
          force3D: true,
        })
      })
    }, area)

    return () => ctx.revert()
  }, [])

  const getMotivationLetterError = () => {
    if (!motivationLetterTouched) return undefined
    if (data.motivationLetter.length < MOTIVATION_LETTER_MIN_LENGTH) {
      return `يجب أن يكون طول الرسالة 50 حرفاً على الأقل (${data.motivationLetter.length}/${MOTIVATION_LETTER_MIN_LENGTH})`
    }
    return undefined
  }

  const handleMotivationLetterChange = (value: string) => {
    setMotivationLetterTouched(true)
    onFieldChange('motivationLetter', value)
  }

  return (
    <SectionCard title="معلومات إضافيّة تهمّنا" subtitle="نسعد بالتعرّف عليكم أكثر من خلال هذه المعلومات الاختيارية.">
      <div className="grid gap-4 md:grid-cols-2">
        <SelectField
          id="heard-about-us"
          label="كيف سمعت عنا؟"
          options={whereHeardAboutUsOptions}
          value={data.whereHeardAboutUs}
          onChange={(value) => onFieldChange('whereHeardAboutUs', value)}
        />
        <SearchableTagsField
          id="friends-on-platform"
          label="هل يمكنك ذكر أسماء لأشخاص تعرفهم من تجمّع إبتكار"
          placeholder="اكتب اسم الشخص ثم اضغط Enter"
          options={[]}
          helperText="اذا كان انضمامك عبر دعوة من عضو في التجمّع، يرجى ذكر اسم العضو"
          initialSuggestions={[]}
          value={data.friendsOnPlatform}
          onChange={(value) => onFieldChange('friendsOnPlatform', value)}
        />
        <div className="md:col-span-2">
          <TextAreaField
            id="motivation-letter"
            label="خطاب الدافع"
            rows={5}
            value={data.motivationLetter}
            onChange={handleMotivationLetterChange}
            helperText="لماذا ترغب في الانضمام إلى مجتمعنا؟ ما الذي تأمل في تحقيقه أو المساهمة به؟"
            error={getMotivationLetterError()}
          />
        </div>
        <div
          ref={volunteeringAreaRef}
          className="relative isolate overflow-hidden md:col-span-2 rounded-2xl border border-emerald-200 bg-gradient-to-b from-emerald-50 to-teal-50 p-4 shadow-sm md:p-5"
        >
          <div className="pointer-events-none absolute left-0 right-0 top-0 -z-10 h-[240px] overflow-hidden md:h-[280px]">
            {VOLUNTEER_CIRCLE_STYLES.map((circleClassName, index) => (
              <span
                key={circleClassName}
                data-volunteer-circle
                className={`absolute rounded-full will-change-transform ${circleClassName}`}
                style={volunteerCirclePositions[index]}
              />
            ))}
          </div>
          <p className="mb-2 inline-block rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-700">
            مساحة التطوع
          </p>
          <div className="max-w-xl">
            <SelectField
              id="volunteering-interest"
              label="الاهتمام بالتطوع"
              options={volunteeringInterestOptions}
              value={data.interestInVolunteering}
              helperText="اختر ما إذا كنت مهتمّاً بالمشاركة في الأنشطة التّطوعيّة في تجمّع إبتكار"
              onChange={(value) => onFieldChange('interestInVolunteering', value)}
              helperTextPosition="above"
            />
          </div>

          {(data.interestInVolunteering === 'yes' || data.interestInVolunteering === 'maybe') && (
            <div className="mt-4 grid gap-4 rounded-xl border border-emerald-200 bg-white/80 p-4 md:grid-cols-2">
              <div className="md:col-span-2">
                <TextAreaField
                  id="previous-experience"
                  label="الخبرات التطوعيّة السابقة"
                  rows={3}
                  value={data.previousExperience}
                  onChange={(value) => onFieldChange('previousExperience', value)}
                  helperText="حدّثنا عن خبراتك السابقة في التطوع لكي يسهل علينا إيجاد فرص تطوّع مناسبة لك في المستقبل!"
                />
              </div>
              <div className="flex flex-col gap-2 text-sm font-medium text-slate-700 md:col-span-2">
                <span>فصيلة الدم</span>
                <div className="grid grid-cols-4 gap-2">
                  {bloodTypeOptions.map((option) => {
                    const isSelected = data.bloodType === option.value

                    return (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() =>
                          onFieldChange('bloodType', isSelected ? '' : option.value)
                        }
                        className={`h-10 rounded-lg border text-sm font-semibold transition ${
                          isSelected
                            ? 'border-rose-400 bg-rose-50 text-rose-700'
                            : 'border-slate-300 bg-white text-slate-700 hover:border-rose-300'
                        }`}
                        aria-pressed={isSelected}
                        aria-label={`فصيلة الدم ${option.label}`}
                      >
                        {option.label}
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </SectionCard>
  )
}
