# تطبيق العضوية

تطبيق ويب لإدارة عضويات الأعضاء مع تكامل Google Workspace و Moodle LMS، مبني باستخدام Hono، React، و Cloudflare Workers.

## الميزات

- **إدارة الأعضاء**: التسجيل عبر Google Forms أو API مباشر، تخزين البيانات في Google Sheets
- **المصادقة**: تسجيل الدخول باستخدام البريد الإلكتروني/رقم العضوية، مصادقة الإدارة
- **OAuth 2.0 API**: تكامل آمن للخدمات الخارجية (Chatbots، التطبيقات الأخرى)
- **التسجيل المباشر عبر API**: نقطة نهاية عامة لطلبات العضوية مع موافقة الإدارة
- **إعادة تعيين كلمة المرور**: إعادة تعيين كلمة المرور الآمنة عبر البريد الإلكتروني باستخدام رموز JWT
- **تكامل Google**: تكامل Google Sheets، Forms، و Gmail API
- **تكامل Moodle LMS**: إنشاء المستخدمين تلقائياً ومزامنة كلمات المرور
- **لوحة الإدارة**: إدارة التكوين، إدارة الأعضاء، إدارة OAuth Clients، الموافقة على التسجيلات، وسجلات التطبيق
- **المعالجة التلقائية**: وظيفة cron لمعالجة التسجيلات الجديدة كل 5 دقائق

## تعليمات الإعداد

### 1. تثبيت التبعيات

```bash
npm install
```

### 2. إعداد قاعدة البيانات

إنشاء قاعدة بيانات Cloudflare D1:

```bash
# إنشاء قاعدة البيانات
wrangler d1 create membership-app-db

# تحديث wrangler.jsonc بمعرف قاعدة البيانات المُعاد
# تشغيل الترحيلات
npm run db:migrate:local  # للتطوير المحلي
npm run db:migrate:remote # للإنتاج
```

### 3. متغيرات البيئة

إعداد متغيرات البيئة باستخدام أسرار Wrangler:

```bash
# كلمة مرور الإدارة
wrangler secret put ADMIN_PASSWORD

# مفتاح حساب خدمة Google API (تنسيق JSON)
wrangler secret put GOOGLE_API_KEY

# تكوين Moodle
wrangler secret put MOODLE_API_URL
wrangler secret put MOODLE_API_TOKEN

# تكوين SMTP
wrangler secret put SMTP_HOST
wrangler secret put SMTP_PORT
wrangler secret put SMTP_USER
wrangler secret put SMTP_PASS

# سر JWT لرموز إعادة تعيين كلمة المرور
wrangler secret put JWT_SECRET

# سر JWT لرموز OAuth
wrangler secret put OAUTH_JWT_SECRET

# بادئة رقم العضوية (اختياري، افتراضي: 'MEM')
wrangler secret put MEMBERSHIP_NUMBER_PREFIX
```

راجع `env.example` لتنسيق كل متغير بيئة.

### 4. إعداد Google API

1. إنشاء مشروع Google Cloud
2. تمكين Google Sheets API، Google Forms API، و Gmail API
3. إنشاء حساب خدمة وتحميل مفتاح JSON
4. مشاركة Google Sheets و Forms مع بريد حساب الخدمة
5. تعيين مفتاح JSON كمتغير البيئة `GOOGLE_API_KEY`

### 5. إعداد Moodle

1. تمكين خدمات الويب في إدارة Moodle
2. إنشاء رمز خدمة ويب بصلاحيات مناسبة
3. تعيين عنوان URL و رمز Moodle كمتغيرات بيئة

### 6. التطوير

```bash
npm run dev
```

### 7. النشر

```bash
npm run deploy
```

### 8. توليد الأنواع

توليد الأنواع لربطات Cloudflare:

```bash
npm run cf-typegen
```

## هيكل التطبيق

### الخلفية (`src/backend/`)
- **النماذج**: عمليات قاعدة البيانات وواجهات TypeScript
- **الخدمات**: Google API، Moodle API، البريد الإلكتروني، المصادقة، ووظائف cron
- **الموجهات**: نقاط نهاية API للمصادقة، الإدارة، وعمليات الأعضاء

