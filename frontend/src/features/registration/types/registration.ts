export type RegistrationFormData = {
  email: string
  enName: string
  arName: string
  phoneNumber: string
  sex: string
  dateOfBirth: string
  country: string
  city: string
  address: string
  educationLevel: string
  school: string
  graduationYear: string
  fieldOfStudy: string
  bloodType: string
  socialMediaLinks: string
  biography: string
  interests: string
  skills: string
  languages: string
  whereHeardAboutUs: string
  motivationLetter: string
  friendsOnPlatform: string
  interestInVolunteering: string
  previousExperience: string
}

export type FormFieldName = keyof RegistrationFormData

export const initialRegistrationFormData: RegistrationFormData = {
  email: '',
  enName: '',
  arName: '',
  phoneNumber: '',
  sex: '',
  dateOfBirth: '',
  country: '',
  city: '',
  address: '',
  educationLevel: '',
  school: '',
  graduationYear: '',
  fieldOfStudy: '',
  bloodType: '',
  socialMediaLinks: '',
  biography: '',
  interests: '',
  skills: '',
  languages: '',
  whereHeardAboutUs: '',
  motivationLetter: '',
  friendsOnPlatform: '',
  interestInVolunteering: '',
  previousExperience: '',
}
