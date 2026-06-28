import {
  scrollToRegistrationField,
  type MissingRegistrationField,
} from '../../utils/registrationValidation'

type MissingRegistrationFieldsNoticeProps = {
  missingFields: MissingRegistrationField[]
  isFullyComplete: boolean
}

export function MissingRegistrationFieldsNotice({
  missingFields,
  isFullyComplete,
}: MissingRegistrationFieldsNoticeProps) {
  if (isFullyComplete) {
    return (
      <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800">
        جميع الحقول المطلوبة مكتملة. يمكنك إرسال التسجيل.
      </p>
    )
  }

  if (missingFields.length === 0) {
    return null
  }

  return (
    <div
      role="status"
      className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900"
    >
      <p className="font-semibold">
        {missingFields.length === 1
          ? 'حقل مطلوب واحد لم يُعبّأ بعد:'
          : `حقول مطلوبة (${missingFields.length}) لم تُعبّأ بعد:`}
      </p>
      <ul className="mt-2 list-disc space-y-1 pr-5 leading-7">
        {missingFields.map((field) => (
          <li key={field.fieldId}>
            <button
              type="button"
              onClick={() => scrollToRegistrationField(field.fieldId)}
              className="font-medium text-amber-950 underline-offset-4 transition hover:text-amber-700 hover:underline"
            >
              {field.label}
            </button>
          </li>
        ))}
      </ul>
      <p className="mt-2 text-xs leading-6 text-amber-800/90">
        اضغط على أي حقل للانتقال إليه مباشرة.
      </p>
    </div>
  )
}
