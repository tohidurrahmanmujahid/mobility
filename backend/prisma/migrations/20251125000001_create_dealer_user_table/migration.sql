-- Create DealerUserRole enum
CREATE TYPE "DealerUserRole" AS ENUM ('OWNER', 'STAFF');

-- Create dealer_user table
CREATE TABLE "dealer_user" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "role" "DealerUserRole" NOT NULL DEFAULT 'STAFF',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "password_reset_token" TEXT,
    "password_reset_expiry" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "dealer_id" INTEGER NOT NULL,

    CONSTRAINT "dealer_user_pkey" PRIMARY KEY ("id")
);

-- Create unique index on email
CREATE UNIQUE INDEX "dealer_user_email_key" ON "dealer_user"("email");

-- Add foreign key constraint
ALTER TABLE "dealer_user" ADD CONSTRAINT "dealer_user_dealer_id_fkey" FOREIGN KEY ("dealer_id") REFERENCES "dealer"("id") ON DELETE CASCADE ON UPDATE CASCADE;