### الواجهة الأمامية (`src/frontend/`)
- **المكونات**: مكونات React قابلة لإعادة الاستخدام (Button، Input، Card، إلخ)
- **الصفحات**: صفحات التطبيق الرئيسية (Landing، Login، Admin، إلخ)
- **التوجيه من جانب العميل**: توجيه بسيط قائم على الحالة

## الاستخدام

### للأعضاء
1. **التسجيل**: ملء نموذج Google (مُكوّن بواسطة الإدارة)
2. **البريد الإلكتروني الترحيبي**: تلقي بيانات الاعتماد عبر البريد الإلكتروني بعد معالجة وظيفة cron للتسجيل
3. **تسجيل الدخول**: استخدام البريد الإلكتروني/رقم العضوية وكلمة المرور
4. **إدارة الملف الشخصي**: تحديث المعلومات الشخصية
5. **إعادة تعيين كلمة المرور**: استخدام ميزة "نسيت كلمة المرور"

### للمدراء
1. **تسجيل الدخول**: استخدام "admin" كاسم مستخدم مع كلمة مرور الإدارة
2. **التكوين**: إعداد تعيينات نموذج وورقة Google
3. **إدارة OAuth Clients**: إنشاء وإدارة OAuth clients للخدمات الخارجية (Chatbots، تطبيقات أخرى)
4. **الموافقة على التسجيلات**: مراجعة والموافقة/رفض طلبات العضوية الجديدة
5. **إدارة الأعضاء**: عرض، تحرير، وحذف الأعضاء
6. **السجلات**: مراقبة نشاط التطبيق وحل المشكلات

### للخدمات الخارجية (Chatbots، التطبيقات)
1. **الحصول على OAuth Client**: طلب client_id و client_secret من الإدارة
2. **تكامل API**: راجع [API_INTEGRATION.md](API_INTEGRATION.md) للحصول على دليل التكامل الكامل
3. **مصادقة المستخدمين**: استخدام OAuth 2.0 Resource Owner Password Flow
4. **الحصول على معلومات العضو**: استرداد ملفات المستخدمين الكاملة بشكل آمن

## نقاط نهاية API

### المصادقة
- `POST /api/auth/login` - تسجيل دخول الأعضاء والإدارة
- `POST /api/auth/forgot-password` - طلب إعادة تعيين كلمة المرور
- `POST /api/auth/reset-password` - إعادة تعيين كلمة المرور برمز

### OAuth 2.0 (للخدمات الخارجية)
- `POST /api/oauth/token` - الحصول على access token للخدمات الخارجية
- `GET /api/oauth/user-info` - الحصول على معلومات العضو الكاملة (يتطلب token)
- `POST /api/oauth/introspect` - فحص صلاحية token (للتطوير)

**📖 للحصول على دليل التكامل الكامل مع أمثلة الكود، راجع [API_INTEGRATION.md](API_INTEGRATION.md)**

### التسجيل
- `POST /api/signup/request` - طلب عضوية جديدة (عام)
- `GET /api/signup/status/:email` - التحقق من حالة طلب التسجيل

### الإدارة
- `GET /api/admin/config` - الحصول على التكوين
- `POST /api/admin/config/google-form` - تحديث تكوين نموذج Google
- `POST /api/admin/config/google-sheet` - تحديث تكوين ورقة Google
- `GET /api/admin/members` - قائمة جميع الأعضاء
- `PUT /api/admin/members/:id` - تحديث عضو
- `DELETE /api/admin/members/:id` - حذف عضو
- `GET /api/admin/logs` - الحصول على سجلات التطبيق

#### إدارة OAuth Clients
- `GET /api/admin/oauth-clients` - قائمة جميع OAuth clients
- `POST /api/admin/oauth-clients` - إنشاء OAuth client جديد
- `PUT /api/admin/oauth-clients/:id` - تحديث OAuth client
- `DELETE /api/admin/oauth-clients/:id` - حذف OAuth client

#### الموافقة على التسجيلات
- `GET /api/admin/pending-signups` - قائمة طلبات التسجيل المعلقة
- `POST /api/admin/pending-signups/:id/approve` - الموافقة على طلب تسجيل
- `POST /api/admin/pending-signups/:id/reject` - رفض طلب تسجيل

