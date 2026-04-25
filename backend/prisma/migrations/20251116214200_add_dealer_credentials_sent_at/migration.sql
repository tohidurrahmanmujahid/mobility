-- AlterTable: Add credentials tracking field to dealer table

-- Add field to track when login credentials were sent to dealer
ALTER TABLE "dealer" ADD COLUMN IF NOT EXISTS "credentials_sent_at" TIMESTAMP(3);

-- Create index for querying dealers who haven't received credentials
CREATE INDEX IF NOT EXISTS "idx_dealer_credentials_sent_at" ON "dealer"("credentials_sent_at");

-- Add comment for documentation
COMMENT ON COLUMN "dealer"."credentials_sent_at" IS 'Timestamp when login credentials were sent to the dealer';
