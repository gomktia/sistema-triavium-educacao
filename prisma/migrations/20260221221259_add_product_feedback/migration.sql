-- CreateEnum
CREATE TYPE "FeedbackStatus" AS ENUM ('PENDING', 'REVIEWING', 'PLANNED', 'IMPLEMENTED', 'REJECTED');

-- CreateTable
CREATE TABLE "product_feedbacks" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "status" "FeedbackStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "product_feedbacks_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "product_feedbacks_tenantId_idx" ON "product_feedbacks"("tenantId");

-- CreateIndex
CREATE INDEX "product_feedbacks_userId_idx" ON "product_feedbacks"("userId");

-- CreateIndex
CREATE INDEX "product_feedbacks_status_idx" ON "product_feedbacks"("status");

-- AddForeignKey
ALTER TABLE "product_feedbacks" ADD CONSTRAINT "product_feedbacks_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_feedbacks" ADD CONSTRAINT "product_feedbacks_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
