/**
 * Sync script - fetches all assets from Cloudinary "Arture" folder and syncs to MongoDB
 * Run: bun scripts/sync-cloudinary.ts [--clear]
 * 
 * This is useful when you've uploaded files directly via Cloudinary dashboard
 * and need to sync them to the database.
 */

import { v2 as cloudinary } from "cloudinary";
import { PrismaClient, AssetType } from "@prisma/client";

// cloudinary config
cloudinary.config({
  cloud_name: "dkysrpdi6",
  api_key: "154346211332761",
  api_secret: "uup5UzKTbwaRt3FATIySWtTxitk",
});

const prisma = new PrismaClient();
const FOLDER = "Arture";
const BATCH_SIZE = 100;

// extract tags from filename
function extractTags(publicId: string): string[] {
  const name = publicId.split("/").pop() || "";
  const cleanName = name.replace(/\.svg$/, "").replace(/_[a-z0-9]+$/, ""); // remove hash suffix
  const parts = cleanName.split("_").filter((p) => !/^\d+$/.test(p) && p.length > 1);
  return [...new Set(parts)].slice(0, 7);
}

// fetch all resources from Cloudinary folder
async function fetchCloudinaryAssets(): Promise<any[]> {
  const allResources: any[] = [];
  let nextCursor: string | undefined;

  console.log(`Fetching assets from Cloudinary folder: ${FOLDER}`);

  do {
    const result: any = await cloudinary.api.resources({
      type: "upload",
      prefix: FOLDER,
      max_results: 500,
      next_cursor: nextCursor,
    });

    allResources.push(...result.resources);
    nextCursor = result.next_cursor;
    console.log(`  Fetched ${allResources.length} assets...`);
  } while (nextCursor);

  return allResources;
}

// sync a single asset to database
async function syncAsset(resource: any): Promise<{ action: string; name: string }> {
  const publicId = resource.public_id;
  const name = publicId.split("/").pop() || publicId;
  
  // check if already exists
  const existing = await prisma.asset.findFirst({
    where: { 
      OR: [
        { name },
        { url: resource.secure_url }
      ]
    }
  });

  if (existing) {
    // update URL if it changed
    if (existing.url !== resource.secure_url) {
      await prisma.asset.update({
        where: { id: existing.id },
        data: { 
          url: resource.secure_url,
          thumbnail: resource.secure_url,
          metadata: { publicId },
        },
      });
      return { action: "updated", name };
    }
    return { action: "skipped", name };
  }

  // create new entry
  const tags = extractTags(publicId);
  await prisma.asset.create({
    data: {
      name,
      type: AssetType.DECORATION,
      category: "illustrations",
      tags,
      theme: ["creative", "modern"],
      size: {
        width: resource.width || 500,
        height: resource.height || 500,
        aspectRatio: 1,
      },
      url: resource.secure_url,
      thumbnail: resource.secure_url,
      metadata: { publicId },
      isPublic: true,
    },
  });

  return { action: "created", name };
}

// main
async function main() {
  const args = process.argv.slice(2);
  const shouldClear = args.includes("--clear");

  console.log("=".repeat(60));
  console.log("Cloudinary → MongoDB Sync");
  console.log("=".repeat(60));

  // clear old entries if requested
  if (shouldClear) {
    console.log("\nClearing existing DECORATION assets from database...");
    const deleted = await prisma.asset.deleteMany({
      where: { type: AssetType.DECORATION },
    });
    console.log(`Deleted ${deleted.count} old entries.\n`);
  }

  // fetch from Cloudinary
  const cloudinaryAssets = await fetchCloudinaryAssets();
  console.log(`\nTotal assets in Cloudinary: ${cloudinaryAssets.length}\n`);

  if (cloudinaryAssets.length === 0) {
    console.log("No assets found in Cloudinary folder.");
    return;
  }

  // sync to database
  let created = 0;
  let updated = 0;
  let skipped = 0;
  let errors = 0;

  for (let i = 0; i < cloudinaryAssets.length; i += BATCH_SIZE) {
    const batch = cloudinaryAssets.slice(i, i + BATCH_SIZE);
    
    const results = await Promise.allSettled(
      batch.map((asset) => syncAsset(asset))
    );

    for (const result of results) {
      if (result.status === "fulfilled") {
        if (result.value.action === "created") created++;
        else if (result.value.action === "updated") updated++;
        else skipped++;
      } else {
        errors++;
        console.error("Error:", result.reason);
      }
    }

    console.log(
      `Progress: ${Math.min(i + BATCH_SIZE, cloudinaryAssets.length)}/${cloudinaryAssets.length} | ` +
      `Created: ${created} | Updated: ${updated} | Skipped: ${skipped} | Errors: ${errors}`
    );
  }

  console.log("\n" + "=".repeat(60));
  console.log("Sync Complete!");
  console.log(`  Created: ${created}`);
  console.log(`  Updated: ${updated}`);
  console.log(`  Skipped: ${skipped}`);
  console.log(`  Errors: ${errors}`);
  console.log("=".repeat(60));
}

main()
  .catch((err) => {
    console.error("Script error:", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
