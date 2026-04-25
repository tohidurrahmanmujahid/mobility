/*
  Warnings:

  - Added the required column `customer_personnummer` to the `claim` table without a default value. This is not possible if the table is not empty.
  - Added the required column `customer_address` to the `claim` table without a default value. This is not possible if the table is not empty.
  - Added the required column `customer_postnummer` to the `claim` table without a default value. This is not possible if the table is not empty.
  - Added the required column `customer_ort` to the `claim` table without a default value. This is not possible if the table is not empty.
  - Added the required column `skadedatum` to the `claim` table without a default value. This is not possible if the table is not empty.
  - Added the required column `meter_reading_image` to the `claim` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "claim" ADD COLUMN     "customer_personnummer" TEXT NOT NULL,
ADD COLUMN     "customer_address" TEXT NOT NULL,
ADD COLUMN     "customer_postnummer" TEXT NOT NULL,
ADD COLUMN     "customer_ort" TEXT NOT NULL,
ADD COLUMN     "skadedatum" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "meter_reading_image" TEXT NOT NULL,
ADD COLUMN     "description_files" TEXT;
