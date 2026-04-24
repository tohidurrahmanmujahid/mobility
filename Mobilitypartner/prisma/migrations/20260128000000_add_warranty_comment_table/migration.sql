-- CreateTable
CREATE TABLE "warranty_comment" (
    "id" SERIAL NOT NULL,
    "comment" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "warranty_id" INTEGER NOT NULL,
    "admin_id" INTEGER NOT NULL,

    CONSTRAINT "warranty_comment_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "warranty_comment" ADD CONSTRAINT "warranty_comment_warranty_id_fkey" FOREIGN KEY ("warranty_id") REFERENCES "warranty"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "warranty_comment" ADD CONSTRAINT "warranty_comment_admin_id_fkey" FOREIGN KEY ("admin_id") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
