/**
 * Dummy data seeder for galleries_manager
 * Seeds Categories, Gallery Owners, Galleries and Products with real image storage
 *
 * Images are downloaded from Unsplash mock URLs, resized with sharp,
 * and stored under storage/uploads/{galleries,products}/<slug-uuid>/ as jpeg.
 * DB stores:
 *  - Gallery: storageFolder + banner/logo/images (filenames only, same as src/modules/galleries/gallery.controller.js)
 *  - Product: mainImageUrl + images as "folder/filename" (relative under storage/uploads/products) — because Product has no storageFolder column
 *  - Category: name, arabicName, slug
 *
 * Usage:
 *   node scripts/seedDummyData.js          # seed (upsert-safe)
 *   node scripts/seedDummyData.js --clean  # wipe galleries/products/categories storage + DB before seeding
 *   node scripts/seedDummyData.js --dry    # log without DB writes
 */

require("dotenv").config({ quiet: true });
const path = require("path");
const fs = require("fs/promises");
const { v4: uuidv4 } = require("uuid");
const bcrypt = require("bcryptjs");
const slugify = require("slugify");
const sharp = require("sharp");

const { getPrisma } = require("../src/config/prisma");
const { connectDatabase, disconnectDatabase } = require("../src/config/prisma");

// ---------------------------------------------------------------------------
// Helpers: storage & image
// ---------------------------------------------------------------------------
const STORAGE_ROOT = path.join(process.cwd(), "storage", "uploads");
const getFolderPath = (type, folder) => path.join(STORAGE_ROOT, type, folder);

const getFileDate = () => new Date().toISOString().replace(/[:.]/g, "-");

const processBufferToFile = async ({ buffer, folderPath, prefix, width, height, fit }) => {
  const fileName = `${prefix}-${getFileDate()}-${uuidv4()}.jpeg`;
  await fs.mkdir(folderPath, { recursive: true });
  await sharp(buffer)
    .resize(width, height, fit ? { fit } : {})
    .toFormat("jpeg")
    .jpeg({ quality: 90 })
    .toFile(path.join(folderPath, fileName));
  return fileName;
};

const fetchBuffer = async (url, retries = 2) => {
  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
      const ab = await res.arrayBuffer();
      return Buffer.from(ab);
    } catch (e) {
      if (attempt === retries) throw e;
      await new Promise((r) => setTimeout(r, 500 * (attempt + 1)));
    }
  }
};

// Fallback: generate a solid placeholder if download fails (offline CI)
const generatePlaceholder = async ({ folderPath, prefix, width, height, color = "#C19A6B" }) => {
  const fileName = `${prefix}-${getFileDate()}-${uuidv4()}.jpeg`;
  await fs.mkdir(folderPath, { recursive: true });
  await sharp({
    create: { width, height, channels: 3, background: color },
  })
    .jpeg({ quality: 90 })
    .toFile(path.join(folderPath, fileName));
  return fileName;
};

const downloadAndSave = async ({ url, folderPath, prefix, width, height, fit }) => {
  try {
    const buffer = await fetchBuffer(url);
    return await processBufferToFile({ buffer, folderPath, prefix, width, height, fit });
  } catch (e) {
    console.warn(`  ⚠ download failed for ${url}: ${e.message} -> placeholder`);
    return await generatePlaceholder({ folderPath, prefix, width, height });
  }
};

// ---------------------------------------------------------------------------
// Dummy source (derived from gallery_manager_front/src/data/mockData.ts)
// ---------------------------------------------------------------------------
const CATEGORIES = [
  { name: "Sofas & Sectionals", arabicName: "أرائك وأقسام" },
  { name: "Beds & Bedroom", arabicName: "أسرة وغرف نوم" },
  { name: "Dining Furniture", arabicName: "أثاث طعام" },
  { name: "Chairs & Armchairs", arabicName: "كراسي ومقاعد" },
  { name: "Tables & Desks", arabicName: "طاولات ومكاتب" },
  { name: "Storage & Credenzas", arabicName: "تخزين وخزائن" },
  { name: "Office & Study", arabicName: "مكتب ودراسة" },
  { name: "Lighting", arabicName: "إضاءة" },
];

