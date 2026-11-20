ALTER TABLE "MentorProfile"
ADD COLUMN "sessionLengthMinutes" INTEGER NOT NULL DEFAULT 30,
ADD COLUMN "minimumNoticeHours" INTEGER NOT NULL DEFAULT 24,
ADD COLUMN "timezone" TEXT NOT NULL DEFAULT 'Africa/Johannesburg',
ADD COLUMN "weeklyAvailability" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
