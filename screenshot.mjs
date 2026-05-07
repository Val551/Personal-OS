#!/usr/bin/env node
import puppeteer from "puppeteer";
import { mkdir, readdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";

const url = process.argv[2] ?? "http://localhost:3000";
const label = process.argv[3];
const outDir = path.resolve("temporary screenshots");

if (!existsSync(outDir)) await mkdir(outDir, { recursive: true });

let nextN = 1;
try {
  const files = await readdir(outDir);
  const nums = files
    .map((f) => f.match(/^screenshot-(\d+)/))
    .filter(Boolean)
    .map((m) => parseInt(m[1], 10));
  if (nums.length) nextN = Math.max(...nums) + 1;
} catch {}

const fileName = label ? `screenshot-${nextN}-${label}.png` : `screenshot-${nextN}.png`;
const out = path.join(outDir, fileName);

const browser = await puppeteer.launch({
  headless: "new",
  args: ["--no-sandbox", "--disable-setuid-sandbox"],
});
const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 2 });
await page.goto(url, { waitUntil: "networkidle0", timeout: 60_000 });
// Allow font + animation settle
await new Promise((r) => setTimeout(r, 800));
await page.screenshot({ path: out, fullPage: true });
await browser.close();

console.log(out);
