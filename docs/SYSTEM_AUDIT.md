# تقرير فحص النظام — منصة بيت المصور

**التاريخ:** 1 يوليو 2026  
**الإصدار:** 5.0 (بعد المرحلة 5)

---

## التقييم العام

**🟢 جاهز للإطلاق التجريبي المتقدم — يحتاج مفاتيح إنتاج (SMTP, Stripe, AUTH_SECRET)**

| المؤشر | الحالة |
|--------|--------|
| Build / TypeScript | ✅ |
| PostgreSQL | ✅ 2 migrations |
| المسارات | **39** |
| CI (lint + build + E2E) | ✅ |
| بوابة دفع | ✅ Mock + Stripe |
| جلسات المستخدم | ✅ |
| توكنات التحقق | ✅ في DB |

---

## المرحلة 5 — ما تم تنفيذه ✅

| البند | التفاصيل |
|-------|----------|
| **Stripe** | `PAYMENT_PROVIDER=stripe` + Checkout + webhook |
| **Mock payment** | الافتراضي للتطوير |
| **fulfillPaidOrder** | خدمة موحّدة لإتمام الطلب |
| **VerificationToken** | في PostgreSQL بدل الذاكرة |
| **Rate limit** | تسجيل الدخول (10/15د) + التسجيل (5/ساعة) |
| **JWT refresh** | تحديث `status`/`role` من DB كل 60ث |
| **UserSession** | تتبع عند الدخول + إدارة من الملف الشخصي |
| **Playwright E2E** | `tests/e2e/smoke.spec.ts` |
| **CI** | seed + Playwright بعد البناء |

---

## حسابات seed

| الدور | البريد | كلمة المرور |
|-------|--------|-------------|
| مدير | admin@baytalmosawer.com | Admin123! |
| مدرب | instructor@baytalmosawer.com | Instructor123! |
| طالب | student@baytalmosawer.com | Student123! |

---

## إعداد Stripe

```env
PAYMENT_PROVIDER=stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_CURRENCY=sar
```

Webhook URL: `https://your-domain.com/api/webhooks/stripe`  
الأحداث: `checkout.session.completed`

---

## أوامر مفيدة

```bash
npm run dev          # تطوير
npm run build        # بناء
npm run test:e2e     # اختبارات E2E (يتطلب سيرفر على :3000 أو CI)
npx prisma db seed   # بيانات تجريبية
```

---

## فجوات طفيفة متبقية

- [ ] خط Cairo للـ PDF العربي (`assets/fonts/`)
- [ ] rate limit موزّع (Redis) للإنتاج متعدد العقد
- [ ] ترحيل middleware → proxy (Next.js 16)
- [ ] بوابة دفع محلية (Moyasar/Tap) كبديل لـ Stripe

---

*آخر build: نجح — 1 يوليو 2026*
