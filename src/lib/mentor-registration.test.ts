import assert from "node:assert/strict";
import test from "node:test";
import {
  mentorMemberApplicationSchema,
  mentorRegistrationSchema,
  mentorScheduleSchema,
  MENTOR_EXPERTISE,
} from "@/lib/mentor-validation";
import {
  buildMentorAvailabilityOccurrences,
  mentorSessionStartMinutes,
  parseMentorLocalDateTime,
  uniqueMentorAvailabilitySlots,
} from "@/lib/mentor-schedule";
import {
  DUPLICATE_MENTOR_EMAIL_ERROR,
  registerMentor,
} from "@/lib/mentor-service";
import {
  canBrowseMentors,
  canAccessAdmin,
  canMentorAppearInDirectory,
  isApprovedMentor,
} from "@/lib/mentor-access";
import { postLoginPath } from "@/lib/account-routing";

function application(overrides: Record<string, unknown> = {}) {
  return {
    name: "Amara",
    surname: "Mokoena",
    email: "amara@example.com",
    password: "ChangeMe123!",
    confirmPassword: "ChangeMe123!",
    phone: "+27 11 123 4567",
    jobTitle: "Software Engineer",
    company: "Example Tech",
    industry: "Software Development",
    yearsExperience: "1-3",
    qualification: "BSc Computer Science",
    isTutAlumna: "yes",
    bio: "I enjoy helping young women start and grow their technology careers.",
    linkedinUrl: "https://www.linkedin.com/in/amara",
    expertise: ["Software Development"],
    expertiseOther: "",
    sessionFormat: "NO_PREFERENCE",
    meetingTool: "TEAMS",
    campuses: ["ONLINE_ONLY"],
    maxMentees: "3",
    sessionLengthMinutes: "30",
    minimumNoticeHours: "24",
    availability: ["0:540"],
    motivationReasons: ["Give back what I've learned"],
    motivationReasonsOther: "",
    helpWith: ["Finding a career direction"],
    helpWithOther: "",
    currentStatus: "Industry professional",
    currentStatusOther: "",
    meetingFrequency: "",
    menteeGroups: [],
    languages: [],
    languagesOther: "",
    campusConnection: "",
    referralSource: "",
    referralSourceOther: "",
    motivation: "I want to support girls as they build confidence in technology.",
    consentPublicProfile: true,
    consentCodeOfConduct: true,
    consentPrivacy: true,
    ...overrides,
  };
}

test("successfully registers a mentor application", async () => {
  let created = false;
  const parsed = mentorRegistrationSchema.parse(application());
  const result = await registerMentor(parsed, "hashed-password", {
    async emailExists() {
      return false;
    },
    async createApplication(fields, passwordHash) {
      created = fields.email === parsed.email && passwordHash === "hashed-password";
    },
  });
  assert.deepEqual(result, { ok: true });
  assert.equal(created, true);
});

test("existing members can submit mentor details without creating another password", () => {
  const memberApplication = Object.fromEntries(
    Object.entries(application()).filter(
      ([field]) => field !== "password" && field !== "confirmPassword",
    ),
  );
  assert.equal(mentorMemberApplicationSchema.safeParse(memberApplication).success, true);
});

test("rejects a duplicate mentor email", async () => {
  const result = await registerMentor(mentorRegistrationSchema.parse(application()), "hash", {
    async emailExists() {
      return true;
    },
    async createApplication() {
      assert.fail("duplicate email must not create a mentor");
    },
  });
  assert.deepEqual(result, { ok: false, message: DUPLICATE_MENTOR_EMAIL_ERROR });
});

test("rejects mismatched mentor passwords", () => {
  const result = mentorRegistrationSchema.safeParse(
    application({ confirmPassword: "not-the-same" }),
  );
  assert.equal(result.success, false);
  if (!result.success) {
    assert.ok(result.error.issues.some((issue) => issue.path[0] === "confirmPassword"));
  }
});

test("invalid LinkedIn URLs return a validation error instead of throwing", () => {
  for (const linkedinUrl of [
    "linkedin.com/in/person",
    "https://notlinkedin.com/in/person",
    "https://linkedin.com.evil.example/in/person",
  ]) {
    const result = mentorRegistrationSchema.safeParse(application({ linkedinUrl }));
    assert.equal(result.success, false, `${linkedinUrl} should be rejected`);
  }

  assert.equal(
    mentorRegistrationSchema.safeParse(
      application({ linkedinUrl: "https://www.linkedin.com/in/person" }),
    ).success,
    true,
  );
});

test("requires an expertise area and limits mentors to three", () => {
  for (const expertise of [[], ["not-an-area"]]) {
    assert.equal(
      mentorRegistrationSchema.safeParse(application({ expertise })).success,
      false,
    );
  }
  assert.equal(
    mentorRegistrationSchema.safeParse(
      application({ expertise: ["Software Development", "Web development", "Mobile apps", "Other"] }),
    ).success,
    false,
  );
  assert.ok(MENTOR_EXPERTISE.includes("Other"));
});

