-- CreateTable: Add UserPermission table for granular admin permissions

CREATE TABLE IF NOT EXISTS "user_permission" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "permission" "Permission" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_permission_pkey" PRIMARY KEY ("id")
);

-- CreateIndex: Ensure a user can't have duplicate permissions
CREATE UNIQUE INDEX IF NOT EXISTS "user_permission_user_id_permission_key" ON "user_permission"("user_id", "permission");

-- CreateIndex: For efficient permission lookups by user
CREATE INDEX IF NOT EXISTS "idx_user_permission_user_id" ON "user_permission"("user_id");

-- AddForeignKey: Link permissions to users with cascade delete
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'user_permission_user_id_fkey'
    ) THEN
        ALTER TABLE "user_permission" ADD CONSTRAINT "user_permission_user_id_fkey"
            FOREIGN KEY ("user_id") REFERENCES "user"("id")
            ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

-- Add comment for documentation
COMMENT ON TABLE "user_permission" IS 'Granular permissions assigned to admin users';
COMMENT ON COLUMN "user_permission"."user_id" IS 'ID of the user who has this permission';
COMMENT ON COLUMN "user_permission"."permission" IS 'The specific permission granted';
