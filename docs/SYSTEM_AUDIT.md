# تقرير فحص النظام — منصة بيت المصور

**التاريخ:** 1 يوليو 2026  
**الإصدار:** 6.0 (بعد النشر على Railway + فتح الرابط)

---

## التقييم العام

**🟡 جاهز للتجربة العامة المحدودة — يحتاج إصلاحات أمنية P0/P1 قبل الإطلاق التجاري الكامل**

| المؤشر | الحالة | ملاحظة |
|--------|--------|--------|
| Build / TypeScript | ✅ | 39 مساراً — نجح محلياً |
| ESLint | ⚠️ | 1 خطأ + 11 تحذيراً |
| الإنتاج (Railway) | ✅ | `baytalmosawereduuuuuuuuu-production.up.railway.app` |
| PostgreSQL | ✅ | 2 migrations + seed |
| CI على GitHub | ❌ | `.github/workflows/ci.yml` لم يُرفع (صلاحية `workflow`) |
| E2E محلياً | ⚠️ | `tests/e2e/smoke.spec.ts` موجود — غير مدمج في CI |
| بوابة دفع إنتاج | ⚠️ | `PAYMENT_PROVIDER=mock` |
| البريد إنتاج | ⚠️ | `EMAIL_MOCK=true` |
| Node على Railway | ✅ | Node 22 (إصلاح Prisma 7.8) |

### فحص الإنتاج الحي (1 يوليو 2026)

| المسار | HTTP |
|--------|------|
| `/` | 200 |
| `/login` | 200 |
| `/courses` | 200 |
| `/verify-certificate` | 200 |

---

## حسابات seed (الإنتاج)

| الدور | البريد | كلمة المرور |
|-------|--------|-------------|
| مدير | admin@baytalmosawer.com | Admin123! |
| مدرب | instructor@baytalmosawer.com | Instructor123! |
| طالب | student@baytalmosawer.com | Student123! |

> **تحذير:** غيّر كلمات المرور الافتراضية قبل الإطلاق العام.

---

## 1. الأمان والمصادقة

### ما يعمل بشكل جيد ✅

- NextAuth v5 + JWT + bcrypt (cost 12)
- `requireAuth()` / `requireRole()` على معظم server actions
- فحص ملكية الطلبات والتسجيلات والمراجعات
- حظر الحالات المحظورة عند تسجيل الدخول (`SUSPENDED`, `PENDING`, `PENDING_VERIFICATION`)
- تحديث `role`/`status` من DB كل 60 ثانية في `lib/auth/auth.ts`
- توكنات التحقق في PostgreSQL (استخدام لمرة واحدة)
- Stripe webhook مع التحقق من التوقيع
- تقييم الاختبارات على الخادم (الإجابات الصحيحة لا تُرسل للعميل)
- صفحات المعاينة تفحص `canPreviewLesson()` قبل عرض المحتوى

### ثغرات ومخاطر — حسب الأولوية

#### P0 — حرجة (قبل الإطلاق التجاري)

| # | المشكلة | الملف | التأثير |
|---|---------|-------|---------|
| 1 | **`getCourseBySlug` يُرجع كل الدروس** بما فيها `videoRef`, `content`, `fileRef` لأي مستدعٍ | `lib/actions/courses.ts` | تسريب محتوى مدفوع عبر استدعاء server action مباشر |
| 2 | **Middleware يستخدم JWT قديم** بدون تحديث DB (مثيل منفصل عن `auth.ts`) | `middleware.ts` | مستخدم موقوف أو مُنزَّل صلاحيته يبقى وصوله عبر middleware حتى انتهاء JWT |
| 3 | **`PAYMENT_PROVIDER=mock` على الإنتاج** | Railway Variables | دفع وهمي — تسجيل مجاني فعلياً |

#### P1 — عالية

| # | المشكلة | الملف | التأثير |
|---|---------|-------|---------|
| 4 | **إلغاء جلسة UserSession لا يُبطل JWT** | `lib/sessions/track.ts` | "تسجيل خروج الأجهزة الأخرى" شكلي فقط |
| 5 | **`suspendUser` لا يُبطل الجلسات** | `lib/actions/admin.ts` | الموقوف يبقى مسجلاً حتى انتهاء الكوكي |
| 6 | **تغيير كلمة المرور لا يُبطل الجلسات** | `lib/actions/auth.ts` | جلسات قديمة تبقى صالحة |
| 7 | **`hasPassedQuiz` بدون مصادقة** | `lib/actions/quizzes.ts` | استطلاع حالة اجتياز أي مستخدم |
| 8 | **Rate limit في الذاكرة** | `lib/rate-limit.ts` | لا يعمل عبر عدة عقد Railway |

#### P2 — متوسطة

