import assert from "node:assert/strict";
import test from "node:test";
import {
  mentorRegistrationSchema,
  MENTOR_EXPERTISE,
} from "@/lib/mentor-validation";
import {
  DUPLICATE_MENTOR_EMAIL_ERROR,
  registerMentor,
} from "@/lib/mentor-service";
import {
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
    yearsExperience: "3-5",
    qualification: "BSc Computer Science",
    isTutAlumna: "yes",
    bio: "I enjoy helping young women start and grow their technology careers.",
    linkedinUrl: "https://www.linkedin.com/in/amara",
    expertise: ["Software Development"],
    sessionFormat: "ONLINE",
    meetingTool: "TEAMS",
    campuses: ["ONLINE_ONLY"],
    maxMentees: "3",
    availability: ["Monday Morning"],
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

test("requires at least one mentor expertise area", () => {
  for (const expertise of [[], ["not-an-area"]]) {
    assert.equal(
      mentorRegistrationSchema.safeParse(application({ expertise })).success,
      false,
    );
  }
  assert.ok(MENTOR_EXPERTISE.includes("CV Review"));
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

test("pending mentors cannot enter the dashboard or student directory until approved", () => {
  assert.equal(postLoginPath("MENTOR", false, "PENDING"), "/mentor/status");
  assert.equal(isApprovedMentor("PENDING"), false);
  assert.equal(canMentorAppearInDirectory("PENDING"), false);
  assert.equal(isApprovedMentor("APPROVED"), true);
  assert.equal(canMentorAppearInDirectory("APPROVED"), true);
});

test("students cannot access the admin area and approved mentors become visible", () => {
  assert.equal(canAccessAdmin("STUDENT"), false);
  assert.equal(canAccessAdmin("ADMIN"), true);
  assert.equal(canMentorAppearInDirectory("APPROVED"), true);
});
