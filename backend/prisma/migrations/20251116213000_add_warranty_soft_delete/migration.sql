-- AlterTable: Add soft delete fields to warranty table
-- This migration adds is_deleted and deleted_at columns to support soft deletion of warranties
-- Soft-deleted warranties are hidden from normal queries but preserved for data integrity

ALTER TABLE "warranty" ADD COLUMN IF NOT EXISTS "is_deleted" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "warranty" ADD COLUMN IF NOT EXISTS "deleted_at" TIMESTAMP(3);

-- Create index for better query performance when filtering out deleted warranties
CREATE INDEX IF NOT EXISTS "idx_warranty_is_deleted" ON "warranty"("is_deleted");

-- Add comment for documentation
COMMENT ON COLUMN "warranty"."is_deleted" IS 'Soft delete flag - true if warranty has been deleted';
COMMENT ON COLUMN "warranty"."deleted_at" IS 'Timestamp when warranty was soft deleted';
