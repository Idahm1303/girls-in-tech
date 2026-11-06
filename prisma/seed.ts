import { PrismaClient, UserRole, AccountStatus, Campus, EventStatus, OpportunityType, TeamRoleTitle, PostStatus } from "@prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();
const passwordHash = await hash("GirlsInTech2026!", 12);

const interestNames = [
  "Software Development",
  "Cybersecurity",
  "Cloud",
  "Data & AI",
  "Entrepreneurship",
  "UX Design",
  "Networking",
];

const mentors = [
  ["Lerato Mokoena", "lerato.mentor@git.tut.ac.za", "Software Engineer", "FinTech", "Software Development"],
  ["Amara Khumalo", "amara.mentor@git.tut.ac.za", "Security Analyst", "Cybersecurity", "Cybersecurity"],
  ["Naledi Maseko", "naledi.mentor@git.tut.ac.za", "Cloud Architect", "Cloud Services", "Cloud"],
] as const;

const students = [
  ["Zanele Dlamini", "zanele.student@git.tut.ac.za", 2, "Software Development"],
  ["Palesa Ndlovu", "palesa.student@git.tut.ac.za", 3, "Data & AI"],
  ["Thandi Mokoena", "thandi.student@git.tut.ac.za", 4, "Cybersecurity"],
  ["Kea Molefe", "kea.student@git.tut.ac.za", 1, "UX Design"],
  ["Amina Nkosi", "amina.student@git.tut.ac.za", 3, "Entrepreneurship"],
] as const;

const onboardingCampuses = [
  [Campus.SOSHANGUVE, "soshanguve", "Soshanguve"],
  [Campus.EMALAHLENI, "emalahleni", "Emalahleni"],
  [Campus.POLOKWANE, "polokwane", "Polokwane"],
  [Campus.GIYANE, "giyane", "Giyane"],
] as const;

const sampleFirstNames = ["Amara", "Lerato", "Naledi", "Zanele"] as const;

function daysFromNow(days: number) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  date.setHours(12, 0, 0, 0);
  return date;
}

function hoursAfter(date: Date, hours: number) {
  return new Date(date.getTime() + hours * 60 * 60 * 1000);
}

