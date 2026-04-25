/*
  Warnings:

  - You are about to drop the column `vehicle_data` on the `vehicle_api_cache` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "vehicle_api_cache" DROP COLUMN "vehicle_data",
ADD COLUMN     "co2" INTEGER,
ADD COLUMN     "color" TEXT,
ADD COLUMN     "eco_class" TEXT,
ADD COLUMN     "emission_class" TEXT,
ADD COLUMN     "fuel_type" TEXT,
ADD COLUMN     "inspection" TEXT,
ADD COLUMN     "inspection_valid_until" TIMESTAMP(3),
ADD COLUMN     "make" TEXT,
ADD COLUMN     "model" TEXT,
ADD COLUMN     "model_year" INTEGER,
ADD COLUMN     "power" INTEGER,
ADD COLUMN     "power_hp" INTEGER,
ADD COLUMN     "status" TEXT,
ADD COLUMN     "transmission" TEXT,
ADD COLUMN     "vehicle_type" TEXT,
ADD COLUMN     "vehicle_year" INTEGER,
ADD COLUMN     "vin" TEXT;
