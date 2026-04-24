/*
  Warnings:

  - You are about to drop the column `description` on the `product` table. All the data in the column will be lost.
  - You are about to drop the column `is_active` on the `product` table. All the data in the column will be lost.
  - You are about to drop the column `rules` on the `product` table. All the data in the column will be lost.
  - Added the required column `max_age` to the `product` table without a default value. This is not possible if the table is not empty.
  - Added the required column `max_hk` to the `product` table without a default value. This is not possible if the table is not empty.
  - Added the required column `max_km` to the `product` table without a default value. This is not possible if the table is not empty.
  - Added the required column `premium` to the `product` table without a default value. This is not possible if the table is not empty.
  - Added the required column `vehicle_type` to the `product` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "product" DROP COLUMN "description",
DROP COLUMN "is_active",
DROP COLUMN "rules",
ADD COLUMN     "max_age" INTEGER NOT NULL,
ADD COLUMN     "max_hk" INTEGER NOT NULL,
ADD COLUMN     "max_km" INTEGER NOT NULL,
ADD COLUMN     "premium" DECIMAL(10,2) NOT NULL,
ADD COLUMN     "vehicle_type" TEXT NOT NULL;
