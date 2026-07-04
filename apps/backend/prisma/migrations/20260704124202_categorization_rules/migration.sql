-- CreateTable
CREATE TABLE "categorization_rules" (
    "id" TEXT NOT NULL,
    "keyword" TEXT NOT NULL,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "categoryId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "categorization_rules_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "categorization_rules_userId_priority_idx" ON "categorization_rules"("userId", "priority");

-- AddForeignKey
ALTER TABLE "categorization_rules" ADD CONSTRAINT "categorization_rules_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "categorization_rules" ADD CONSTRAINT "categorization_rules_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
