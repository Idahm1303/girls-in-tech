import assert from "node:assert/strict";
import test from "node:test";
import {
  ABOUT_PAGE_DEFAULTS,
  aboutPageContentSchema,
  aboutTeamMemberSchema,
} from "@/lib/about-content";

test("accepts the default About page content", () => {
  assert.equal(aboutPageContentSchema.safeParse(ABOUT_PAGE_DEFAULTS).success, true);
});

test("requires About page sections to contain text", () => {
  const result = aboutPageContentSchema.safeParse({
    ...ABOUT_PAGE_DEFAULTS,
    introduction: "  ",
  });
  assert.equal(result.success, false);
});

test("accepts local and HTTPS team photos but rejects unsafe image schemes", () => {
  const member = {
    name: "GiT Lead",
    roleTitle: "LEAD",
  };
  assert.equal(
    aboutTeamMemberSchema.safeParse({ ...member, imageUrl: "/team/lead.jpg" }).success,
    true,
  );
  assert.equal(
    aboutTeamMemberSchema.safeParse({
      ...member,
      imageUrl: "https://example.org/team/lead.jpg",
    }).success,
    true,
  );
  assert.equal(
    aboutTeamMemberSchema.safeParse({
      ...member,
      imageUrl: "javascript:alert(1)",
    }).success,
    false,
  );
});
