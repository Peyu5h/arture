/**
 * Seed script to upload SVG illustrations to Cloudinary and index in MongoDB
 * Run: bun scripts/seed-elements.ts [--limit N] [--skip N] [--clear] [--reset-progress]
 * 
 * Features:
 * - Progress tracking to prevent repeats
 * - Higher concurrency with rate limiting
 * - Resume capability
 */

import { v2 as cloudinary } from "cloudinary";
import { PrismaClient, AssetType } from "@prisma/client";
import fs from "fs";
import path from "path";

// hardcoded cloudinary config for this script
cloudinary.config({
  cloud_name: "dkysrpdi6",
  api_key: "154346211332761",
  api_secret: "uup5UzKTbwaRt3FATIySWtTxitk",
});

const prisma = new PrismaClient();
const SVG_DIR = path.join(process.cwd(), "downloaded_svgs");
const PROGRESS_FILE = path.join(process.cwd(), ".seed-progress.json");

// parse cli args
const args = process.argv.slice(2);
const limitIdx = args.indexOf("--limit");
const skipIdx = args.indexOf("--skip");
const LIMIT = limitIdx !== -1 ? parseInt(args[limitIdx + 1]) : Infinity;
const SKIP = skipIdx !== -1 ? parseInt(args[skipIdx + 1]) : 0;
const CLEAR_DB = args.includes("--clear");
const RESET_PROGRESS = args.includes("--reset-progress");
const CONCURRENCY = 15; // increased for speed
const BATCH_DELAY = 500; // ms delay between batches to avoid rate limits

interface UploadResult {
  url: string;
  thumbnail: string;
  publicId: string;
  width: number;
  height: number;
}

interface Progress {
  completed: Set<string>;
  failed: Set<string>;
  lastProcessedIndex: number;
}

// load progress from file
function loadProgress(): Progress {
  try {
    if (fs.existsSync(PROGRESS_FILE) && !RESET_PROGRESS) {
      const data = JSON.parse(fs.readFileSync(PROGRESS_FILE, "utf-8"));
      return {
        completed: new Set(data.completed || []),
        failed: new Set(data.failed || []),
        lastProcessedIndex: data.lastProcessedIndex || 0,
      };
    }
  } catch (err) {
    console.warn("Could not load progress file, starting fresh");
  }
  return { completed: new Set(), failed: new Set(), lastProcessedIndex: 0 };
}

// save progress to file
function saveProgress(progress: Progress): void {
  const data = {
    completed: Array.from(progress.completed),
    failed: Array.from(progress.failed),
    lastProcessedIndex: progress.lastProcessedIndex,
    savedAt: new Date().toISOString(),
  };
  fs.writeFileSync(PROGRESS_FILE, JSON.stringify(data, null, 2));
}

// extract tags from filename
function extractTags(filename: string): string[] {
  const name = filename.replace(/\.svg$/, "");
  const parts = name.split("_").filter((p) => !/^\d+$/.test(p));
  return [...new Set(parts)].slice(0, 7);
}

// upload single svg with retries
async function uploadSvg(filePath: string, retries = 3): Promise<UploadResult | null> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const svgContent = fs.readFileSync(filePath);
      const base64 = svgContent.toString("base64");
      const dataUri = `data:image/svg+xml;base64,${base64}`;

      const result = await cloudinary.uploader.upload(dataUri, {
        folder: "Arture",
        resource_type: "image",
        format: "svg",
        tags: ["arture", "element", "svg"],
      });

      return {
        url: result.secure_url,
        thumbnail: result.secure_url,
        publicId: result.public_id,
        width: result.width || 500,
        height: result.height || 500,
      };
    } catch (err: any) {
      if (attempt < retries) {
        const delay = 1000 * Math.pow(2, attempt); // exponential backoff
        await new Promise((r) => setTimeout(r, delay));
        continue;
      }
      console.error(`[FAIL] ${path.basename(filePath)}:`, err.message || err);
      return null;
    }
  }
  return null;
}

