-- CreateTable
CREATE TABLE "audit_log" (
    "id" SERIAL NOT NULL,
    "action" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "entity_id" TEXT NOT NULL,
    "user_id" INTEGER,
    "user_name" TEXT,
    "user_email" TEXT,
    "before" JSONB,
    "after" JSONB,
    "ip_address" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_log_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "audit_log_entity_entity_id_idx" ON "audit_log"("entity", "entity_id");
CREATE INDEX "audit_log_user_id_idx" ON "audit_log"("user_id");
CREATE INDEX "audit_log_created_at_idx" ON "audit_log"("created_at");
