-- CreateTable
CREATE TABLE "family_communications" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "family_communications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "family_communications_tenantId_idx" ON "family_communications"("tenantId");

-- CreateIndex
CREATE INDEX "family_communications_studentId_idx" ON "family_communications"("studentId");

-- CreateIndex
CREATE INDEX "family_communications_senderId_idx" ON "family_communications"("senderId");

-- AddForeignKey
ALTER TABLE "family_communications" ADD CONSTRAINT "family_communications_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "family_communications" ADD CONSTRAINT "family_communications_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "family_communications" ADD CONSTRAINT "family_communications_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
