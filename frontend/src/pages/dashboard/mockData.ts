import type { HomeStatsResponse } from '../../types/home-stats'

export const MOCK_STATS: HomeStatsResponse = {
  overview: {
    totalMembers: 2841,
    cycleGrowthPercentage: 14,
    telegramActive: 1960,
    newMembers: 127,
    countriesCount: 23,
    universitiesCount: 78,
  },
  genderDistribution: {
    maleCount: 1562,
    femaleCount: 1279,
    malePercentage: 55,
    femalePercentage: 45,
  },
  ageDistribution: [
    { group: '15-18', count: 240 },
    { group: '19-22', count: 1070 },
    { group: '23-26', count: 930 },
    { group: '27-30', count: 420 },
    { group: '31+', count: 181 },
  ],
}

export const MOCK_NEWS = [
  {
    title: 'إطلاق برنامج تدريب الربيع 2026',
    date: '04 نيسان 2026',
    summary: 'فتح التسجيل لبرنامج مكثف في تطوير الويب والذكاء الاصطناعي لطلاب الجامعات.',
  },
  {
    title: 'جلسة تعريفية للأعضاء الجدد',
    date: '30 آذار 2026',
    summary: 'لقاء مباشر للتعريف بمسارات العمل والفرق التطوعية وآلية المتابعة الدورية.',
  },
  {
    title: 'تحديث مجتمع التلغرام',
    date: '25 آذار 2026',
    summary: 'إضافة قنوات فرعية للمشاريع وفتح مساحات أسبوعية للأسئلة التقنية.',
  },
]

export const MOCK_PROFILE = {
  enName: 'Ahmad Salem',
  arName: 'أحمد سالم',
  email: 'ahmad.salem@example.com',
  phoneNumber: '+90 5xx xxx xx xx',
  sex: 'ذكر',
  dateOfBirth: '2002-06-15',
  country: 'تركيا',
  region: 'إسطنبول',
  city: 'إسطنبول',
  address: 'Basaksehir Mah. No: 10',
  educationLevel: 'بكالوريوس (جامعة)',
  school: 'جامعة إسطنبول التقنية',
  graduationYear: '2025',
  fieldOfStudy: 'هندسة البرمجيات',
  bloodType: 'O+',
  skills: 'React, TypeScript, Node.js',
  languages: 'العربية, التركية, الإنجليزية',
}

export const MOCK_SETTINGS = {
  language: 'العربية',
  theme: 'فاتح',
  emailNotifications: true,
  telegramNotifications: true,
  weeklyDigest: false,
  profileVisibility: 'للأعضاء فقط',
}