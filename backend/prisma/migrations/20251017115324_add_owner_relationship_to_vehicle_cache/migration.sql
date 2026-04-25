-- AlterTable
ALTER TABLE "vehicle_api_cache" ADD COLUMN     "owner_id" INTEGER;

-- AddForeignKey
ALTER TABLE "vehicle_api_cache" ADD CONSTRAINT "vehicle_api_cache_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "owner_api_cache"("id") ON DELETE SET NULL ON UPDATE CASCADE;