| # | المشكلة | الملاحظة |
|---|---------|----------|
| 9 | لا rate limit على forgot/reset/verify-email | إساءة إرسال بريد / brute force |
| 10 | `createPasswordResetToken` لا يُلغي التوكنات السابقة | عدة روابط reset صالحة |
| 11 | `submitAttempt` بدون حد محاولات؛ `timeLimitMinutes` غير مُطبَّق | `lib/actions/quizzes.ts` |
| 12 | `createQuiz` بدون `courseId` يتجاوز فحص الصلاحية | `lib/actions/quizzes.ts` |
| 13 | شهادة PDF تعتمد `session.user.role` من JWT | `app/api/certificates/.../pdf/route.ts` |
| 14 | `x-forwarded-for` بدون تحقق proxy موثوق | تجاوز rate limit |

#### P3 — منخفضة

- `purgeExpiredTokens()` غير مجدولة
- `touchUserSession()` معرّفة وغير مستخدمة
- `trustHost: true` — مقبول خلف proxy موثوق
- صفحات admin بدون `requireRole` على مستوى الصفحة (الاعتماد على actions)

---

## 2. الميزات مقابل PRD (MVP)

### جاهزية حسب المجال

| المجال | النسبة | الحالة |
|--------|--------|--------|
| رحلة الطالب (تصفح → شراء → تعلم → اختبار → شهادة) | ~85% | 🟢 |
| رحلة المدرب (إنشاء → مراجعة → نشر) | ~75% | 🟡 |
| عمليات الإدارة | ~65% | 🟡 |
| إشعارات البريد (NOT-001) | ~35% | 🔴 |
| التقارير (REP-001–003) | ~50% | 🟡 |
| رفع الوسائط (R2/S3) | ~10% | 🔴 |

### مصفوفة الميزات

| الميزة | الحالة | ملاحظات |
|--------|--------|---------|
| دورات + دورة حياة + كتالوج | ✅ | DRAFT → UNDER_REVIEW → PUBLISHED |
| دروس وأقسام | ⚠️ | Schema كامل؛ UI يضيف عنواناً فقط (VIDEO) |
| تسجيلات + تقدم | ⚠️ | يعمل؛ لا استئناف آخر درس؛ لا إلغاء تسجيل admin |
| اختبارات | ✅ | MCQ؛ TRUE_FALSE/TEXT في schema فقط |
| شهادات | ⚠️ | إصدار يدوي؛ PDF + تحقق عام؛ لا بريد عند الإصدار |
| دفع Mock | ✅ | فوري → تسجيل |
| دفع Stripe | ⚠️ | Checkout + webhook؛ استرداد Stripe غير مربوط |
| طلبات واسترداد | ⚠️ | DB فقط؛ `refundProviderPayment` مستورد وغير مستخدم |
| قسائم | ✅ | PERCENT/FIXED |
| إشعارات داخلية | ✅ | جرس + DB (PRD يؤجلها للمرحلة 2) |
| بريد SMTP/Mock | ⚠️ | تحقق + reset + تسجيل؛ باقي الأحداث ناقصة |
| مراجعات | ⚠️ | إضافة/عرض؛ admin يحذف بدل soft-hide |
| معاينة دروس | ✅ | `canPreviewLesson` + صفحة preview |
| لوحات الطالب/مدرب/إدارة | ⚠️ | موجودة؛ عمليات admin ناقصة |
| تقارير | ⚠️ | ملخص مالي؛ لا فلتر تاريخ/CSV/تقرير دورة UI |
| إعدادات المنصة | ⚠️ | عمولة/ضريبة/معاينة؛ لا صفحات ثابتة/شعار |
| تخزين خارجي | ❌ | `videoRef`/`fileRef` كـ URL فقط |
| بحث وترتيب | ⚠️ | بحث + فلاتر؛ لا "الأكثر شعبية" |
| Audit log | ⚠️ | تسجيل موجود؛ UI بدون فلترة/ترقيم |
| Auth كامل | ⚠️ | لا تغيير كلمة مرور من الملف؛ لا إنشاء مستخدم admin |

### المسارات المنفّذة (39)

```
/  /courses  /courses/[slug]  /courses/[slug]/preview/[lessonId]
/login  /register  /verify-email  /forgot-password  /become-instructor
/verify-certificate
/dashboard  /dashboard/my-courses  /dashboard/courses/[id]/learn|quiz
/dashboard/certificates  /dashboard/orders  /dashboard/profile
/instructor  /instructor/courses  /instructor/courses/new|[id]/edit  /instructor/students
/admin  /admin/users|instructors|courses|courses/review|categories|coupons
/admin/orders|reviews|reports|audit-logs|settings
/api/auth/[...nextauth]  /api/webhooks/stripe  /api/certificates/[id]/pdf
```

---

## 3. البنية التحتية والنشر