const GALLERIES = [
  {
    name: "Vance Studio & Showroom",
    description:
      "Founded in 2014 in SoHo New York, Vance Studio designs and handcrafts architectural furniture from sustainably harvested hardwoods and Italian textiles.",
    city: "New York",
    country: "United States",
    street: "482 Broome St",
    phone: "+1 (212) 555-0198",
    owner: { firstName: "Marcus", lastName: "Vance", email: "marcus@vanceshowroom.com" },
    logo: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=300&auto=format&fit=crop&q=80",
    banner: "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=1200&auto=format&fit=crop&q=80",
    images: [
      "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=1000&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=1000&auto=format&fit=crop&q=80",
    ],
  },
  {
    name: "Nordic Timber & Living",
    description: "Scandinavian studio celebrating clean lines, organic warmth, honest joinery in FSC-certified white oak.",
    city: "Stockholm",
    country: "Sweden",
    street: "Strandvägen 18",
    phone: "+46 8 123 4567",
    owner: { firstName: "Henrik", lastName: "Larsson", email: "henrik@nordictimber.se" },
    logo: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=300&auto=format&fit=crop&q=80",
    banner: "https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=1200&auto=format&fit=crop&q=80",
    images: [
      "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=1000&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1595428774223-ef52624120d2?w=1000&auto=format&fit=crop&q=80",
    ],
  },
  {
    name: "Modena Luxury Living",
    description: "Decades of Italian upholstery heritage with full-grain leathers and Carrara marble.",
    city: "Milan",
    country: "Italy",
    street: "Via Montenapoleone 22",
    phone: "+39 02 555 8921",
    owner: { firstName: "Matteo", lastName: "Rossi", email: "matteo@modenaliving.it" },
    logo: "https://images.unsplash.com/photo-1538688525198-9b88f6f53126?w=300&auto=format&fit=crop&q=80",
    banner: "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=1200&auto=format&fit=crop&q=80",
    images: [
      "https://images.unsplash.com/photo-1533090161767-e6ffed986c88?w=1000&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=1000&auto=format&fit=crop&q=80",
    ],
  },
  {
    name: "Kyoto Woodcraft Atelier",
    description: "Master artisans practicing sashimono woodwork, mortise-and-tenon without nails.",
    city: "Kyoto",
    country: "Japan",
    street: "Gion Kiritoshi 102",
    phone: "+81 75 555 0142",
    owner: { firstName: "Kenji", lastName: "Takahashi", email: "kenji@kyotowoodcraft.jp" },
    logo: "https://images.unsplash.com/photo-1513694203232-719a280e022f?w=300&auto=format&fit=crop&q=80",
    banner: "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=1200&auto=format&fit=crop&q=80",
    images: [
      "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=1000&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1540518614846-7ede433c4550?w=1000&auto=format&fit=crop&q=80",
    ],
  },
];