### العضو
- `GET /api/member/:id` - الحصول على معلومات العضو
- `PUT /api/member/:id` - تحديث معلومات العضو
- `POST /api/member/:id/change-password` - تغيير كلمة المرور

## وظائف Cron

يقوم التطبيق بتشغيل وظائف cron كل 5 دقائق لـ:
- معالجة تقديمات نموذج Google الجديدة
- إنشاء حسابات مستخدمي Moodle
- إرسال رسائل بريد إلكتروني ترحيبية للأعضاء الجدد
- تنظيف رموز إعادة تعيين كلمة المرور المنتهية الصلاحية

## ميزات الأمان

- رموز إعادة تعيين كلمة المرور المبنية على JWT مع انتهاء الصلاحية
- OAuth 2.0 Resource Owner Password Flow للخدمات الخارجية
- Session management آمن مع HttpOnly cookies
- تجزئة كلمات المرور باستخدام bcrypt (12 rounds)
- حماية كلمة مرور الإدارة
- التحقق من صحة الإدخال وتعقيمه
- مصادقة Google API الآمنة
- تسجيل شامل للمسارات التدقيقية
- IP whitelisting لـ OAuth clients (اختياري)
- Token expiration وإدارة الجلسات

## استكشاف الأخطاء

1. **فحص السجلات**: استخدام لوحة الإدارة لعرض سجلات التطبيق
2. **مشكلات قاعدة البيانات**: التأكد من ترحيل قاعدة بيانات D1 بشكل صحيح
3. **أخطاء Google API**: التحقق من صلاحيات حساب الخدمة وتمكين API
4. **تكامل Moodle**: فحص رمز خدمة الويب والصلاحيات
5. **تسليم البريد الإلكتروني**: التحقق من بيانات اعتماد SMTP والإعدادات
6. **مشكلات OAuth**: التحقق من client_id و client_secret، فحص انتهاء الـ tokens

## تكامل الخدمات الخارجية

### نظرة عامة

يوفر تطبيق العضوية OAuth 2.0 API يسمح للخدمات الخارجية (مثل Chatbots، تطبيقات الويب، تطبيقات الموبايل) بمصادقة المستخدمين والوصول إلى معلومات ملفاتهم الشخصية بشكل آمن.

### البدء السريع للمطورين

#### 1. احصل على بيانات اعتماد OAuth

اتصل بمسؤول النظام للحصول على:
- `client_id`: معرّف فريد لخدمتك
- `client_secret`: مفتاح سري (قم بتخزينه بشكل آمن!)

#### 2. مصادقة مستخدم

```bash
curl -X POST https://your-api.com/api/oauth/token \
  -H "Content-Type: application/json" \
  -d '{
    "grant_type": "password",
    "client_id": "YOUR_CLIENT_ID",
    "client_secret": "YOUR_CLIENT_SECRET",
    "username": "user@example.com",
    "password": "user_password"
  }'
```

**Response:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "Bearer",
  "expires_in": 3600
}
```

#### 3. الحصول على معلومات المستخدم

```bash
curl -X GET https://your-api.com/api/oauth/user-info \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

**Response:**
```json
{
  "success": true,
  "user": {
    "membership_number": "MEM123456",
    "email": "user@example.com",
    "latin_name": "User Name",
    "phone": "+1234567890",
    ...
  }
}
```

### التوثيق الكامل

للحصول على:
- أمثلة كود كاملة (Node.js، Python، PHP)
- معالجة الأخطاء
- أفضل الممارسات الأمنية
- مواصفات OpenAPI

**راجع [API_INTEGRATION.md](API_INTEGRATION.md)** - دليل التكامل الشامل

### حالات الاستخدام

- **Chatbots**: السماح للمستخدمين بتسجيل الدخول والحصول على معلوماتهم
- **تطبيقات الموبايل**: مصادقة الأعضاء
- **الخدمات الداخلية**: الوصول الآمن إلى بيانات الأعضاء
- **Single Sign-On**: استخدام خدمة العضوية كمزود هوية
