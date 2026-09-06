import assert from "node:assert/strict";
import { readFile, stat } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const frontendRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const assetsRoot = join(frontendRoot, "public", "assets");

const expectedAssets = [
  "answeryeymotion.png",
  "arasaac.png",
  "correctanswer.png",
  "iconbrowser.png",
  "mainiconfirstpage.png",
  "rainbowGiff.gif",
  "senseofmotion.png",
  "severalreactionstitia.png",
  "tryagain.png",
  "wildcard.png",
];

test("all branded visual assets are available to the Next.js public directory", async () => {
  for (const asset of expectedAssets) {
    const metadata = await stat(join(assetsRoot, asset));
    assert.ok(metadata.isFile(), `${asset} must be a file`);
    assert.ok(metadata.size > 1_024, `${asset} must not be empty or truncated`);
  }
});

test("the animated visual is a valid GIF file", async () => {
  const gif = await readFile(join(assetsRoot, "rainbowGiff.gif"));
  assert.match(gif.subarray(0, 6).toString("ascii"), /^GIF8[79]a$/);
});

test("the standalone Docker image copies the public directory", async () => {
  const dockerfile = await readFile(join(frontendRoot, "Dockerfile"), "utf8");
  assert.match(
    dockerfile,
    /COPY\s+--from=builder\s+\/app\/public\s+\.\/public/,
    "The runtime image must include Next.js public assets",
  );
});

test("the home runtime path references the animated visual and reward star", async () => {
  const homePage = await readFile(
    join(frontendRoot, "src", "app", "[locale]", "page.tsx"),
    "utf8",
  );
  assert.match(homePage, /\/assets\/rainbowGiff\.gif/);
  assert.match(homePage, /⭐/u);
  assert.match(homePage, /motion-safe:/);
});