test("requires the first five mentoring questions and validates conditional other answers", () => {
  for (const fields of [
    { motivationReasons: [] },
    { helpWith: [] },
    { currentStatus: "" },
    { expertise: [] },
    { yearsExperience: "" },
  ]) {
    assert.equal(mentorRegistrationSchema.safeParse(application(fields)).success, false);
  }
  for (const fields of [
    { motivationReasons: ["Something else"], motivationReasonsOther: "" },
    { helpWith: ["Something else"], helpWithOther: "" },
    { currentStatus: "Other", currentStatusOther: "" },
    { expertise: ["Other"], expertiseOther: "" },
  ]) {
    assert.equal(mentorRegistrationSchema.safeParse(application(fields)).success, false);
  }
});

test("keeps mentoring questions 6 through 12 optional", () => {
  assert.equal(
    mentorRegistrationSchema.safeParse(application({
      sessionFormat: undefined,
      meetingFrequency: "",
      menteeGroups: [],
      languages: [],
      languagesOther: "",
      campusConnection: "",
      referralSource: "",
      referralSourceOther: "",
    })).success,
    true,
  );
});

test("requires all three mentor consents", () => {
  for (const field of [
    "consentPublicProfile",
    "consentCodeOfConduct",
    "consentPrivacy",
  ]) {
    assert.equal(
      mentorRegistrationSchema.safeParse(application({ [field]: false })).success,
      false,
      `${field} was not required`,
    );
  }
});

test("mentor availability is optional during registration", () => {
  const fields = application({ availability: [] });
  assert.equal(mentorRegistrationSchema.safeParse(fields).success, true);

  const memberApplication = Object.fromEntries(
    Object.entries(fields).filter(
      ([field]) => field !== "password" && field !== "confirmPassword",
    ),
  );
  assert.equal(mentorMemberApplicationSchema.safeParse(memberApplication).success, true);
});

test("provides session-length slots within the 09:00 to 20:00 window", () => {
  assert.equal(mentorSessionStartMinutes(30).length, 22);
  assert.equal(mentorSessionStartMinutes(45).length, 14);
  assert.equal(mentorSessionStartMinutes(60).length, 11);
  const halfHourStarts = mentorSessionStartMinutes(30);
  const threeQuarterHourStarts = mentorSessionStartMinutes(45);
  const hourStarts = mentorSessionStartMinutes(60);
  assert.equal(halfHourStarts[halfHourStarts.length - 1], 19 * 60 + 30);
  assert.equal(threeQuarterHourStarts[threeQuarterHourStarts.length - 1], 18 * 60 + 45);
  assert.equal(hourStarts[hourStarts.length - 1], 19 * 60);
});

test("validates availability slots against session length and notice settings", () => {
  assert.equal(
    mentorScheduleSchema.safeParse({
      availability: ["0:540", "6:1170"],
      sessionLengthMinutes: "30",
      minimumNoticeHours: "24",
    }).success,
    true,
  );
  assert.equal(
    mentorScheduleSchema.safeParse({
      availability: ["0:555"],
      sessionLengthMinutes: "30",
      minimumNoticeHours: "24",
    }).success,
    false,
  );
  assert.equal(
    mentorScheduleSchema.safeParse({
      availability: ["0:540", "0:540"],
      sessionLengthMinutes: "30",
      minimumNoticeHours: "72",
    }).success,
    false,
  );
});

test("materializes recurring selected slots in Johannesburg time", () => {
  const slots = buildMentorAvailabilityOccurrences(
    ["0:540"],
    30,
    new Date("2026-03-02T00:00:00.000Z"),
  );
  assert.equal(slots.length, 12);
  assert.equal(slots[0].startsAt.toISOString(), "2026-03-02T07:00:00.000Z");
  assert.equal(slots[0].endsAt.toISOString(), "2026-03-02T07:30:00.000Z");
});

test("parses Johannesburg local one-off dates and rejects invalid calendar dates", () => {
  assert.equal(
    parseMentorLocalDateTime("2026-03-02", "09:00")?.toISOString(),
    "2026-03-02T07:00:00.000Z",
  );
  assert.equal(parseMentorLocalDateTime("2026-02-30", "09:00"), null);
});

test("deduplicates repeated availability intervals", () => {
  const slot = {
    startsAt: new Date("2026-03-02T07:00:00.000Z"),
    endsAt: new Date("2026-03-02T07:30:00.000Z"),
  };
  assert.equal(uniqueMentorAvailabilitySlots([slot, slot]).length, 1);
});

test("pending mentors cannot enter the dashboard or student directory until approved", () => {
  assert.equal(postLoginPath("MENTOR", false, "PENDING"), "/mentor/status");
  assert.equal(isApprovedMentor("PENDING"), false);
  assert.equal(canMentorAppearInDirectory("PENDING"), false);
  assert.equal(isApprovedMentor("APPROVED"), true);
  assert.equal(canMentorAppearInDirectory("APPROVED"), true);
});

test("students cannot access the admin area and approved mentors become visible", () => {
  assert.equal(canBrowseMentors("STUDENT"), true);
  assert.equal(canBrowseMentors("MENTOR"), false);
  assert.equal(canBrowseMentors("ADMIN"), false);
  assert.equal(canAccessAdmin("STUDENT"), false);
  assert.equal(canAccessAdmin("ADMIN"), true);
  assert.equal(canMentorAppearInDirectory("APPROVED"), true);
});
