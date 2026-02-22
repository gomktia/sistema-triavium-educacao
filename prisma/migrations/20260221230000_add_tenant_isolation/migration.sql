-- Add tenantId to AuditLog for tenant isolation
ALTER TABLE "audit_logs" ADD COLUMN "tenantId" TEXT;

-- Update existing audit_logs to use the tenant from the user
UPDATE "audit_logs" al
SET "tenantId" = u."tenantId"
FROM "users" u
WHERE al."userId" = u."id";

-- Make tenantId required after migration
ALTER TABLE "audit_logs" ALTER COLUMN "tenantId" SET NOT NULL;

-- Add foreign key constraint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_tenantId_fkey"
FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Add index for tenant isolation
CREATE INDEX "audit_logs_tenantId_idx" ON "audit_logs"("tenantId");

-- Add tenantId to StudentMessage for tenant isolation
ALTER TABLE "student_messages" ADD COLUMN "tenantId" TEXT;

-- Update existing student_messages to use the tenant from the student
UPDATE "student_messages" sm
SET "tenantId" = s."tenantId"
FROM "students" s
WHERE sm."studentId" = s."id";

-- Make tenantId required after migration
ALTER TABLE "student_messages" ALTER COLUMN "tenantId" SET NOT NULL;

-- Add foreign key constraint
ALTER TABLE "student_messages" ADD CONSTRAINT "student_messages_tenantId_fkey"
FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Add index for tenant isolation
CREATE INDEX "student_messages_tenantId_idx" ON "student_messages"("tenantId");
