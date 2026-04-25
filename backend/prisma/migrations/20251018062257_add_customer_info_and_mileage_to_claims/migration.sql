/*
  Warnings:

  - Added the required column `customer_email` to the `claim` table without a default value. This is not possible if the table is not empty.
  - Added the required column `customer_firstname` to the `claim` table without a default value. This is not possible if the table is not empty.
  - Added the required column `customer_lastname` to the `claim` table without a default value. This is not possible if the table is not empty.
  - Added the required column `customer_phone` to the `claim` table without a default value. This is not possible if the table is not empty.
  - Added the required column `mileage` to the `claim` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "claim" ADD COLUMN     "customer_email" TEXT NOT NULL,
ADD COLUMN     "customer_firstname" TEXT NOT NULL,
ADD COLUMN     "customer_lastname" TEXT NOT NULL,
ADD COLUMN     "customer_phone" TEXT NOT NULL,
ADD COLUMN     "mileage" TEXT NOT NULL;
