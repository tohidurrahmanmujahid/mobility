-- CreateEnum: Add Permission enum for granular admin permissions
CREATE TYPE "Permission" AS ENUM (
    'DASHBOARD',
    'DEALERS',
    'NEW_DEALER',
    'PRODUCTS',
    'REGISTERED_PRODUCTS',
    'CLAIMS',
    'FINANCE',
    'SETTINGS'
);

-- CreateEnum: Add DealerStatus enum for tracking dealer partnership status
CREATE TYPE "DealerStatus" AS ENUM (
    'INKOMMEN',    -- Pending/Incoming - awaiting cooperation agreement
    'ACTIVE',      -- Active partner
    'INACTIVE'     -- Inactive/Suspended
);

-- Add status column to dealer table
ALTER TABLE "dealer" ADD COLUMN IF NOT EXISTS "status" "DealerStatus" NOT NULL DEFAULT 'INKOMMEN';

-- Create index for better query performance when filtering by dealer status
CREATE INDEX IF NOT EXISTS "idx_dealer_status" ON "dealer"("status");

-- Add comments for documentation
COMMENT ON TYPE "Permission" IS 'Granular permissions for admin users';
COMMENT ON TYPE "DealerStatus" IS 'Dealer partnership status: INKOMMEN (pending), ACTIVE, INACTIVE';
COMMENT ON COLUMN "dealer"."status" IS 'Current dealer partnership status';
