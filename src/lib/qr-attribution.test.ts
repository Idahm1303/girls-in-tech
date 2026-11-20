import assert from "node:assert/strict";
import test from "node:test";
import {
  signQrAttribution,
  verifyQrAttribution,
} from "./qr-cookie";

const secret = "test-only-signing-secret";

test("QR attribution cookies are signed and expire after one day", () => {
  const scannedAt = new Date("2026-11-20T08:00:00.000Z");
  const cookie = signQrAttribution("qr-main", scannedAt, secret);
  assert.ok(cookie);

  assert.deepEqual(
    verifyQrAttribution(cookie, secret, new Date("2026-11-21T07:59:59.000Z")),
    { qrCodeId: "qr-main", scannedAt },
  );
  assert.equal(
    verifyQrAttribution(cookie, secret, new Date("2026-11-21T08:00:01.000Z")),
    null,
  );
  assert.equal(verifyQrAttribution(`${cookie}x`, secret, scannedAt), null);
});
