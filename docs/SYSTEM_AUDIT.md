# تقرير فحص النظام — منصة بيت المصور

**التاريخ:** 1 يوليو 2026  
**الإصدار:** 7.1 (فحص محدّث)

---

## التقييم العام

**🟢 جاهز للإطلاق التجريبي (Beta) — يحتاج Stripe/SMTP وكلمات مرور إنتاج قبل الإطلاق التجاري**

| المؤشر | الحالة | ملاحظة |
|--------|--------|--------|
| Build / TypeScript | ✅ | 39 مساراً — فُحص 1 يوليو 2026 |
| ESLint | ✅ | 0 أخطاء، 11 تحذيراً (unused imports) |
| الإنتاج Railway | ✅ | commit `0e5a737` — phase 6 |
| PostgreSQL | ✅ | **3 migrations** |
| CI على GitHub | ❌ | `.github/workflows/ci.yml` غير مرفوع |
| E2E | ⚠️ | `tests/e2e/smoke.spec.ts` — 4 اختبارات، غير في CI |
| الدفع إنتاج | ⚠️ | `PAYMENT_PROVIDER=mock` |
| البريد إنتاج | ⚠️ | `EMAIL_MOCK=true` |
| أمان الجلسات | ✅ | `sessionVersion` + إبطال |

### فحص الإنتاج الحي

| المسار | HTTP |
|--------|------|
| `/` | 200 |
| `/login` | 200 |
| `/courses` | 200 |
| `/verify-certificate` | 200 |

**الرابط:** https://baytalmosawereduuuuuuuuu-production.up.railway.app

---

## المرحلة 6 — ما تم إصلاحه ✅

| البند | التفاصيل |
|-------|----------|
| **تسريب محتوى الدروس** | `getCourseBySlug` يُرجع حقولاً عامة فقط؛ `getPreviewLessonContent` للمعاينة بعد فحص الصلاحية |
| **Middleware + JWT** | يستخدم `auth` الموحّد مع تحديث `role`/`status`/`sessionVersion` من DB كل 60ث |
| **إبطال الجلسات** | `sessionVersion` على User؛ `invalidateUserSessions()` عند التعليق وتغيير كلمة المرور |
| **ربط JWT بجهاز** | `sessionId` في JWT عبر `unstable_update` بعد الدخول |
| **إلغاء جلسة** | حذف `UserSession` + `signOut` إن كانت الجلسة الحالية |
| **hasPassedQuiz** | يتطلب مصادقة (المالك أو ADMIN) |
| **createQuiz** | يتطلب `courseId` إلزامياً |
| **Rate limit** | verify-email (10/15د)، forgot-password (5/س)، reset-password (10/س) |
| **توكن reset** | يُلغى السابق قبل إنشاء جديد |
| **PDF شهادة** | يقرأ الدور من DB عبر `getCurrentUser()` |

---

## الأمان — الحالة الحالية

### محمي ✅

- NextAuth v5 + bcrypt (cost 12)
- `requireAuth()` / `requireRole()` + فحص DB مباشر على server actions
- حظر الحالات عند الدخول + إبطال JWT عند التعليق/تغيير كلمة المرور
- توكنات التحقق في PostgreSQL (استخدام لمرة واحدة)
- Stripe webhook مع التحقق من التوقيع
- تقييم الاختبارات server-side
- Rate limit: login, register, verify-email, forgot/reset, verify-certificate

### مخاطر متبقية

| الأولوية | المشكلة | الحالة |
|----------|---------|--------|
| **P0** | `PAYMENT_PROVIDER=mock` على الإنتاج | ❌ دفع وهمي — يجب Stripe قبل الإطلاق التجاري |
| **P1** | Rate limit في الذاكرة (`Map`) | ⚠️ لا يعمل عبر عدة عقد Railway |
| **P1** | كلمات مرور seed افتراضية على الإنتاج | ⚠️ `Admin123!` إلخ — يجب تغييرها |
| **P2** | `refundProviderPayment` غير مربوط | ⚠️ استرداد DB فقط |
| **P2** | `submitAttempt` بدون حد محاولات | ⚠️ `timeLimitMinutes` غير مُطبَّق |
| **P3** | `purgeExpiredTokens()` غير مجدولة | منخفض |
| **P3** | Middleware deprecated → proxy (Next 16) | تنبيه فقط |
| **P3** | خط Cairo للـ PDF العربي | ❌ `assets/fonts/` فارغ |

---

## الميزات مقابل PRD (MVP)

### جاهزية حسب المجال

| المجال | النسبة | الحالة |
|--------|--------|--------|
| رحلة الطالب | ~85% | 🟢 |
| رحلة المدرب | ~75% | 🟡 |
| عمليات الإدارة | ~65% | 🟡 |
| إشعارات البريد | ~35% | 🔴 |
| التقارير | ~50% | 🟡 |
| رفع الوسائط R2/S3 | ~10% | 🔴 |

### مصفوفة مختصرة

