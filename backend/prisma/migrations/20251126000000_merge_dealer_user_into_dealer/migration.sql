-- CreateEnum for DealerRole (replacing DealerUserRole)
CREATE TYPE "DealerRole" AS ENUM ('OWNER', 'STAFF');

-- Step 1: Add new columns to dealer table
ALTER TABLE "dealer" ADD COLUMN IF NOT EXISTS "name" TEXT;
ALTER TABLE "dealer" ADD COLUMN IF NOT EXISTS "role" "DealerRole" DEFAULT 'OWNER';
ALTER TABLE "dealer" ADD COLUMN IF NOT EXISTS "dealer_id" INTEGER;

-- Step 2: Make existing dealer columns nullable (for staff members)
ALTER TABLE "dealer" ALTER COLUMN "company_name" DROP NOT NULL;
ALTER TABLE "dealer" ALTER COLUMN "org_number" DROP NOT NULL;
ALTER TABLE "dealer" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "dealer" ALTER COLUMN "status" DROP NOT NULL;

-- Step 3: Set name for existing dealers (use contactPerson or companyName as fallback)
UPDATE "dealer"
SET "name" = COALESCE("contact_person", "company_name", 'Unknown')
WHERE "name" IS NULL;

-- Step 4: Make name NOT NULL after setting values
ALTER TABLE "dealer" ALTER COLUMN "name" SET NOT NULL;

-- Step 5: Migrate data from dealer_user to dealer table
INSERT INTO "dealer" (
  "email",
  "password_hash",
  "name",
  "phone",
  "role",
  "is_active",
  "password_reset_token",
  "password_reset_expiry",
  "dealer_id",
  "created_at",
  "updated_at"
)
SELECT
  "email",
  "password_hash",
  "name",
  "phone",
  'STAFF'::"DealerRole",
  "is_active",
  "password_reset_token",
  "password_reset_expiry",
  "dealer_id",
  "created_at",
  "updated_at"
FROM "dealer_user";

-- Step 6: Update warranty registeredBy references
-- Map dealer_user IDs to new dealer IDs
WITH dealer_user_mapping AS (
  SELECT
    du.id as old_id,
    d.id as new_id
  FROM "dealer_user" du
  JOIN "dealer" d ON d.email = du.email AND d.role = 'STAFF'
)
UPDATE "warranty"
SET
  "registered_by_dealer_id" = dum.new_id,
  "registered_by_type" = 'DEALER'
FROM dealer_user_mapping dum
WHERE "warranty"."registered_by_dealer_user_id" = dum.old_id;

-- Step 7: Drop the old registered_by_dealer_user_id column
ALTER TABLE "warranty" DROP COLUMN IF EXISTS "registered_by_dealer_user_id";

-- Step 8: Drop the dealer_user table
DROP TABLE IF EXISTS "dealer_user";

-- Step 9: Drop the old DealerUserRole enum
DROP TYPE IF EXISTS "DealerUserRole";

-- Step 10: Add foreign key constraint for self-referential relationship
ALTER TABLE "dealer"
ADD CONSTRAINT "dealer_dealer_id_fkey"
FOREIGN KEY ("dealer_id")
REFERENCES "dealer"("id")
ON DELETE CASCADE
ON UPDATE CASCADE;

-- Step 11: Drop the unique constraint on org_number and recreate as partial unique
-- ALTER TABLE "dealer" DROP CONSTRAINT IF EXISTS "dealer_org_number_key";
-- CREATE UNIQUE INDEX "dealer_org_number_key" ON "dealer"("org_number") WHERE "org_number" IS NOT NULL;
