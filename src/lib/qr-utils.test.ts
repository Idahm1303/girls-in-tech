import assert from "node:assert/strict";
import test from "node:test";
import {
  getQrDeviceType,
  hashQrVisitor,
  shouldIgnoreQrRequest,
} from "./qr-utils";

test("classifies common phone and tablet user agents", () => {
  assert.equal(getQrDeviceType("Mozilla/5.0 (iPhone; CPU iPhone OS 17_0)"), "mobile");
  assert.equal(getQrDeviceType("Mozilla/5.0 (iPad; CPU OS 17_0)"), "tablet");
  assert.equal(getQrDeviceType("Mozilla/5.0 (Windows NT 10.0; Win64; x64)"), "desktop");
});

test("ignores bots and prefetches but accepts ordinary scans", () => {
  assert.equal(
    shouldIgnoreQrRequest(new Headers({ "user-agent": "Googlebot/2.1" })),
    true,
  );
  assert.equal(
    shouldIgnoreQrRequest(
      new Headers({ "user-agent": "Mozilla/5.0", purpose: "prefetch" }),
    ),
    true,
  );
  assert.equal(
    shouldIgnoreQrRequest(
      new Headers({ "user-agent": "Mozilla/5.0", "next-router-prefetch": "1" }),
    ),
    true,
  );
  assert.equal(
    shouldIgnoreQrRequest(new Headers({ "user-agent": "Mozilla/5.0 (iPhone)" })),
    false,
  );
});

test("hashes the IP and user agent without storing them and rotates by Johannesburg day", () => {
  const firstDay = new Date("2026-03-04T20:00:00.000Z");
  const nextDay = new Date("2026-03-04T22:30:00.000Z");
  const firstHash = hashQrVisitor("203.0.113.1", "Mozilla/5.0", firstDay);

  assert.equal(firstHash, hashQrVisitor("203.0.113.1", "Mozilla/5.0", firstDay));
  assert.notEqual(firstHash, hashQrVisitor("203.0.113.1", "Mozilla/5.0", nextDay));
  assert.notEqual(firstHash, hashQrVisitor("203.0.113.2", "Mozilla/5.0", firstDay));
  assert.equal(firstHash.includes("203.0.113.1"), false);
});
