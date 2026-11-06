import assert from "node:assert/strict";
import test from "node:test";
import {
  DUPLICATE_EMAIL_ERROR,
  DUPLICATE_STUDENT_NUMBER_ERROR,
  EMAIL_DOMAIN_ERROR,
  registrationSchema,
  STUDENT_NUMBER_ERROR,
  studentProfileSchema,
} from "@/lib/account-validation";
import { completeStudentProfile, registerStudent } from "@/lib/member-service";
import { postLoginPath } from "@/lib/account-routing";

function registrationInput(email: string) {
  return registrationSchema.parse({
    name: "Mpho",
    surname: "Member",
    email,
    password: "ChangeMe123!",
    confirmPassword: "ChangeMe123!",
    consent: true,
  });
}

test("accepts Gmail and South African email domains and normalizes case and whitespace", () => {
  for (const email of [
    "person@gmail.com",
    "person@tut.ac.za",
    "person@tut4life.ac.za",
    "person@example.co.za",
  ]) {
    assert.equal(registrationInput(`  ${email.toUpperCase()}  `).email, email);
  }
});

test("rejects email domains outside Gmail and South Africa", () => {
  const result = registrationSchema.safeParse({
    ...registrationInput("person@gmail.com"),
    email: "person@outlook.com",
  });
  assert.equal(result.success, false);
  if (!result.success) assert.equal(result.error.issues[0]?.message, EMAIL_DOMAIN_ERROR);
});

test("reports mismatched registration passwords on the confirmation field", () => {
  const result = registrationSchema.safeParse({
    ...registrationInput("person@gmail.com"),
    confirmPassword: "Different123!",
  });
  assert.equal(result.success, false);
  if (!result.success) {
    assert.equal(result.error.issues[0]?.message, "Passwords do not match");
    assert.deepEqual(result.error.issues[0]?.path, ["confirmPassword"]);
  }
});

test("rejects student numbers with incorrect length or non-digits", () => {
  for (const studentNumber of ["12345678", "1234567890", "12345678a"]) {
    const result = studentProfileSchema.safeParse({
      studentNumber,
      campus: "SOSHANGUVE",
      qualification: "Diploma in ICT",
    });
    assert.equal(result.success, false, `accepted ${studentNumber}`);
    if (!result.success) assert.equal(result.error.issues[0]?.message, STUDENT_NUMBER_ERROR);
  }
});

test("returns the duplicate email message for a registered address", async () => {
  const registered = new Set<string>();
  const input = registrationInput("person@gmail.com");
  const repository = {
    async emailExists(email: string) {
      return registered.has(email);
    },
    async createStudent(data: { email: string }) {
      if (registered.has(data.email)) throw { code: "P2002" };
      registered.add(data.email);
    },
  };

  assert.deepEqual(await registerStudent(input, "hashed", repository), { ok: true });
  assert.deepEqual(await registerStudent(input, "hashed", repository), {
    ok: false,
    message: DUPLICATE_EMAIL_ERROR,
  });
});

test("returns the duplicate student number message when another member owns it", async () => {
  const registeredNumbers = new Map<string, string>();
  const input = studentProfileSchema.parse({
    studentNumber: "123456789",
    campus: "EMALAHLENI",
    qualification: "Diploma in ICT",
  });
  const repository = {
    async studentNumberExists(studentNumber: string, exceptUserId: string) {
      const owner = registeredNumbers.get(studentNumber);
      return owner !== undefined && owner !== exceptUserId;
    },
    async updateStudentProfile(
      userId: string,
      profile: { studentNumber: string },
    ) {
      const owner = registeredNumbers.get(profile.studentNumber);
      if (owner && owner !== userId) throw { code: "P2002" };
      registeredNumbers.set(profile.studentNumber, userId);
    },
  };

  assert.deepEqual(
    await completeStudentProfile("member-one", input, repository),
    { ok: true },
  );
  assert.deepEqual(
    await completeStudentProfile("member-two", input, repository),
    { ok: false, message: DUPLICATE_STUDENT_NUMBER_ERROR },
  );
});

test("routes to profile completion once, then to the student dashboard", () => {
  assert.equal(postLoginPath("STUDENT", false), "/complete-profile");
  assert.equal(postLoginPath("STUDENT", true), "/dashboard");
  assert.equal(postLoginPath("MENTOR", false), "/mentor");
  assert.equal(postLoginPath("ADMIN", false), "/admin");
});
