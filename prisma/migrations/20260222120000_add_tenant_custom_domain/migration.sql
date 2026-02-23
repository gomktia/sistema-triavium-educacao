-- Add customDomain field to tenants for white-label support
ALTER TABLE "tenants" ADD COLUMN "customDomain" TEXT;

-- Add unique constraint on customDomain
CREATE UNIQUE INDEX "tenants_customDomain_key" ON "tenants"("customDomain");

-- Add index for fast domain lookups in middleware
CREATE INDEX "tenants_customDomain_idx" ON "tenants"("customDomain") WHERE "customDomain" IS NOT NULL;
