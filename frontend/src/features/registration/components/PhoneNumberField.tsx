import { PhoneInput } from 'react-international-phone'
import 'react-international-phone/style.css'

type PhoneNumberFieldProps = {
  value: string
  onChange: (value: string) => void
}

export function PhoneNumberField({ value, onChange }: PhoneNumberFieldProps) {
  return (
    <div className="md:col-span-2">
      <label htmlFor="phone-number" className="flex flex-col gap-2 text-sm font-medium text-slate-700">
        رقم الهاتف
        <div dir="ltr" className="phone-input-shell">
          <PhoneInput
            defaultCountry="tr"
            value={value}
            onChange={onChange}
            inputProps={{
              id: 'phone-number',
              className: 'w-full',
            }}
            countrySelectorStyleProps={{
              buttonClassName:
                'hover:bg-slate-50 transition',
            }}
          />
        </div>
      </label>
      <style>{`
        .phone-input-shell {
          --react-international-phone-height: 44px;
          --react-international-phone-border-radius: 0.75rem;
          --react-international-phone-border-color: #cbd5e1;
          --react-international-phone-background-color: #ffffff;
          --react-international-phone-text-color: #0f172a;
          --react-international-phone-dropdown-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
          --react-international-phone-selected-dropdown-item-background-color: #f0fdfa;
          --react-international-phone-flag-width: 18px;
          --react-international-phone-flag-height: 18px;
        }

        .phone-input-shell .react-international-phone-input-container {
          width: 100%;
          border: 1px solid #cbd5e1;
          border-radius: 0.75rem;
          background-color: #ffffff;
          overflow: visible;
        }

        .phone-input-shell .react-international-phone-input-container:focus-within {
          border-color: #14b8a6;
          box-shadow: 0 0 0 2px rgba(20, 184, 166, 0.1);
        }

        .phone-input-shell .react-international-phone-country-selector-dropdown {
          z-index: 60;
          border: 1px solid #e2e8f0;
          border-radius: 0.75rem;
          width: min(22rem, calc(100vw - 2rem));
          min-width: 18rem;
          left: 0;
          top: calc(100% + 0.5rem);
          max-height: 16rem;
        }

        .phone-input-shell .react-international-phone-country-selector-button {
          border: 0;
          background-color: #ffffff;
          box-shadow: none;
        }

        .phone-input-shell .react-international-phone-input {
          font-size: 0.875rem;
          padding: 0 0.75rem;
          background-color: #ffffff;
          border: 0;
        }
      `}</style>
    </div>
  )
}
