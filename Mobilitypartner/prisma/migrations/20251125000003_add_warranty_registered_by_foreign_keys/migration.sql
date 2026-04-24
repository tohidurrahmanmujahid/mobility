-- Add foreign key constraints for registered_by fields
ALTER TABLE "warranty" ADD CONSTRAINT "warranty_registered_by_user_id_fkey" 
  FOREIGN KEY ("registered_by_user_id") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "warranty" ADD CONSTRAINT "warranty_registered_by_dealer_id_fkey" 
  FOREIGN KEY ("registered_by_dealer_id") REFERENCES "dealer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "warranty" ADD CONSTRAINT "warranty_registered_by_dealer_user_id_fkey" 
  FOREIGN KEY ("registered_by_dealer_user_id") REFERENCES "dealer_user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Drop old registered_by_id column if it exists
ALTER TABLE "warranty" DROP COLUMN IF EXISTS "registered_by_id";
