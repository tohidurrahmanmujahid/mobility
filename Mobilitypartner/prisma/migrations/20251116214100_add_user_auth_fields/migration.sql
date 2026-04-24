-- AlterTable: Add authentication and super admin fields to user table

-- Add super admin flag
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "is_super_admin" BOOLEAN NOT NULL DEFAULT false;

-- Add password reset fields for forgot password functionality
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "password_reset_token" TEXT;
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "password_reset_expiry" TIMESTAMP(3);

-- Add created_by_id for tracking which admin created this user
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "created_by_id" INTEGER;

-- Add foreign key constraint for created_by relationship
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'user_created_by_id_fkey'
    ) THEN
        ALTER TABLE "user" ADD CONSTRAINT "user_created_by_id_fkey"
            FOREIGN KEY ("created_by_id") REFERENCES "user"("id")
            ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS "idx_user_is_super_admin" ON "user"("is_super_admin");
CREATE INDEX IF NOT EXISTS "idx_user_password_reset_token" ON "user"("password_reset_token");
CREATE INDEX IF NOT EXISTS "idx_user_created_by_id" ON "user"("created_by_id");

-- Add comments for documentation
COMMENT ON COLUMN "user"."is_super_admin" IS 'Super admin users have unrestricted access to all features';
COMMENT ON COLUMN "user"."password_reset_token" IS 'Token for password reset verification';
COMMENT ON COLUMN "user"."password_reset_expiry" IS 'Expiry time for password reset token';
COMMENT ON COLUMN "user"."created_by_id" IS 'ID of admin user who created this account';
