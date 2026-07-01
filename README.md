# منصة بيت المصور التعليمية

منصة تعليمية عربية (RTL) لبيع وتقديم دورات التصوير الفوتوغرافي والفيديو — مبنية وفق وثيقة PRD v2.0.

## التقنيات

- **Next.js 16** (App Router) + TypeScript
- **PostgreSQL** + **Prisma 7**
- **Auth.js (NextAuth v5)** — مصادقة بالبريد وكلمة المرور
- **Zod** — التحقق من المدخلات
- **Tailwind CSS 4** — واجهة عربية متجاوبة

## المتطلبات

- Node.js 20+
- PostgreSQL 15+ (محلي، Docker، أو [Neon](https://neon.tech) مجاني)

## التشغيل السريع

### 1. إعداد البيئة

```powershell
copy .env.example .env
```

عدّل `.env` وأضف `DATABASE_URL` و`AUTH_SECRET` (سلسلة عشوائية طويلة).

### 2. قاعدة البيانات

**خيار أ — Docker:**

```powershell
docker compose up -d
npm run db:migrate
npm run db:seed
```

**خيار ب — PostgreSQL محلي أو Neon:**

ضع رابط الاتصال في `DATABASE_URL` ثم:

```powershell
npm run db:migrate
npm run db:seed
```

**خيار ج — Prisma Dev (بدون Docker):**

```powershell
npx prisma dev
```

### 3. تشغيل التطبيق

```powershell
npm install
npm run dev
```

افتح [http://localhost:3000](http://localhost:3000)

## البريد الإلكتروني

بدون إعداد SMTP، تُطبع الرسائل في الطرفية (mock). للإنتاج:

```env
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=your-user
SMTP_PASS=your-password
SMTP_FROM=noreply@baytalmosawer.com
```

## شهادات PDF

- تحميل من `/dashboard/certificates` → **تحميل PDF**
- API: `GET /api/certificates/[id]/pdf` (يتطلب تسجيل دخول)
- لدعم العربية في PDF: ضع `Cairo-Regular.ttf` في `assets/fonts/`

## Stripe (دفع حقيقي)

```env
PAYMENT_PROVIDER=stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

Webhook: `POST /api/webhooks/stripe` — حدث `checkout.session.completed`

## اختبارات E2E

```bash
npm run build && npm run start   # في طرفية
npm run test:e2e                 # في طرفية أخرى
```

## النشر (GitHub + Railway)

دليل كامل: [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md)

```powershell
# رفع GitHub
git add .
git commit -m "منصة بيت المصور — جاهزة للإنتاج"
git branch -M main
gh repo create baytalmosawer --private --source=. --push
```

على Railway: أضف PostgreSQL + اربط `DATABASE_URL` + اضبط `AUTH_SECRET` و`NEXTAUTH_URL`.

## حسابات تجريبية (بعد seed)

| الدور | البريد | كلمة المرور |
|-------|--------|-------------|
| مدير | `admin@baytalmosawer.com` | `Admin123!` |
| مدرب | `instructor@baytalmosawer.com` | `Instructor123!` |
| طالب | `student@baytalmosawer.com` | `Student123!` |

## هيكل المنصة

| المسار | الوصف |
|--------|--------|
| `/` | الصفحة الرئيسية |
| `/courses` | كتالوج الدورات |
| `/courses/[slug]` | تفاصيل الدورة والاشتراك |
| `/login` `/register` | المصادقة |
| `/dashboard` | لوحة الطالب |
| `/instructor` | لوحة المدرب |
| `/admin` | لوحة الإدارة |
| `/verify-certificate` | التحقق من الشهادة |

## مراحل التنفيذ (مكتملة)

| المرحلة | المحتوى |
|---------|---------|
| 0 | إعداد المشروع، Prisma، Tailwind، هوية بصرية |
| 1 | مصادقة، أدوار، middleware، تأكيد بريد |
| 2 | دورات، أقسام، دروس، مراجعة ونشر |
| 3 | تسجيلات، تقدم، مشغّل تعلم |
| 4 | طلبات، دفع تجريبي، ضريبة وعمولة، قسائم |
| 5 | اختبارات، شهادات، تحقق |
| 6 | تقييمات، Audit Log |
| 7 | تقارير، إشعارات بريد (وضع تجريبي) |
| 8 | بحث وتصفية، واجهة RTL |
| 9 | Stripe، جلسات، E2E، توكنات DB |

## قواعد العمل الحرجة

- السعر والضريبة والعمولة تُحسب على **الخادم**
- لا Enrollment لدورة مدفوعة إلا بعد `PAID`
- الشهادة عند 100% + اجتياز الاختبار (إن وُجد)
- المدرب يعدّل دوراته فقط؛ المدير ينشر
- لا حذف نهائي لدورة بها طلاب — أرشفة فقط

## أوامر مفيدة

```powershell
npm run dev          # تشغيل التطوير
npm run build        # بناء الإنتاج
npm run db:studio    # واجهة قاعدة البيانات
npm run db:seed      # بيانات تجريبية
```

## الملفات المرجعية

- `prisma/schema.prisma` — نموذج البيانات
- `lib/actions/` — منطق الأعمال (Server Actions)
- `docs/PRD.md` — وثيقة المتطلبات
- `docs/DEPLOYMENT.md` — دليل النشر على Railway

## ملاحظات

- **الدفع:** Mock Provider في MVP — جاهز لربط بوابة سعودية لاحقًا
- **البريد:** يُطبع في Console في بيئة التطوير
- **الفيديو:** روابط YouTube أو ملفات مباشرة عبر `videoRef`
