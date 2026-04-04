export type RegistrationFormData = {
  email: string
  enName: string
  arName: string
  phoneNumber: string
  sex: string
  dateOfBirth: string
  country: string
  region: string
  city: string
  address: string
  educationLevel: string
  school: string
  graduationYear: string
  fieldOfStudy: string
  bloodType: string
  socialMediaLinks: string
  interests: string
  skills: string
  languages: string
  whereHeardAboutUs: string
  motivationLetter: string
  friendsOnPlatform: string
  interestInVolunteering: string
  previousExperience: string
  bylawsAcknowledgement: string
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
  region: '',
  city: '',
  address: '',
  educationLevel: '',
  school: '',
  graduationYear: '',
  fieldOfStudy: '',
  bloodType: '',
  socialMediaLinks: '',
  interests: '',
  skills: '',
  languages: '',
  whereHeardAboutUs: '',
  motivationLetter: '',
  friendsOnPlatform: '',
  interestInVolunteering: '',
  previousExperience: '',
  bylawsAcknowledgement: '',
}
