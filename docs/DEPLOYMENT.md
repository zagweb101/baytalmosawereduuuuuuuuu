# النشر على GitHub + Railway

## 1. رفع المشروع إلى GitHub

```powershell
cd c:\Users\alhay\OneDrive\Desktop\eduuuuuuu
git add .
git commit -m "منصة بيت المصور — جاهزة للإنتاج"
git branch -M main
gh repo create baytalmosawer --private --source=. --push
```

بدون `gh` CLI: أنشئ مستودعاً فارغاً على GitHub ثم:

```powershell
git remote add origin https://github.com/YOUR_USER/baytalmosawer.git
git push -u origin main
```

---

## 2. إعداد Railway

1. ادخل إلى [railway.app](https://railway.app) وسجّل الدخول.
2. **New Project** → **Deploy from GitHub repo** → اختر المستودع.
3. أضف **PostgreSQL** من لوحة المشروع (+ New → Database → PostgreSQL).
4. اربط `DATABASE_URL` بالتطبيق:
   - افتح خدمة التطبيق → **Variables** → **Add Reference** → `DATABASE_URL` من PostgreSQL.

---

## 3. متغيرات البيئة (Railway → Variables)

| المتغير | القيمة |
|---------|--------|
| `DATABASE_URL` | مرجع من PostgreSQL (تلقائي) |
| `AUTH_SECRET` | سلسلة عشوائية 32+ حرفاً |
| `NEXTAUTH_SECRET` | نفس `AUTH_SECRET` |
| `NEXTAUTH_URL` | `https://YOUR-APP.up.railway.app` |
| `NEXT_PUBLIC_SITE_URL` | نفس رابط التطبيق |
| `NODE_ENV` | `production` |
| `PAYMENT_PROVIDER` | `mock` أو `stripe` |
| `EMAIL_MOCK` | `true` (حتى تضبط SMTP) |

### اختياري — البريد

```
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=...
SMTP_PASS=...
SMTP_FROM=noreply@baytalmosawer.com
```

### اختياري — Stripe

```
PAYMENT_PROVIDER=stripe
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_CURRENCY=sar
```

Webhook URL: `https://YOUR-APP.up.railway.app/api/webhooks/stripe`

---

## 4. أول نشر

عند كل نشر، Railway يشغّل تلقائياً:

1. `npm ci` + `prisma generate` (postinstall)
2. `npm run build`
3. `prisma migrate deploy` + `next start` (start:railway)

### بذور البيانات (مرة واحدة)

```bash
npx prisma db seed
```

### تدوير كلمات مرور البذور (إلزامي على الإنتاج)

من Railway → Shell (مرة واحدة):

```bash
npm run rotate-seed-passwords
```

احفظ كلمات المرور المطبوعة فوراً — لا تُخزَّن في أي مكان آخر.

### فحص الصحة

`GET /api/health` — يتحقق من اتصال قاعدة البيانات وحالة الخدمات.

لوحة الإدارة → **إعدادات المنصة** تعرض حالة Stripe / SMTP / S3.

---

## 5. التحقق بعد النشر

- [ ] الصفحة الرئيسية تفتح
- [ ] `/login` يعمل
- [ ] `/courses` تعرض الدورات
- [ ] `/api/health` يُرجع `status: ok`
- [ ] **تدوير كلمات المرور:** `CONFIRM_ROTATE=1 npx tsx scripts/rotate-seed-passwords.ts` (Railway Shell)
- [ ] **Stripe (للإطلاق التجاري):** `PAYMENT_PROVIDER=stripe` + webhook على `/api/webhooks/stripe`

---

## 6. نطاق مخصص (اختياري)

Railway → Settings → **Networking** → **Custom Domain**  
حدّث `NEXTAUTH_URL` و`NEXT_PUBLIC_SITE_URL` بالنطاق الجديد.

---

## 7. CI على GitHub

ملف `.github/workflows/ci.yml` يشغّل تلقائياً عند كل push:

- migrate + seed + unit tests + lint + build + E2E

---

## استكشاف الأخطاء

| المشكلة | الحل |
|---------|------|
| Build فشل Prisma | تأكد من `DATABASE_URL` مضبوط قبل البناء |
| 502 بعد النشر | راجع Logs — غالباً `AUTH_SECRET` ناقص |
| تسجيل الدخول يفشل | `NEXTAUTH_URL` يجب أن يطابق رابط الإنتاج بالضبط |
| جداول فارغة | شغّل `npx prisma db seed` مرة واحدة |
