-- AlterTable
ALTER TABLE "dealer" ADD COLUMN     "owner_id" INTEGER;

-- AddForeignKey
ALTER TABLE "dealer" ADD CONSTRAINT "dealer_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "owner_api_cache"("id") ON DELETE SET NULL ON UPDATE CASCADE;
