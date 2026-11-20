import assert from "node:assert/strict";
import test from "node:test";
import { getQrPublicUrl, getQrSiteOrigin } from "./qr-public-url";

function withSiteUrl(value: string | undefined, callback: () => void) {
  const previous = process.env.NEXT_PUBLIC_SITE_URL;
  if (value === undefined) delete process.env.NEXT_PUBLIC_SITE_URL;
  else process.env.NEXT_PUBLIC_SITE_URL = value;

  try {
    callback();
  } finally {
    if (previous === undefined) delete process.env.NEXT_PUBLIC_SITE_URL;
    else process.env.NEXT_PUBLIC_SITE_URL = previous;
  }
}

test("QR links use the configured public HTTPS origin and slug", () => {
  withSiteUrl("https://girls.example", () => {
    assert.equal(getQrPublicUrl("orientation-week"), "https://girls.example/join/orientation-week");
    assert.equal(getQrSiteOrigin().origin, "https://girls.example");
  });
});

test("QR links reject missing, local, and non-HTTPS origins", () => {
  withSiteUrl(undefined, () => {
    assert.throws(() => getQrSiteOrigin(), /NEXT_PUBLIC_SITE_URL/);
  });
  withSiteUrl("https://localhost:3000", () => {
    assert.throws(() => getQrSiteOrigin(), /publicly reachable/);
  });
  withSiteUrl("http://girls.example", () => {
    assert.throws(() => getQrSiteOrigin(), /HTTPS origin/);
  });
});
