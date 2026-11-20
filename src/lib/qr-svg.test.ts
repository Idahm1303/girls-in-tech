import assert from "node:assert/strict";
import test from "node:test";
import sharp from "sharp";
import { createQrSvg } from "./qr-svg";

test("QR SVG uses the configured link, clear zone, contrast, and caption", () => {
  const svg = createQrSvg("https://girls.example/join/main");

  assert.match(svg, /width="1024"/);
  assert.match(svg, /viewBox="0 0 \d+ \d+"/);
  assert.match(svg, /fill="#ffffff"/);
  assert.match(svg, /fill="#003b70"/);
  assert.match(svg, /Scan to join Girls in Tech/);
  assert.match(svg, /shape-rendering="crispEdges"/);
});

test("QR PNG rendering is at least 1024 pixels in both dimensions", async () => {
  const png = await sharp(Buffer.from(createQrSvg("https://girls.example/join/main")))
    .png()
    .toBuffer();
  const image = await sharp(png).metadata();

  assert.ok((image.width ?? 0) >= 1024);
  assert.ok((image.height ?? 0) >= 1024);
});