const PRODUCTS = [
  {
    name: "Aurelia Curved Bouclé 3-Seater Sofa",
    description:
      "Organic curved silhouette, heavy bouclé with Scotchgard over kiln-dried hardwood frame.",
    price: 2850,
    compareAtPrice: 3200,
    stock: 8,
    status: "active",
    materials: ["Textured Bouclé Wool", "Solid Birch Frame"],
    dimensions: '88"W x 38"D x 31"H',
    isFeatured: true,
    categoryName: "Sofas & Sectionals",
    galleryName: "Vance Studio & Showroom",
    images: [
      "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=1000&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=1000&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=1000&auto=format&fit=crop&q=80",
    ],
  },
  {
    name: "Kyoto Solid White Oak Low Platform Bed",
    description: "Zen platform bed with cantilevered rails and Japanese mortise joinery. Tool-free assembly.",
    price: 2150,
    compareAtPrice: 2450,
    stock: 5,
    status: "active",
    materials: ["Solid White Oak", "Solid Pine Slats"],
    dimensions: 'King: 84"W x 90"L x 28"H',
    isFeatured: true,
    categoryName: "Beds & Bedroom",
    galleryName: "Kyoto Woodcraft Atelier",
    images: [
      "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=1000&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1540518614846-7ede433c4550?w=1000&auto=format&fit=crop&q=80",
    ],
  },
  {
    name: "Nordic Minimalist Walnut Dining Table 8-Seater",
    description: "Monolithic walnut planks, boat-shaped beveled edge, cylindrical legs for max legroom.",
    price: 2400,
    compareAtPrice: 2800,
    stock: 6,
    status: "active",
    materials: ["Solid American Black Walnut"],
    dimensions: '94"L x 40"W x 30"H',
    isFeatured: true,
    categoryName: "Dining Furniture",
    galleryName: "Nordic Timber & Living",
    images: [
      "https://images.unsplash.com/photo-1615066390971-03e4e1c36ddf?w=1000&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1530018607912-eff2daa1bac4?w=1000&auto=format&fit=crop&q=80",
    ],
  },
  {
    name: "Strata Sculptural Lounge Chair & Ottoman",
    description: "Iconic reading chair in Italian aniline leather, 15-degree tilt, swivel, with ottoman.",
    price: 1650,
    compareAtPrice: 1950,
    stock: 11,
    status: "active",
    materials: ["Cognac Aniline Leather", "Molded Walnut Shell"],
    dimensions: 'Chair: 34"W x 35"D x 33"H',
    isFeatured: true,
    categoryName: "Chairs & Armchairs",
    galleryName: "Vance Studio & Showroom",
    images: [
      "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=1000&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?w=1000&auto=format&fit=crop&q=80",
    ],
  },
  {
    name: "Modena Fluted Roman Travertine Coffee Table",
    description: "Monolithic Roman travertine, honed matte, sealed, fluted pedestals.",
    price: 1350,
    compareAtPrice: 1600,
    stock: 4,
    status: "active",
    materials: ["Natural Italian Roman Travertine"],
    dimensions: '48"L x 28"W x 16"H',
    isFeatured: false,
    categoryName: "Tables & Desks",
    galleryName: "Modena Luxury Living",
    images: [
      "https://images.unsplash.com/photo-1533090161767-e6ffed986c88?w=1000&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=1000&auto=format&fit=crop&q=80",
    ],
  },
  {
    name: "Oslo 4-Door Fluted Teak Media Credenza",
    description: "Tambour fluting, soft-close doors, cable management, holds 85\" TV.",
    price: 1890,
    compareAtPrice: 2200,
    stock: 7,
    status: "active",
    materials: ["Solid Plantation Teak", "Brushed Brass"],
    dimensions: '76"W x 19"D x 26"H',
    isFeatured: true,
    categoryName: "Storage & Credenzas",
    galleryName: "Nordic Timber & Living",
    images: [
      "https://images.unsplash.com/photo-1595428774223-ef52624120d2?w=1000&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=1000&auto=format&fit=crop&q=80",
    ],
  },
  {
    name: "Milano Executive Ergonomic Leather Desk Chair",
    description: "Italian calfskin, synchro-tilt, pneumatic lift, lumbar support.",
    price: 980,
    compareAtPrice: 1150,
    stock: 14,
    status: "active",
    materials: ["Italian Calfskin Leather", "Polished Aluminum"],
    dimensions: '26"W x 26"D x 39"-43"H',
    isFeatured: false,
    categoryName: "Office & Study",
    galleryName: "Modena Luxury Living",
    images: [
      "https://images.unsplash.com/photo-1580481077195-731da9f20974?w=1000&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1505797149-43b0069ec26b?w=1000&auto=format&fit=crop&q=80",
    ],
  },
  {
    name: "Solstice Architectural Brass Arc Floor Lamp",
    description: "Cantilever arc, Nero Marquina marble disc, foot dimmer, linen shade.",
    price: 640,
    compareAtPrice: 750,
    stock: 9,
    status: "active",
    materials: ["Brushed Brass", "Marble Base"],
    dimensions: '65"Reach x 16"W x 82"H',
    isFeatured: false,
    categoryName: "Lighting",
    galleryName: "Vance Studio & Showroom",
    images: [
      "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=1000&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1513506003901-1e6a229e2d15?w=1000&auto=format&fit=crop&q=80",
    ],
  },
];

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function main() {
  const args = process.argv.slice(2);
  const shouldClean = args.includes("--clean");
  const isDry = args.includes("--dry");

  await connectDatabase();
  const prisma = getPrisma();

  console.log("🌱 Dummy seeder starting", { shouldClean, isDry });

  if (shouldClean && !isDry) {
    console.log("🧹 Cleaning existing data & storage folders...");
    // Delete in FK order
    await prisma.orderItem.deleteMany();
    await prisma.order.deleteMany();
    await prisma.cartItem.deleteMany();
    await prisma.cart.deleteMany();
    await prisma.wishlistItem.deleteMany();
    await prisma.product.deleteMany();
    await prisma.gallery.deleteMany();
    await prisma.category.deleteMany();
    // Keep users? Remove only dummy gallery_owner users we create
    // but we clean folders
    const galleriesPath = path.join(STORAGE_ROOT, "galleries");
    const productsPath = path.join(STORAGE_ROOT, "products");
    for (const p of [galleriesPath, productsPath]) {
      const entries = await fs.readdir(p).catch(() => []);
      for (const e of entries) {
        if (e === ".gitkeep") continue;
        await fs.rm(path.join(p, e), { recursive: true, force: true });
        console.log("  removed", path.join(p, e));
      }
    }
  }

  // 1) Categories
  console.log("\n📦 Seeding categories...");
  const categoryByName = {};
  for (const c of CATEGORIES) {
    const slug = slugify(c.name, { lower: true, strict: true });
    if (isDry) {
      console.log(`  dry: ${c.name} -> ${slug}`);
      categoryByName[c.name] = { id: "dry-id", slug };
      continue;
    }
    const cat = await prisma.category.upsert({
      where: { slug },
      update: { arabicName: c.arabicName },
      create: { name: c.name, arabicName: c.arabicName, slug },
    });
    categoryByName[c.name] = cat;
    console.log(`  ✓ ${cat.name} (${cat.id})`);
  }

  // 2) Gallery owners (users)
  console.log("\n👤 Seeding gallery owners...");
  const ownerByGalleryName = {};
  const defaultPassword = "Password123#";
  const hashed = await bcrypt.hash(defaultPassword, 12);
  for (const g of GALLERIES) {
    const { email, firstName, lastName } = g.owner;
    if (isDry) {
      ownerByGalleryName[g.name] = { id: "dry-owner-id", email };
      console.log(`  dry: ${email}`);
      continue;
    }
    // Upsert by email
    let user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      user = await prisma.user.create({
        data: {
          email,
          password: hashed,
          firstName,
          lastName,
          slug: slugify(`${firstName} ${lastName}`, { lower: true, strict: true }) + `-${uuidv4().slice(0, 6)}`,
          role: "gallery_owner",
          isActive: true,
          phone: g.phone,
        },
      });
      console.log(`  ✓ created owner ${email} (${user.id})`);
    } else {
      // ensure role/isActive
      user = await prisma.user.update({
        where: { id: user.id },
        data: { role: "gallery_owner", isActive: true, firstName, lastName },
      });
      console.log(`  ✓ owner exists ${email} (${user.id})`);
    }
    ownerByGalleryName[g.name] = user;
  }

  // Also ensure an admin user exists for testing
  if (!isDry) {
    const adminEmail = "admin@galleries.test";
    let admin = await prisma.user.findUnique({ where: { email: adminEmail } });
    if (!admin) {
      admin = await prisma.user.create({
        data: {
          email: adminEmail,
          password: hashed,
          firstName: "Admin",
          lastName: "Test",
          slug: "admin-test",
          role: "admin",
          isActive: true,
        },
      });
      console.log(`  ✓ created admin ${adminEmail}`);
    }
  }

  // 3) Galleries with images stored correctly
  console.log("\n🏛️ Seeding galleries (with image storage)...");
  const galleryByName = {};
  for (const g of GALLERIES) {
    const slug = slugify(g.name, { lower: true, strict: true });
    const owner = ownerByGalleryName[g.name];

    if (isDry) {
      galleryByName[g.name] = { id: "dry-gallery-id", slug, storageFolder: "dry-folder" };
      console.log(`  dry: ${g.name}`);
      continue;
    }

    // Check existing by slug
    let existing = await prisma.gallery.findUnique({ where: { slug } });
    // Skip re-processing images if exists and not clean
    if (existing && !shouldClean) {
      console.log(`  ↻ gallery exists ${g.name} (${existing.id}) — skip image re-download`);
      galleryByName[g.name] = existing;
      continue;
    }

    // If exists and cleaning, delete its folder before recreate
    if (existing) {
      const oldFolder = existing.storageFolder;
      if (oldFolder) {
        await fs.rm(getFolderPath("galleries", oldFolder), { recursive: true, force: true }).catch(() => {});
      }
      await prisma.gallery.delete({ where: { id: existing.id } });
      console.log(`  🗑 removed existing gallery ${g.name}`);
    }

    const storageFolder = `${slug}-${uuidv4()}`;
    const folderPath = getFolderPath("galleries", storageFolder);
    await fs.mkdir(folderPath, { recursive: true });

    console.log(`  ⬇ downloading images for ${g.name} -> ${storageFolder}`);
    const bannerFile = await downloadAndSave({
      url: g.banner,
      folderPath,
      prefix: "banner",
      width: 1000,
      height: 500,
    });
    const logoFile = await downloadAndSave({
      url: g.logo,
      folderPath,
      prefix: "logo",
      width: 500,
      height: 500,
      fit: "contain",
    });
    const imageFiles = [];
    for (let i = 0; i < g.images.length; i += 1) {
      const f = await downloadAndSave({
        url: g.images[i],
        folderPath,
        prefix: `image-number-${i + 1}`,
        width: 1000,
        height: 500,
      });
      imageFiles.push(f);
    }

    const gallery = await prisma.gallery.create({
      data: {
        name: g.name,
        slug,
        description: g.description,
        city: g.city,
        country: g.country,
        street: g.street,
        phone: g.phone,
        logo: logoFile,
        banner: bannerFile,
        images: imageFiles,
        storageFolder,
        ownerId: owner.id,
        isActive: true,
      },
    });
    galleryByName[g.name] = gallery;
    console.log(`  ✓ gallery ${gallery.name} (${gallery.id}) folder=${storageFolder}`);
    console.log(`     logo=${logoFile} banner=${bannerFile} images=${imageFiles.join(", ")}`);
  }

  // 4) Products with images stored correctly under storage/uploads/products
  console.log("\n🛋️ Seeding products (with image storage)...");
  for (const p of PRODUCTS) {
    const slug = slugify(p.name, { lower: true, strict: true });
    const gallery = galleryByName[p.galleryName];
    const category = categoryByName[p.categoryName];
    const owner = ownerByGalleryName[p.galleryName];

    if (!gallery || !category || !owner) {
      console.warn(`  ⚠ skip product ${p.name}: missing gallery/category/owner`);
      continue;
    }

    if (isDry) {
      console.log(`  dry: ${p.name} -> gallery ${gallery.id} cat ${category.id}`);
      continue;
    }

    // Unique per gallery: check existing
    const existing = await prisma.product.findUnique({
      where: { galleryId_slug: { galleryId: gallery.id, slug } },
    });
    if (existing && !shouldClean) {
      console.log(`  ↻ product exists ${p.name} in ${p.galleryName} — skip`);
      continue;
    }
    if (existing) {
      // remove old folder if stored path contains folder prefix
      if (existing.images?.[0]?.includes("/")) {
        const oldFolder = existing.images[0].split("/")[0];
        await fs.rm(getFolderPath("products", oldFolder), { recursive: true, force: true }).catch(() => {});
      }
      await prisma.product.delete({ where: { id: existing.id } });
      console.log(`  🗑 removed existing product ${p.name}`);
    }

    const storageFolder = `${slug}-${uuidv4()}`;
    const folderPath = getFolderPath("products", storageFolder);
    await fs.mkdir(folderPath, { recursive: true });

    console.log(`  ⬇ downloading ${p.images.length} images for ${p.name}`);
    const storedImagePaths = [];
    for (let i = 0; i < p.images.length; i += 1) {
      const fileName = await downloadAndSave({
        url: p.images[i],
        folderPath,
        prefix: `product-number-${i + 1}`,
        width: 1000,
        height: 1000,
      });
      // Store as relative path under products: "folder/fileName" so DB knows folder without schema change
      storedImagePaths.push(`${storageFolder}/${fileName}`);
    }
    const mainImageUrl = storedImagePaths[0] || null;

    const product = await prisma.product.create({
      data: {
        name: p.name,
        slug,
        description: p.description,
        price: p.price,
        compareAtPrice: p.compareAtPrice,
        stock: p.stock,
        status: p.status,
        materials: p.materials,
        dimensions: p.dimensions,
        isFeatured: p.isFeatured,
        galleryId: gallery.id,
        createdById: owner.id,
        categoryId: category.id,
        mainImageUrl,
        images: storedImagePaths,
      },
    });
    console.log(`  ✓ product ${product.name} (${product.id}) main=${mainImageUrl}`);
    console.log(`     images: ${storedImagePaths.join(", ")}`);
  }

  console.log("\n✅ Seeding complete");
  console.log("  Default owner password:", defaultPassword);
  console.log("  Admin: admin@galleries.test / Password123#");
  console.log("  Storage: /storage is served at", process.env.APP_URL || "http://localhost:3000", "/storage");
  console.log("  Gallery images -> /storage/uploads/galleries/<folder>/<file>");
  console.log("  Product images -> /storage/uploads/products/<folder>/<file>");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed", e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await disconnectDatabase();
  });
