-- Add authentication fields to dealer table
ALTER TABLE "dealer" ADD COLUMN IF NOT EXISTS "email" TEXT;
ALTER TABLE "dealer" ADD COLUMN IF NOT EXISTS "password_hash" TEXT;
ALTER TABLE "dealer" ADD COLUMN IF NOT EXISTS "phone" TEXT;
ALTER TABLE "dealer" ADD COLUMN IF NOT EXISTS "is_active" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "dealer" ADD COLUMN IF NOT EXISTS "password_reset_token" TEXT;
ALTER TABLE "dealer" ADD COLUMN IF NOT EXISTS "password_reset_expiry" TIMESTAMP(3);
ALTER TABLE "dealer" ADD COLUMN IF NOT EXISTS "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- Create unique index on dealer email
CREATE UNIQUE INDEX IF NOT EXISTS "dealer_email_key" ON "dealer"("email");

-- Update User table default role to ADMIN
ALTER TABLE "user" ALTER COLUMN "role" SET DEFAULT 'ADMIN';
