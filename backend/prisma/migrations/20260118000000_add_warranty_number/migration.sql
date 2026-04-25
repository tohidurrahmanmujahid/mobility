-- Add warranty_number column as nullable first
ALTER TABLE "warranty" ADD COLUMN IF NOT EXISTS "warranty_number" VARCHAR(255);

-- Populate existing warranties with generated warranty numbers based on their creation date and id
UPDATE "warranty"
SET "warranty_number" = CONCAT(
    'WRN-',
    TO_CHAR("created_at", 'YYYYMM'),
    '-',
    LPAD("id"::text, 4, '0')
)
WHERE "warranty_number" IS NULL;

-- Make the column non-nullable
ALTER TABLE "warranty" ALTER COLUMN "warranty_number" SET NOT NULL;

-- Add unique constraint
ALTER TABLE "warranty" ADD CONSTRAINT "warranty_warranty_number_key" UNIQUE ("warranty_number");
