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

export interface MockProjectMilestone {
  title: string
  status: 'done' | 'in-progress' | 'todo'
}

export interface MockProject {
  id: string
  name: string
  owner: string
  progress: number
  phase: string
  description: string
  teamSize: number
  startedAt: string
  deadline: string
  tags: string[]
  milestones: MockProjectMilestone[]
}

export const MOCK_PROJECTS: MockProject[] = [
  {
    id: 'training-portal',
    name: 'بوابة التدريب الداخلية',
    owner: 'فريق الويب',
    progress: 72,
    phase: 'تطوير',
    description: 'منصة موحدة لعرض الدورات وإدارة تقدم الأعضاء داخل البرامج التدريبية.',
    teamSize: 6,
    startedAt: '2026-01-08',
    deadline: '2026-05-20',
    tags: ['Web', 'LMS', 'React'],
    milestones: [
      { title: 'تصميم تجربة المستخدم', status: 'done' },
      { title: 'تطوير لوحة المشرف', status: 'in-progress' },
      { title: 'تكامل نظام الإشعارات', status: 'todo' },
    ],
  },
  {
    id: 'student-guidance',
    name: 'منصة توجيه الطلاب',
    owner: 'فريق المنتج',
    progress: 45,
    phase: 'تصميم',
    description: 'مساحة تفاعلية لربط الطلاب بالمرشدين وتتبع الأهداف التعليمية لكل عضو.',
    teamSize: 4,
    startedAt: '2026-02-02',
    deadline: '2026-06-10',
    tags: ['Mentorship', 'Product'],
    milestones: [
      { title: 'جمع المتطلبات', status: 'done' },
      { title: 'النماذج الأولية', status: 'in-progress' },
      { title: 'اختبار المستخدمين', status: 'todo' },
    ],
  },
  {
    id: 'community-analytics',
    name: 'لوحة تحليلات المجتمع',
    owner: 'فريق البيانات',
    progress: 61,
    phase: 'تنفيذ',
    description: 'لوحة متابعة لمؤشرات المجتمع ومعدلات النشاط والمشاركة الشهرية.',
    teamSize: 5,
    startedAt: '2025-12-20',
    deadline: '2026-04-30',
    tags: ['Analytics', 'Dashboard'],
    milestones: [
      { title: 'نمذجة البيانات', status: 'done' },
      { title: 'بناء واجهة التحليلات', status: 'in-progress' },
      { title: 'توثيق المقاييس', status: 'todo' },
    ],
  },
  {
    id: 'events-archive',
    name: 'أرشيف الفعاليات',
    owner: 'فريق المحتوى',
    progress: 88,
    phase: 'مراجعة',
    description: 'أرشفة الفعاليات السابقة مع المحتوى المصاحب وإتاحتها للبحث والتصفح.',
    teamSize: 3,
    startedAt: '2025-11-14',
    deadline: '2026-04-12',
    tags: ['Content', 'Knowledge Base'],
    milestones: [
      { title: 'نقل السجلات القديمة', status: 'done' },
      { title: 'مراجعة الجودة', status: 'in-progress' },
      { title: 'الإطلاق الرسمي', status: 'todo' },
    ],
  },
]