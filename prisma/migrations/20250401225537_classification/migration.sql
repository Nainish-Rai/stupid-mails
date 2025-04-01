/*
  Warnings:

  - The `emailVerified` column on the `user` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - A unique constraint covering the columns `[userId,gmailId]` on the table `Email` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Email" ADD COLUMN     "category" TEXT,
ADD COLUMN     "categoryConfidence" DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "user" ADD COLUMN     "password" TEXT,
ALTER COLUMN "email" DROP NOT NULL,
DROP COLUMN "emailVerified",
ADD COLUMN     "emailVerified" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "EmailClassification" (
    "id" TEXT NOT NULL,
    "emailId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "reason" TEXT,
    "classifiedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "feedback" TEXT,

    CONSTRAINT "EmailClassification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "EmailClassification_userId_category_idx" ON "EmailClassification"("userId", "category");

-- CreateIndex
CREATE INDEX "EmailClassification_classifiedAt_idx" ON "EmailClassification"("classifiedAt");

-- CreateIndex
CREATE UNIQUE INDEX "EmailClassification_emailId_userId_key" ON "EmailClassification"("emailId", "userId");

-- CreateIndex
CREATE INDEX "Email_userId_category_idx" ON "Email"("userId", "category");

-- CreateIndex
CREATE UNIQUE INDEX "Email_userId_gmailId_key" ON "Email"("userId", "gmailId");