| البند | الحالة |
|-------|--------|
| GitHub | `zagweb101/baytalmosawereduuuuuuuuu` |
| Railway | مشروع `insightful-enjoyment` — Node 22 |
| `DATABASE_URL` | مرجع `${{Postgres.DATABASE_URL}}` |
| Migrations عند التشغيل | `prisma migrate deploy` في `start:railway` |
| Seed | تم يدوياً عبر `DATABASE_PUBLIC_URL` |
| `railway.toml` + `nixpacks.toml` | ✅ |
| CI | ملف محلي موجود — غير على GitHub |

### متغيرات الإنتاج الحالية

| المتغير | القيمة |
|---------|--------|
| `NODE_ENV` | production |
| `PAYMENT_PROVIDER` | mock |
| `EMAIL_MOCK` | true |
| `AUTH_SECRET` | مضبوط على Railway |
| SMTP / Stripe | غير مفعّل |

---

## 4. جودة الكود

| البند | الحالة |
|-------|--------|
| Build | ✅ نجح — 1 يوليو 2026 |
| ESLint | ⚠️ 1 error في effect (`setState` متزامن) + 11 unused imports |
| TypeScript | ✅ بدون أخطاء بناء |
| Middleware deprecation | ⚠️ Next.js 16 يوصي بـ `proxy` بدل `middleware` |
| خط Cairo PDF | ❌ `assets/fonts/` فارغ — PDF عربي محدود |
| اختبارات وحدة | ❌ غير موجودة |
| Playwright E2E | ⚠️ 4 اختبارات smoke — غير في CI |

---

## 5. فجوات PRD vs Schema

| PRD | الواقع |
|-----|--------|
| `PaymentStatus.SUCCESS` | `COMPLETED` |
| `Review.isHidden` | غير موجود — الحذف بدل الإخفاء |
| ساعات الدورة عشرية | `durationHours Int` |
| نموذج إشعار بريد | `Notification` in-app |
| اختبار واحد/دورة | Schema يسمح بعدة؛ التطبيق يستخدم `[0]` |

---

## 6. خارطة المراحل المقترحة

### المرحلة 6 — أمان وإطلاق (أولوية قصوى)

- [ ] إصلاح تسريب `getCourseBySlug` (تصفية حقول الدروس غير المعاينة)
- [ ] توحيد auth في middleware مع تحديث DB
- [ ] إبطال الجلسات عند suspend / reset password / revoke
- [ ] rate limit موزّع (Redis/Upstash) + حماية forgot/reset
- [ ] تفعيل Stripe أو بوابة محلية؛ إزالة mock من الإنتاج
- [ ] تغيير كلمات مرور seed

### المرحلة 7 — إكمال MVP وظيفياً

- [ ] محرر دروس كامل (فيديو/ملف/معاينة/ترتيب)
- [ ] رفع وسائط R2/S3
- [ ] استئناف آخر درس في صفحة التعلم
- [ ] إلغاء تسجيل admin + إدارة مستخدمين/أدوار
- [ ] استرداد Stripe فعلي
- [ ] تغطية أحداث البريد (NOT-001)
- [ ] تقارير: فلتر تاريخ + CSV + تقرير دورة

### المرحلة 8 — جودة وتشغيل

- [ ] رفع CI إلى GitHub (PAT بصلاحية workflow)
- [ ] إصلاح ESLint error
- [ ] ترحيل middleware → proxy
- [ ] خط Cairo للشهادات
- [ ] اختبارات E2E موسّعة (شراء، تعلم، شهادة)

### المرحلة 9 — تحسينات (ما بعد MVP)

- [ ] Moyasar/Tap كبديل Stripe
- [ ] صفحات ثابتة (عن المنصة/الشروط/الخصوصية)
- [ ] ترتيب "الأكثر شعبية" في الكتالوج
- [ ] فلترة audit log

---

## 7. أوامر مفيدة

```bash
npm run dev              # تطوير محلي
npm run build            # بناء إنتاج
npm run lint             # فحص ESLint
npm run test:e2e         # Playwright (سيرفر على :3000)
npx prisma db seed       # بيانات تجريبية
npx prisma migrate deploy # ترحيلات إنتاج
```

### إعداد Stripe (عند التفعيل)

```env
PAYMENT_PROVIDER=stripe
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_CURRENCY=sar
```

Webhook: `https://baytalmosawereduuuuuuuuu-production.up.railway.app/api/webhooks/stripe`

---

## الخلاصة

المنصة **تعمل على الإنتاج** مع بيانات seed ومسارات كاملة تقريباً. الأساس التقني قوي (Next.js 16, Prisma 7, Auth.js, PostgreSQL على Railway).

**قبل المراحل التالية يُنصح بشدة بمعالجة P0/P1 الأمنية** — خاصة تسريب محتوى الدروس، JWT القديم في middleware، وmock payment على الإنتاج.

بعد ذلك: إكمال محرر المحتوى، البريد، التقارير، ورفع CI.

---

*آخر build: نجح — 1 يوليو 2026*  
*آخر فحص إنتاج: HTTP 200 على المسارات الأساسية*