// process single file
async function processFile(
  file: string,
  idx: number,
  progress: Progress
): Promise<boolean> {
  const name = file.replace(/\.svg$/, "");

  // skip if already completed
  if (progress.completed.has(name)) {
    return true;
  }

  const filePath = path.join(SVG_DIR, file);

  // check if already exists in db
  try {
    const existing = await prisma.asset.findFirst({ where: { name } });
    if (existing) {
      progress.completed.add(name);
      console.log(`[${idx}] SKIP (exists): ${name}`);
      return true;
    }
  } catch (err: any) {
    console.error(`[${idx}] DB check failed for ${name}:`, err.message);
    return false;
  }

  const upload = await uploadSvg(filePath);
  if (!upload) {
    progress.failed.add(name);
    return false;
  }

  try {
    const tags = extractTags(file);
    await prisma.asset.create({
      data: {
        name,
        type: AssetType.DECORATION,
        category: "illustrations",
        tags,
        theme: ["creative", "modern"],
        size: {
          width: upload.width,
          height: upload.height,
          aspectRatio: 1,
        },
        url: upload.url,
        thumbnail: upload.thumbnail,
        metadata: { publicId: upload.publicId },
        isPublic: true,
      },
    });

    progress.completed.add(name);
    console.log(`[${idx}] OK: ${name}`);
    return true;
  } catch (err: any) {
    console.error(`[${idx}] DB insert failed for ${name}:`, err.message);
    progress.failed.add(name);
    return false;
  }
}

// process batch with concurrency
async function processBatch(
  files: string[],
  startIdx: number,
  progress: Progress
): Promise<{ success: number; failed: number }> {
  const results = await Promise.allSettled(
    files.map((file, i) => processFile(file, startIdx + i, progress))
  );

  let success = 0;
  let failed = 0;

  results.forEach((result) => {
    if (result.status === "fulfilled" && result.value) {
      success++;
    } else {
      failed++;
    }
  });

  return { success, failed };
}

// main
async function main() {
  console.log("=".repeat(60));
  console.log("SVG Seed Script - Starting");
  console.log("=".repeat(60));

  // clear db if requested
  if (CLEAR_DB) {
    console.log("\nClearing existing DECORATION assets...");
    const deleted = await prisma.asset.deleteMany({
      where: { type: AssetType.DECORATION },
    });
    console.log(`Deleted ${deleted.count} assets.`);
  }

  // reset progress if requested
  if (RESET_PROGRESS && fs.existsSync(PROGRESS_FILE)) {
    fs.unlinkSync(PROGRESS_FILE);
    console.log("Progress file reset.");
  }

  let progress = loadProgress();
  console.log(`\nLoaded progress: ${progress.completed.size} completed, ${progress.failed.size} failed`);

  console.log("\nReading SVG directory...");
  const allFiles = fs
    .readdirSync(SVG_DIR)
    .filter((f) => f.endsWith(".svg"))
    .slice(SKIP, SKIP + LIMIT);

  console.log(`Found ${allFiles.length} files (skip=${SKIP}, limit=${LIMIT === Infinity ? "all" : LIMIT})`);
  console.log(`Concurrency: ${CONCURRENCY}, Batch delay: ${BATCH_DELAY}ms`);
  console.log("");

  let processed = 0;
  let totalSuccess = 0;
  let totalFailed = 0;
  const startTime = Date.now();

  for (let i = 0; i < allFiles.length; i += CONCURRENCY) {
    const batch = allFiles.slice(i, i + CONCURRENCY);
    const { success, failed } = await processBatch(batch, SKIP + i, progress);

    totalSuccess += success;
    totalFailed += failed;
    processed += batch.length;
    progress.lastProcessedIndex = SKIP + i + batch.length;

    // save progress every batch
    saveProgress(progress);

    // progress update
    const elapsed = (Date.now() - startTime) / 1000;
    const rate = processed / elapsed;
    const remaining = allFiles.length - processed;
    const eta = remaining / rate;

    console.log(
      `Progress: ${processed}/${allFiles.length} | OK: ${totalSuccess} | Failed: ${totalFailed} | ` +
      `Rate: ${rate.toFixed(1)}/s | ETA: ${Math.round(eta)}s`
    );

    // delay between batches to avoid rate limits
    if (i + CONCURRENCY < allFiles.length) {
      await new Promise((r) => setTimeout(r, BATCH_DELAY));
    }
  }

  const totalTime = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log("\n" + "=".repeat(60));
  console.log(`Done! Success: ${totalSuccess}, Failed: ${totalFailed}`);
  console.log(`Total time: ${totalTime}s`);
  console.log(`Final rate: ${(processed / parseFloat(totalTime)).toFixed(1)} files/s`);
  console.log("=".repeat(60));
}

main()
  .catch((err) => {
    console.error("Script error:", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
