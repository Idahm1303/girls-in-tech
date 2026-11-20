ALTER TYPE "MentorSessionFormat" ADD VALUE IF NOT EXISTS 'PHONE_CALL';
ALTER TYPE "MentorSessionFormat" ADD VALUE IF NOT EXISTS 'CHAT_MESSAGING';
ALTER TYPE "MentorSessionFormat" ADD VALUE IF NOT EXISTS 'NO_PREFERENCE';

ALTER TABLE "MentorProfile"
ADD COLUMN "motivationReasons" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
ADD COLUMN "motivationReasonsOther" TEXT,
ADD COLUMN "helpWith" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
ADD COLUMN "helpWithOther" TEXT,
ADD COLUMN "currentStatus" TEXT,
ADD COLUMN "currentStatusOther" TEXT,
ADD COLUMN "expertiseOther" TEXT,
ADD COLUMN "meetingFrequency" TEXT,
ADD COLUMN "menteeGroups" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
ADD COLUMN "languages" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
ADD COLUMN "languagesOther" TEXT,
ADD COLUMN "campusConnection" TEXT,
ADD COLUMN "referralSource" TEXT,
ADD COLUMN "referralSourceOther" TEXT;
