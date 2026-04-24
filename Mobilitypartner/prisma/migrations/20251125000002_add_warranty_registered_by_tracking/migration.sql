-- Add registered_by tracking columns to warranty table
ALTER TABLE "warranty" ADD COLUMN IF NOT EXISTS "registered_by_type" TEXT;
ALTER TABLE "warranty" ADD COLUMN IF NOT EXISTS "registered_by_user_id" INTEGER;
ALTER TABLE "warranty" ADD COLUMN IF NOT EXISTS "registered_by_dealer_id" INTEGER;
ALTER TABLE "warranty" ADD COLUMN IF NOT EXISTS "registered_by_dealer_user_id" INTEGER;
ALTER TABLE "warranty" ADD COLUMN IF NOT EXISTS "registered_by_name" TEXT;
ALTER TABLE "warranty" ADD COLUMN IF NOT EXISTS "registered_by_email" TEXT;
