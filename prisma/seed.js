/**
 * Prisma seed entry point (prisma.config.js -> migrations.seed = "node prisma/seed.js")
 * Delegates to scripts/seedDummyData.js which is the source of truth for dummy data.
 * Ensures galleries are seeded with banner, logo, images and storageFolder — the most important fields.
 */

require("dotenv").config({ quiet: true });

// Reuse the canonical dummy seeder — it already correctly handles:
// - Gallery.storageFolder + banner (1000x500) + logo (500x500 contain) + images
// - Product mainImageUrl + images
// - Categories
// Pass through CLI args (--clean, --dry) if provided.
const { main } = require("../scripts/seedDummyData");
const { disconnectDatabase } = require("../src/config/prisma");

main()
  .catch((e) => {
    console.error("❌ Prisma seed failed", e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await disconnectDatabase();
  });