async function main() {
  const admin = await prisma.user.upsert({
    where: { email: "admin@git.tut.ac.za" },
    update: { name: "GiT Administrator", passwordHash, role: UserRole.ADMIN, status: AccountStatus.APPROVED },
    create: {
      name: "GiT Administrator",
      email: "admin@git.tut.ac.za",
      passwordHash,
      role: UserRole.ADMIN,
      status: AccountStatus.APPROVED,
      emailVerifiedAt: new Date(),
      consentAt: new Date(),
      campus: "Pretoria",
    },
  });

  const interestByName = new Map<string, string>();
  for (const name of interestNames) {
    const interest = await prisma.interest.upsert({
      where: { name },
      update: {},
      create: { name },
    });
    interestByName.set(name, interest.id);
  }

  const mentorIds: string[] = [];
  for (const [index, mentor] of mentors.entries()) {
    const [name, email, title, organization, interestName] = mentor;
    const user = await prisma.user.upsert({
      where: { email },
      update: { name, passwordHash, role: UserRole.MENTOR, status: AccountStatus.APPROVED },
      create: {
        name,
        email,
        passwordHash,
        role: UserRole.MENTOR,
        status: AccountStatus.APPROVED,
        emailVerifiedAt: new Date(),
        consentAt: new Date(),
        campus: "Pretoria",
        mentorProfile: {
          create: {
            title,
            organization,
            industry: organization,
            yearsExperience: 5 + index,
            bio: `I help emerging technologists build confidence and practical skills in ${interestName.toLowerCase()}.`,
            isPublished: true,
            interests: {
              create: { interestId: interestByName.get(interestName)! },
            },
          },
        },
      },
    });
    mentorIds.push(user.id);
  }

  for (const [name, email, year, interestName] of students) {
    const user = await prisma.user.upsert({
      where: { email },
      update: { name, passwordHash, role: UserRole.STUDENT, status: AccountStatus.APPROVED },
      create: {
        name,
        email,
        passwordHash,
        role: UserRole.STUDENT,
        status: AccountStatus.APPROVED,
        emailVerifiedAt: new Date(),
        consentAt: new Date(),
        campus: "Pretoria",
        yearOfStudy: year,
        isFinalYear: year === 4,
        studentProfile: {
          create: {
            bio: "Curious, collaborative, and ready to grow in tech.",
            skills: ["Problem solving", "Teamwork"],
          },
        },
      },
    });
    const interestId = interestByName.get(interestName);
    if (interestId) {
      await prisma.userInterest.upsert({
        where: { userId_interestId: { userId: user.id, interestId } },
        update: {},
        create: { userId: user.id, interestId },
      });
    }
  }

  const onboardingPasswordHash = await hash("ChangeMe123!", 12);
  for (const [campusIndex, [campus, campusSlug, campusName]] of onboardingCampuses.entries()) {
    for (const [memberIndex, firstName] of sampleFirstNames.entries()) {
      const email = `sample.${campusSlug}${memberIndex + 1}@gmail.com`;
      const surname = `${campusName}${memberIndex + 1}`;
      const studentNumber = String(260000001 + campusIndex * 4 + memberIndex);
      const profile = {
        studentNumber,
        campus,
        qualification: "Diploma in Information and Communication Technology",
        profileCompletedAt: new Date(),
      };

      await prisma.user.upsert({
        where: { email },
        update: {
          name: firstName,
          surname,
          passwordHash: onboardingPasswordHash,
          role: UserRole.STUDENT,
          status: AccountStatus.APPROVED,
          campus: campusName,
          consentAt: new Date(),
          studentProfile: { upsert: { create: profile, update: profile } },
        },
        create: {
          name: firstName,
          surname,
          email,
          passwordHash: onboardingPasswordHash,
          role: UserRole.STUDENT,
          status: AccountStatus.APPROVED,
          campus: campusName,
          emailVerifiedAt: new Date(),
          consentAt: new Date(),
          studentProfile: { create: profile },
        },
      });
    }
  }

  await prisma.user.upsert({
    where: { email: "incomplete.student@gmail.com" },
    update: {
      name: "Kea",
      surname: "Incomplete",
      passwordHash: onboardingPasswordHash,
      role: UserRole.STUDENT,
      status: AccountStatus.APPROVED,
      studentProfile: {
        upsert: {
          create: {},
          update: {
            studentNumber: null,
            campus: null,
            qualification: null,
            profileCompletedAt: null,
          },
        },
      },
    },
    create: {
      name: "Kea",
      surname: "Incomplete",
      email: "incomplete.student@gmail.com",
      passwordHash: onboardingPasswordHash,
      role: UserRole.STUDENT,
      status: AccountStatus.APPROVED,
      emailVerifiedAt: new Date(),
      consentAt: new Date(),
      studentProfile: { create: {} },
    },
  });

  const events = [
    ["welcome-to-git", "Welcome to Girls in Tech", "Meet the community, explore our plans, and find your place in GiT.", 7],
    ["code-and-connect", "Code & Connect", "An afternoon of friendly coding, conversation, and peer learning.", 14],
    ["cloud-careers", "Cloud Careers: Ask a Mentor", "Hear how women are building careers in cloud technology.", 24],
    ["innovation-showcase", "Student Innovation Showcase", "Celebrate student projects and meet the people behind the ideas.", 38],
  ] as const;

  for (const [slug, title, description, days] of events) {
    const startsAt = daysFromNow(days);
    await prisma.event.upsert({
      where: { slug },
      update: { title, description, status: EventStatus.PUBLISHED },
      create: {
        slug,
        title,
        description,
        startsAt,
        endsAt: hoursAfter(startsAt, 2),
        venue: "TUT Pretoria Campus, Faculty of ICT",
        status: EventStatus.PUBLISHED,
        publishedAt: new Date(),
      },
    });
  }

  const opportunities = [
    ["junior-software-wil", "Junior Software Developer WIL", "Mzansi Digital", OpportunityType.WIL, "Software Development", "Pretoria", 32, true],
    ["data-analytics-internship", "Data Analytics Internship", "BrightPath Labs", OpportunityType.WIL, "Data & AI", "Hybrid", 26, true],
    ["cybersecurity-wil", "Cybersecurity Work-Integrated Learning", "SecureFuture", OpportunityType.WIL, "Cybersecurity", "Johannesburg", 42, true],
    ["cloud-engineering-wil", "Cloud Engineering WIL Programme", "CloudNine Africa", OpportunityType.WIL, "Cloud", "Hybrid", 50, true],
    ["graduate-tech-learnership", "Graduate Technology Learnership", "Ubuntu Systems", OpportunityType.LEARNERSHIP, "Software Development", "Pretoria", 35, false],
    ["women-in-tech-learnership", "Women in Tech Learnership", "FutureFoundry", OpportunityType.LEARNERSHIP, "Networking", "Cape Town", 45, false],
    ["ict-innovation-bursary", "ICT Innovation Bursary", "Tshwane Futures Trust", OpportunityType.BURSARY, "Entrepreneurship", "South Africa", 60, false],
    ["digital-leaders-bursary", "Digital Leaders Study Grant", "Mahlangu Foundation", OpportunityType.BURSARY, "Data & AI", "South Africa", 72, false],
  ] as const;

  for (const [slug, title, organization, type, field, location, days, isFinalYearOnly] of opportunities) {
    await prisma.opportunity.upsert({
      where: { slug },
      update: { title, organization, type, field, location, isPublished: true },
      create: {
        slug,
        title,
        organization,
        description: `A learning opportunity for TUT students interested in ${field.toLowerCase()}. Build practical experience with a supportive team.`,
        type,
        field,
        location,
        isFinalYearOnly,
        closingDate: daysFromNow(days),
        applyUrl: "https://example.com/apply",
        isPublished: true,
      },
    });
  }

  const team = [
    ["Ayesha Mokoena", TeamRoleTitle.LEAD, "Leading the GiT community and helping turn ambitious ideas into action."],
    ["Lindiwe Nkosi", TeamRoleTitle.FACILITATOR, "Creating welcoming spaces to learn, share, and build together."],
    ["Mia Dube", TeamRoleTitle.JOURNALIST, "Sharing stories, ideas, and opportunities from across the community."],
    ["Rethabile Molefe", TeamRoleTitle.COMMITTEE, "Bringing members together through events and peer support."],
  ] as const;

  for (const [displayOrder, [name, roleTitle, bio]] of team.entries()) {
    const existing = await prisma.teamMember.findFirst({ where: { name } });
    if (existing) {
      await prisma.teamMember.update({ where: { id: existing.id }, data: { roleTitle, bio, displayOrder } });
    } else {
      await prisma.teamMember.create({ data: { name, roleTitle, bio, displayOrder } });
    }
  }

  await prisma.post.upsert({
    where: { slug: "welcome-to-girls-in-tech" },
    update: { status: PostStatus.PUBLISHED },
    create: {
      slug: "welcome-to-girls-in-tech",
      title: "Welcome to Girls in Tech",
      excerpt: "A new community for curious minds and bold futures at TUT Faculty of ICT.",
      content: "Girls in Tech brings students together to learn, connect, and create new opportunities in technology.",
      status: PostStatus.PUBLISHED,
      authorId: admin.id,
      publishedAt: new Date(),
    },
  });

  for (const mentorId of mentorIds) {
    const profile = await prisma.mentorProfile.findUnique({ where: { userId: mentorId } });
    if (!profile) continue;
    const existingSlot = await prisma.availabilitySlot.findFirst({
      where: { mentorProfileId: profile.id, startsAt: { gte: new Date() } },
    });
    if (!existingSlot) {
      const startsAt = daysFromNow(3);
      await prisma.availabilitySlot.create({
        data: {
          mentorProfileId: profile.id,
          startsAt,
          endsAt: hoursAfter(startsAt, 1),
        },
      });
    }
  }

  console.log(
    "Seed complete: admin, 3 mentors, 22 students (16 completed and 1 incomplete onboarding sample), events, opportunities, team, and interests.",
  );
}

main()
  .catch((error: unknown) => {
    console.error("Database seed failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
