-- AlterTable
ALTER TABLE "claim" ALTER COLUMN "customer_description" DROP NOT NULL,
ALTER COLUMN "customer_address" DROP NOT NULL,
ALTER COLUMN "mileage" DROP NOT NULL;
