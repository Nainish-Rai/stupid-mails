/*
  Warnings:

  - You are about to drop the column `category` on the `EmailClassification` table. All the data in the column will be lost.
  - You are about to drop the column `classifiedAt` on the `EmailClassification` table. All the data in the column will be lost.
  - You are about to drop the column `confidence` on the `EmailClassification` table. All the data in the column will be lost.
  - You are about to drop the column `feedback` on the `EmailClassification` table. All the data in the column will be lost.
  - You are about to drop the `Email` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `EmailLabel` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Label` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ProcessingStats` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `UserPreference` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `account` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `session` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `user` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `verification` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `waitlist_entry` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[emailId]` on the table `EmailClassification` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `classification` to the `EmailClassification` table without a default value. This is not possible if the table is not empty.
  - Added the required column `receivedAt` to the `EmailClassification` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `EmailClassification` table without a default value. This is not possible if the table is not empty.
  - Made the column `reason` on table `EmailClassification` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "Email" DROP CONSTRAINT "Email_userId_fkey";

-- DropForeignKey
ALTER TABLE "EmailLabel" DROP CONSTRAINT "EmailLabel_emailId_fkey";

-- DropForeignKey
ALTER TABLE "EmailLabel" DROP CONSTRAINT "EmailLabel_labelId_fkey";

-- DropForeignKey
ALTER TABLE "Label" DROP CONSTRAINT "Label_userId_fkey";

-- DropForeignKey
ALTER TABLE "ProcessingStats" DROP CONSTRAINT "ProcessingStats_userId_fkey";

-- DropForeignKey
ALTER TABLE "UserPreference" DROP CONSTRAINT "UserPreference_userId_fkey";

-- DropForeignKey
ALTER TABLE "account" DROP CONSTRAINT "account_userId_fkey";

-- DropForeignKey
ALTER TABLE "session" DROP CONSTRAINT "session_userId_fkey";

-- DropIndex
DROP INDEX "EmailClassification_classifiedAt_idx";

-- DropIndex
DROP INDEX "EmailClassification_emailId_userId_key";

-- DropIndex
DROP INDEX "EmailClassification_userId_category_idx";

-- AlterTable
ALTER TABLE "EmailClassification" DROP COLUMN "category",
DROP COLUMN "classifiedAt",
DROP COLUMN "confidence",
DROP COLUMN "feedback",
ADD COLUMN     "classification" TEXT NOT NULL,
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "receivedAt" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "sender" TEXT,
ADD COLUMN     "snippet" TEXT,
ADD COLUMN     "subject" TEXT,
ADD COLUMN     "threadId" TEXT,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ALTER COLUMN "reason" SET NOT NULL;

-- DropTable
DROP TABLE "Email";

-- DropTable
DROP TABLE "EmailLabel";

-- DropTable
DROP TABLE "Label";

-- DropTable
DROP TABLE "ProcessingStats";

-- DropTable
DROP TABLE "UserPreference";

-- DropTable
DROP TABLE "account";

-- DropTable
DROP TABLE "session";

-- DropTable
DROP TABLE "user";

-- DropTable
DROP TABLE "verification";

-- DropTable
DROP TABLE "waitlist_entry";

-- CreateTable
CREATE TABLE "Account" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT,
    "emailVerified" TIMESTAMP(3),
    "image" TEXT,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VerificationToken" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "Account_provider_providerAccountId_key" ON "Account"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "Session_sessionToken_key" ON "Session"("sessionToken");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_token_key" ON "VerificationToken"("token");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_identifier_token_key" ON "VerificationToken"("identifier", "token");

-- CreateIndex
CREATE UNIQUE INDEX "EmailClassification_emailId_key" ON "EmailClassification"("emailId");

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