| الميزة | الحالة | فجوة رئيسية |
|--------|--------|-------------|
| دورات + كتالوج + دورة حياة | ✅ | — |
| دروس وأقسام | ⚠️ | UI يضيف عنواناً فقط؛ لا رفع ملفات |
| تسجيلات + تقدم | ⚠️ | لا استئناف آخر درس؛ لا إلغاء admin |
| اختبارات + شهادات | ⚠️ | إصدار يدوي؛ لا بريد عند الإصدار |
| دفع Mock | ✅ | — |
| دفع Stripe | ⚠️ | مُنفَّذ؛ غير مفعّل على الإنتاج |
| قسائم | ✅ | — |
| إشعارات داخلية | ✅ | (PRD يؤجلها للمرحلة 2) |
| بريد SMTP | ⚠️ | 3 أحداث فقط من NOT-001 |
| معاينة دروس | ✅ | محمية بعد المرحلة 6 |
| لوحات الطالب/مدرب/إدارة | ⚠️ | عمليات admin ناقصة |
| تقارير | ⚠️ | لا CSV / فلتر تاريخ / تقرير دورة UI |
| تخزين خارجي | ❌ | URLs يدوية فقط |
| Auth | ⚠️ | لا تغيير كلمة مرور من الملف؛ لا إنشاء مستخدم admin |

### المسارات (39)

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

## البنية التحتية

| البند | الحالة |
|-------|--------|
| GitHub | `zagweb101/baytalmosawereduuuuuuuuu` |
| آخر commit | `0e5a737` — phase 6 security |
| Railway | Node 22، `prisma migrate deploy` عند التشغيل |
| Migrations | `init` → `phase5_tokens_sessions` → `phase6_session_version` |
| Seed | تم على الإنتاج |

### متغيرات الإنتاج (Railway)

| المتغير | القيمة |
|---------|--------|
| `NODE_ENV` | production |
| `PAYMENT_PROVIDER` | **mock** ← يحتاج تغيير |
| `EMAIL_MOCK` | **true** ← يحتاج تغيير |
| `AUTH_SECRET` / `NEXTAUTH_*` | ✅ مضبوط |
| `DATABASE_URL` | ✅ مرجع Postgres |
| SMTP / Stripe keys | ❌ غير مفعّل |

---

## جودة الكود

| البند | الحالة |
|-------|--------|
| Build | ✅ 1 يوليو 2026 |
| ESLint | ✅ 0 errors / 11 warnings |
| اختبارات وحدة | ❌ |
| Playwright E2E | ⚠️ smoke فقط |
| `docs/PRD.md` | ⚠️ قد يظهر فارغاً في OneDrive (الملف ~124KB على القرص) |

### تحذيرات ESLint (غير حرجة)

- unused imports في: `course-card`, `header`, `dashboard/page`, `orders.ts` (`refundProviderPayment`), وغيرها

---

## Migrations

| الملف | المحتوى |
|-------|---------|
| `20250701000000_init` | Schema أساسي |
| `20260701111321_phase5_tokens_sessions` | VerificationToken + UserSession |
| `20260701140000_phase6_session_version` | `User.sessionVersion` |

---

## خارطة المراحل القادمة

### المرحلة 7 — إكمال MVP (الأولوية التالية)

- [ ] تفعيل **Stripe** على Railway + webhook
- [ ] تفعيل **SMTP** وإزالة `EMAIL_MOCK`
- [ ] تغيير **كلمات مرور seed** على الإنتاج
- [ ] محرر دروس كامل (فيديو/ملف/معاينة/ترتيب)
- [ ] رفع وسائط R2/S3
- [ ] استئناف آخر درس في صفحة التعلم
- [ ] إدارة admin: إلغاء تسجيل، إنشاء مستخدم، تغيير دور
- [ ] استرداد Stripe (`refundProviderPayment`)
- [ ] أحداث البريد المتبقية (NOT-001)
- [ ] تقارير: فلتر تاريخ + CSV

### المرحلة 8 — جودة وتشغيل

- [ ] رفع CI لـ GitHub (PAT بصلاحية `workflow`)
- [ ] تنظيف ESLint warnings
- [ ] E2E موسّع
- [ ] خط Cairo للشهادات
- [ ] Rate limit موزّع (Redis/Upstash)

### المرحلة 9 — ما بعد MVP

- [ ] Moyasar/Tap
- [ ] صفحات ثابتة (عن/شروط/خصوصية)
- [ ] ترحيل middleware → proxy

---

## حسابات seed (الإنتاج — غيّرها!)

| الدور | البريد | كلمة المرور |
|-------|--------|-------------|
| مدير | admin@baytalmosawer.com | Admin123! |
| مدرب | instructor@baytalmosawer.com | Instructor123! |
| طالب | student@baytalmosawer.com | Student123! |

---

## الخلاصة

بعد **المرحلة 6**، المنصة **أكثر أماناً** وجاهزة لتجربة محدودة على الإنتاج. الثغرات الحرجة في تسريب المحتوى وJWT أُغلقت. العائق الرئيسي للإطلاق التجاري هو **mock payment** و**EMAIL_MOCK** و**كلمات المرور الافتراضية**.

**الخطوة التالية الموصى بها:** المرحلة 7 — تفعيل Stripe/SMTP ثم إكمال فجوات MVP الوظيفية.

---

## أوامر مفيدة

```bash
npm run dev              # تطوير
npm run build            # بناء
npm run lint             # ESLint
npm run test:e2e         # Playwright
npx prisma migrate deploy
npx prisma db seed
```

---

*آخر build: نجح — 1 يوليو 2026*  
*آخر فحص إنتاج: HTTP 200 على 4 مسارات*  
*آخر commit: `0e5a737` (phase 6 security)*
