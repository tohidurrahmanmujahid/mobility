-- CreateTable
CREATE TABLE "vehicle_api_cache" (
    "id" SERIAL NOT NULL,
    "registration_number" TEXT NOT NULL,
    "vehicle_data" JSONB NOT NULL,
    "last_fetched" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "vehicle_api_cache_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "vehicle_api_cache_registration_number_key" ON "vehicle_api_cache"("registration_number");
