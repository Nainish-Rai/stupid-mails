-- AlterTable
ALTER TABLE "EmailClassification" ADD COLUMN     "confidence" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
ADD COLUMN     "feedback" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "gmailAccessToken" TEXT,
ADD COLUMN     "gmailRefreshToken" TEXT,
ADD COLUMN     "tokenExpiresAt" TIMESTAMP(3);
