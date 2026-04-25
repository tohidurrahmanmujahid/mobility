-- AlterTable: Add is_active (re-add after being dropped) and soft delete fields to product table

-- Re-add is_active field (was removed in update_product_schema migration, then added back)
ALTER TABLE "product" ADD COLUMN IF NOT EXISTS "is_active" BOOLEAN NOT NULL DEFAULT true;

-- Add soft delete fields
ALTER TABLE "product" ADD COLUMN IF NOT EXISTS "is_deleted" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "product" ADD COLUMN IF NOT EXISTS "deleted_at" TIMESTAMP(3);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS "idx_product_is_active" ON "product"("is_active");
CREATE INDEX IF NOT EXISTS "idx_product_is_deleted" ON "product"("is_deleted");

-- Add comments for documentation
COMMENT ON COLUMN "product"."is_active" IS 'Whether product is currently active and available for new warranties';
COMMENT ON COLUMN "product"."is_deleted" IS 'Soft delete flag - true if product has been deleted';
COMMENT ON COLUMN "product"."deleted_at" IS 'Timestamp when product was soft deleted';
