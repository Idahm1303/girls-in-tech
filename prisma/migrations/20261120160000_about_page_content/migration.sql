CREATE TABLE "AboutPageContent" (
    "id" TEXT NOT NULL,
    "introduction" TEXT NOT NULL,
    "whatWeDo" TEXT NOT NULL,
    "commitment" TEXT NOT NULL,
    "vision" TEXT NOT NULL,
    "mission" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AboutPageContent_pkey" PRIMARY KEY ("id")
);

INSERT INTO "TeamMember" ("id", "name", "roleTitle", "bio", "displayOrder")
SELECT
    'about-team-lead-placeholder',
    'GiT Lead',
    'LEAD',
    '',
    COALESCE((SELECT MAX("displayOrder") + 1 FROM "TeamMember"), 0)
WHERE NOT EXISTS (
    SELECT 1 FROM "TeamMember" WHERE "roleTitle" = 'LEAD'
);

INSERT INTO "TeamMember" ("id", "name", "roleTitle", "bio", "displayOrder")
SELECT
    'about-team-facilitator-placeholder',
    'Facilitator',
    'FACILITATOR',
    '',
    COALESCE((SELECT MAX("displayOrder") + 1 FROM "TeamMember"), 0)
WHERE NOT EXISTS (
    SELECT 1 FROM "TeamMember" WHERE "roleTitle" = 'FACILITATOR'
);

INSERT INTO "TeamMember" ("id", "name", "roleTitle", "bio", "displayOrder")
SELECT
    'about-team-journalist-placeholder',
    'Journalist',
    'JOURNALIST',
    '',
    COALESCE((SELECT MAX("displayOrder") + 1 FROM "TeamMember"), 0)
WHERE NOT EXISTS (
    SELECT 1 FROM "TeamMember" WHERE "roleTitle" = 'JOURNALIST'
);

INSERT INTO "TeamMember" ("id", "name", "roleTitle", "bio", "displayOrder")
SELECT
    'about-team-committee-placeholder',
    'Committee member',
    'COMMITTEE',
    '',
    COALESCE((SELECT MAX("displayOrder") + 1 FROM "TeamMember"), 0)
WHERE NOT EXISTS (
    SELECT 1 FROM "TeamMember" WHERE "roleTitle" = 'COMMITTEE'
);
