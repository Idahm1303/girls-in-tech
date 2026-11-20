import assert from "node:assert/strict";
import test from "node:test";
import { getTeamMemberInitials } from "./team-avatar";

test("uses the final two name initials, skipping titles", () => {
  assert.equal(getTeamMemberInitials("Dr Thembeka Manetje"), "TM");
  assert.equal(getTeamMemberInitials("Idah Mokwena"), "IM");
});

test("uses one initial for a single-word name and a safe fallback for blank input", () => {
  assert.equal(getTeamMemberInitials("Tshegofatso"), "T");
  assert.equal(getTeamMemberInitials("   "), "?");
});
