-- AlterTable: Float to Decimal for money fields
ALTER TABLE "Course" ALTER COLUMN "price" SET DATA TYPE DECIMAL(10,2) USING "price"::decimal;
ALTER TABLE "Order" ALTER COLUMN "amount" SET DATA TYPE DECIMAL(10,2) USING "amount"::decimal;
ALTER TABLE "Order" ALTER COLUMN "taxAmount" SET DATA TYPE DECIMAL(10,2) USING "taxAmount"::decimal;
ALTER TABLE "Order" ALTER COLUMN "commissionAmount" SET DATA TYPE DECIMAL(10,2) USING "commissionAmount"::decimal;
ALTER TABLE "Order" ALTER COLUMN "instructorNetAmount" SET DATA TYPE DECIMAL(10,2) USING "instructorNetAmount"::decimal;
ALTER TABLE "Payment" ALTER COLUMN "amount" SET DATA TYPE DECIMAL(10,2) USING "amount"::decimal;
ALTER TABLE "Coupon" ALTER COLUMN "discountValue" SET DATA TYPE DECIMAL(10,2) USING "discountValue"::decimal;
ALTER TABLE "PlatformSettings" ALTER COLUMN "commissionPercent" SET DATA TYPE DECIMAL(5,2) USING "commissionPercent"::decimal;
ALTER TABLE "PlatformSettings" ALTER COLUMN "vatPercent" SET DATA TYPE DECIMAL(5,2) USING "vatPercent"::decimal;

-- CreateIndex
CREATE UNIQUE INDEX "Payment_providerRef_key" ON "Payment"("providerRef");

-- CreateIndex
CREATE UNIQUE INDEX "Certificate_userId_courseId_key" ON "Certificate"("userId", "courseId");
