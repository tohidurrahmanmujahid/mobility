-- Fortnox Integration Migration
-- This migration adds tables for Fortnox OAuth settings and customer mapping

-- Create FortnoxSettings table
CREATE TABLE IF NOT EXISTS "fortnox_settings" (
    "id" SERIAL PRIMARY KEY,
    "client_id" TEXT NOT NULL,
    "client_secret" TEXT NOT NULL,
    "redirect_uri" TEXT NOT NULL,
    "access_token" TEXT,
    "refresh_token" TEXT,
    "token_expiry" TIMESTAMP(3),
    "scopes" TEXT NOT NULL DEFAULT 'invoice customer order article',
    "is_active" BOOLEAN NOT NULL DEFAULT false,
    "last_sync_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create FortnoxCustomerMapping table
CREATE TABLE IF NOT EXISTS "fortnox_customer_mapping" (
    "id" SERIAL PRIMARY KEY,
    "dealer_id" INTEGER NOT NULL UNIQUE,
    "fortnox_customer_id" TEXT NOT NULL,
    "last_sync_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "fortnox_customer_mapping_dealer_id_fkey"
        FOREIGN KEY ("dealer_id") REFERENCES "dealer"("id") ON DELETE CASCADE
);

-- Create Invoice table (if it doesn't exist)
-- Note: The Invoice table should already exist in your schema
-- This is a safety check to create it if somehow missing
CREATE TABLE IF NOT EXISTS "invoice" (
    "id" SERIAL PRIMARY KEY,
    "invoice_number" TEXT NOT NULL UNIQUE,
    "fortnox_id" TEXT,
    "amount" DECIMAL(10,2) NOT NULL,
    "vat_amount" DECIMAL(10,2) NOT NULL,
    "total_amount" DECIMAL(10,2) NOT NULL,
    "due_date" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "fortnox_status" TEXT,
    "sent_at" TIMESTAMP(3),
    "paid_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dealer_id" INTEGER NOT NULL,
    "warranty_id" INTEGER NOT NULL,
    CONSTRAINT "invoice_dealer_id_fkey"
        FOREIGN KEY ("dealer_id") REFERENCES "dealer"("id") ON DELETE CASCADE,
    CONSTRAINT "invoice_warranty_id_fkey"
        FOREIGN KEY ("warranty_id") REFERENCES "warranty"("id") ON DELETE CASCADE
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS "idx_invoice_dealer_id" ON "invoice"("dealer_id");
CREATE INDEX IF NOT EXISTS "idx_invoice_warranty_id" ON "invoice"("warranty_id");
CREATE INDEX IF NOT EXISTS "idx_invoice_fortnox_id" ON "invoice"("fortnox_id");
CREATE INDEX IF NOT EXISTS "idx_invoice_status" ON "invoice"("status");
CREATE INDEX IF NOT EXISTS "idx_invoice_created_at" ON "invoice"("created_at");
CREATE INDEX IF NOT EXISTS "idx_fortnox_customer_mapping_dealer_id" ON "fortnox_customer_mapping"("dealer_id");

-- Create updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
DROP TRIGGER IF EXISTS update_fortnox_settings_updated_at ON "fortnox_settings";
CREATE TRIGGER update_fortnox_settings_updated_at
    BEFORE UPDATE ON "fortnox_settings"
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_invoice_updated_at ON "invoice";
CREATE TRIGGER update_invoice_updated_at
    BEFORE UPDATE ON "invoice"
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Migration complete
-- Run: npx prisma generate
-- to update Prisma Client
