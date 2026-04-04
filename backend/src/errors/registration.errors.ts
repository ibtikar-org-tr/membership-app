export class EmailAlreadyExistsError extends Error {
  constructor() {
    super('An account with this email already exists.')
    this.name = 'EmailAlreadyExistsError'
  }
}

export class PhoneNumberAlreadyExistsError extends Error {
  constructor() {
    super('An account with this phone number already exists.')
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
