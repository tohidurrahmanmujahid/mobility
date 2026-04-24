-- CreateEnum
CREATE TYPE "PhoneType" AS ENUM ('Landline', 'Mobile');

-- CreateTable
CREATE TABLE "owner_api_cache" (
    "id" SERIAL NOT NULL,
    "idnr" TEXT NOT NULL,
    "status" TEXT,
    "name" TEXT,
    "given_name" TEXT,
    "address" TEXT,
    "co" TEXT,
    "post_code" TEXT,
    "city" TEXT,
    "sni" JSONB,
    "municipality" TEXT,
    "municipality_code" TEXT,
    "county" TEXT,
    "county_code" TEXT,
    "phone" JSONB,
    "nix" BOOLEAN,
    "nix_date" TIMESTAMP(3),
    "protected" BOOLEAN,
    "legal_form" TEXT,
    "last_fetched" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "owner_api_cache_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "owner_api_cache_idnr_key" ON "owner_api_cache"("idnr");
