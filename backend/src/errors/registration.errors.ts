export class EmailAlreadyExistsError extends Error {
  constructor() {
    super('هناك حساب آخر يستخدم هذا البريد الإلكتروني. في حال كنت عضو ونسيت بياناتك يمكنك استرجامعا من قسم الأعضاء. تواصل مع بوت التلغرام في حال وجود أي استفسار.')
    this.name = 'EmailAlreadyExistsError'
  }
}

export class PhoneNumberAlreadyExistsError extends Error {
  constructor() {
    super('هناك حساب آخر يستخدم رقم الهاتف هذا. في حال كنت عضو ونسيت بياناتك يمكنك استرجامعا من قسم الأعضاء. تواصل مع بوت التلغرام في حال وجود أي استفسار.')
    this.name = 'PhoneNumberAlreadyExistsError'
  }
}

export class RegistrationEmailError extends Error {
  constructor(message: string, options?: { cause?: unknown }) {
    super(message)
    this.name = 'RegistrationEmailError'

    if (options?.cause !== undefined) {
      ;(this as Error & { cause?: unknown }).cause = options.cause
    }
  }
}
