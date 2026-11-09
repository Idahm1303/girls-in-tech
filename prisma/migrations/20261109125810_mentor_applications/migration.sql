-- CreateEnum
CREATE TYPE "MentorApplicationStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'NEEDS_INFO', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "MentorSessionFormat" AS ENUM ('ONLINE', 'IN_PERSON', 'BOTH');

-- CreateEnum
CREATE TYPE "MentorMeetingTool" AS ENUM ('TEAMS', 'ZOOM', 'GOOGLE_MEET');

-- AlterEnum
ALTER TYPE "Campus" ADD VALUE 'ONLINE_ONLY';

-- AlterEnum
ALTER TYPE "NotificationType" ADD VALUE 'MENTOR_APPLICATION';
ALTER TYPE "NotificationType" ADD VALUE 'MENTOR_STATUS';

-- AlterTable
ALTER TABLE "MentorProfile" ADD COLUMN "availabilityNotes" TEXT NOT NULL DEFAULT '',
ADD COLUMN "campuses" "Campus"[] DEFAULT ARRAY[]::"Campus"[],
ADD COLUMN "company" TEXT NOT NULL DEFAULT '',
ADD COLUMN "consentGivenAt" TIMESTAMP(3),
ADD COLUMN "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN "isTutAlumna" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "jobTitle" TEXT NOT NULL DEFAULT '',
ADD COLUMN "linkedinUrl" TEXT,
ADD COLUMN "maxMentees" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN "meetingTool" "MentorMeetingTool" NOT NULL DEFAULT 'TEAMS',
ADD COLUMN "motivation" TEXT NOT NULL DEFAULT '',
ADD COLUMN "phone" TEXT NOT NULL DEFAULT '',
ADD COLUMN "photoFileId" TEXT,
ADD COLUMN "qualification" TEXT NOT NULL DEFAULT '',
ADD COLUMN "reviewNote" TEXT,
ADD COLUMN "reviewedAt" TIMESTAMP(3),
ADD COLUMN "reviewedById" TEXT,
ADD COLUMN "sessionFormat" "MentorSessionFormat" NOT NULL DEFAULT 'BOTH',
ADD COLUMN "status" "MentorApplicationStatus" NOT NULL DEFAULT 'PENDING';

-- CreateTable
CREATE TABLE "StoredFile" (
    "id" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "data" BYTEA NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "StoredFile_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "StoredFile_ownerId_kind_idx" ON "StoredFile"("ownerId", "kind");

-- CreateIndex
CREATE UNIQUE INDEX "MentorProfile_photoFileId_key" ON "MentorProfile"("photoFileId");

-- CreateIndex
CREATE INDEX "MentorProfile_status_createdAt_idx" ON "MentorProfile"("status", "createdAt");

-- AddForeignKey
ALTER TABLE "MentorProfile" ADD CONSTRAINT "MentorProfile_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MentorProfile" ADD CONSTRAINT "MentorProfile_photoFileId_fkey" FOREIGN KEY ("photoFileId") REFERENCES "StoredFile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StoredFile" ADD CONSTRAINT "StoredFile_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
