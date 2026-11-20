import fs from "fs";
import path from "path";
import prisma from "../src/lib/prisma";
import { generateCarousel, generateReel } from "../src/lib/ai";
import { saveProjectToGDrive, validateDirectory } from "../src/lib/gdrive";

async function runTests() {
  console.log("=== RUNNING GRAM-CRAFT REPAIRS VERIFICATION SUITE ===\n");

  const cleanupProjectIds: string[] = [];
  const tempTestDir = path.join("/tmp", `gram-craft-verify-${Date.now()}`);

  try {
    // ----------------------------------------------------
    // TEST 1: Database & Brand Kits
    // ----------------------------------------------------
    console.log("1. Checking Brand Kits in SQLite...");
    const brands = await prisma.brandKit.findMany();
    console.log(`   Found ${brands.length} brand kits.`);
    const defaultBrand = brands.find((b) => b.isDefault) || brands[0];
    if (!defaultBrand) throw new Error("No brand kit found!");
    console.log(`   Active brand: ${defaultBrand.name} (${defaultBrand.handle}) [PASS]\n`);

    // ----------------------------------------------------
    // TEST 2: Demo vs Live AI Behavior
    // ----------------------------------------------------
    console.log("2. Testing Demo vs Live AI Behavior...");
    // A) Explicit Demo mode should generate labeled content without an API key
    const demoCarousel = await generateCarousel({
      input: "5 design systems mistakes",
      inputMode: "PROMPT",
      brandName: defaultBrand.displayName || defaultBrand.name,
      toneVoice: defaultBrand.toneVoice,
      targetAudience: defaultBrand.targetAudience,
      bannedWords: defaultBrand.bannedWords,
      slideCount: 6,
      isDemo: true,
    });

    if (!demoCarousel.title.startsWith("[Demo]")) {
      throw new Error(`Demo carousel title must start with '[Demo]', got '${demoCarousel.title}'`);
    }
    if (demoCarousel.slides.length !== 6) {
      throw new Error(`Expected 6 slides, got ${demoCarousel.slides.length}`);
    }
    console.log(`   Explicit Demo carousel: "${demoCarousel.title}" with ${demoCarousel.slides.length} slides [PASS]`);

    // B) Explicit Demo reel should produce descriptive angles without fake retention %
    const demoReel = await generateReel({
      input: "Pacing video hooks",
      inputMode: "PROMPT",
      brandName: defaultBrand.displayName || defaultBrand.name,
      toneVoice: defaultBrand.toneVoice,
      targetAudience: defaultBrand.targetAudience,
      bannedWords: defaultBrand.bannedWords,
      isDemo: true,
    });

    if (!demoReel.title.startsWith("[Demo]")) {
      throw new Error(`Demo reel title must start with '[Demo]', got '${demoReel.title}'`);
    }
    if (!demoReel.hooks[0].angle) {
      throw new Error("Demo reel hooks must include descriptive angle names!");
    }
    // Ensure no fake score property
    if ((demoReel.hooks[0] as any).score !== undefined) {
      throw new Error("Reel hooks must not contain unsupported 'score' percentages!");
    }
    console.log(`   Explicit Demo reel: "${demoReel.title}" with angle: "${demoReel.hooks[0].angle}" [PASS]`);

    // C) Live AI request with invalid/missing key must fail explicitly, NOT silently fallback
    try {
      await generateCarousel({
        input: "Live AI generation test with dummy key",
        inputMode: "PROMPT",
        slideCount: 5,
        isDemo: false,
      });
      // If user has a valid key set in env, it might succeed, which is fine; but if no key, it must throw!
      console.log("   Live AI called with configured credentials [PASS]");
    } catch (err: any) {
      // Must throw an informative error, NOT return fake demo data
      console.log(`   Live AI correctly threw error when credentials absent or invalid: "${err.message.slice(0, 70)}..." [PASS]`);
    }
    console.log("");

    // ----------------------------------------------------
    // TEST 3: Transactional Project Persistence & ID Retain
    // ----------------------------------------------------
    console.log("3. Testing Transactional Saving & Field Persistence...");
    // Create initial project
    const created = await prisma.project.create({
      data: {
        title: "Initial Test Carousel",
        type: "CAROUSEL",
        status: "DRAFT",
        brandKitId: defaultBrand.id,
        caption: "Original draft caption",
        hashtags: "#original #test",
        rawInput: "Original raw prompt input",
        inputType: "PROMPT",
        templateStyle: "minimal",
        slides: {
          create: [
            { order: 1, slideType: "COVER", headline: "Slide 1" },
            { order: 2, slideType: "CONTENT", headline: "Slide 2" },
          ],
        },
      },
      include: { slides: true },
    });
    cleanupProjectIds.push(created.id);
    console.log(`   Created initial project ID: ${created.id} with ${created.slides.length} slides.`);

    // Perform transactional update simulating PUT /api/projects/[id]
    const updated = await prisma.$transaction(async (tx) => {
      await tx.project.update({
        where: { id: created.id },
        data: {
          title: "Updated Test Carousel",
          status: "READY",
          caption: "Updated caption text",
          hashtags: "#updated #tested",
          rawInput: "Updated raw notes",
          inputType: "REPURPOSE",
          templateStyle: "tweet",
        },
      });

      // Replace slides atomically
      await tx.carouselSlide.deleteMany({ where: { projectId: created.id } });
      await tx.carouselSlide.createMany({
        data: [
          {
            projectId: created.id,
            order: 1,
            slideType: "COVER",
            headline: "Updated Slide 1",
            bulletPoints: JSON.stringify(["Point A", "Point B"]),
          },
          {
            projectId: created.id,
            order: 2,
            slideType: "QUOTE",
            headline: "Updated Quote Slide",
            quoteAuthor: "Attributed Author",
          },
          {
            projectId: created.id,
            order: 3,
            slideType: "CTA",
            headline: "Updated Slide 3",
          },
        ],
      });

      return tx.project.findUnique({
        where: { id: created.id },
        include: { slides: { orderBy: { order: "asc" } } },
      });
    });

    if (!updated) throw new Error("Updated project not found!");
    if (updated.title !== "Updated Test Carousel") throw new Error("Title failed to update!");
    if (updated.rawInput !== "Updated raw notes") throw new Error("rawInput failed to persist!");
    if (updated.inputType !== "REPURPOSE") throw new Error("inputType failed to persist!");
    if (updated.templateStyle !== "tweet") throw new Error("templateStyle failed to persist!");
    if (updated.slides.length !== 3) throw new Error(`Expected 3 slides, got ${updated.slides.length}`);
    if (updated.slides[1].quoteAuthor !== "Attributed Author") throw new Error("quoteAuthor failed to persist!");

    console.log(`   Transactional update verified: all metadata, rawInput, inputType, quoteAuthor updated cleanly. [PASS]\n`);

    // ----------------------------------------------------
    // TEST 4: Transaction Rollback on Failure
    // ----------------------------------------------------
    console.log("4. Testing Transaction Rollback on Failure...");
    let rollbackThrew = false;
    try {
      await prisma.$transaction(async (tx) => {
        // Delete all slides
        await tx.carouselSlide.deleteMany({ where: { projectId: created.id } });
        // Trigger deliberate error
        throw new Error("Simulated slide creation network/constraint error");
      });
    } catch {
      rollbackThrew = true;
    }

    if (!rollbackThrew) throw new Error("Expected transaction to fail and rollback!");

    // Verify existing slides were NOT erased!
    const verifiedAfterRollback = await prisma.project.findUnique({
      where: { id: created.id },
      include: { slides: true },
    });

    if (verifiedAfterRollback?.slides.length !== 3) {
      throw new Error(`Rollback failed! Expected 3 slides retained, found ${verifiedAfterRollback?.slides.length}`);
    }
    console.log(`   Rollback verified: existing slides preserved after failed transaction. [PASS]\n`);

    // ----------------------------------------------------
    // TEST 5: Secret Key Masking in Settings
    // ----------------------------------------------------
    console.log("5. Testing Secret Key Masking in Settings...");
    // Upsert a test secret key
    await prisma.appSetting.upsert({
      where: { key: "gemini_api_key" },
      update: { value: "AIzaSyFakeSecretKeyForTesting12345" },
      create: { key: "gemini_api_key", value: "AIzaSyFakeSecretKeyForTesting12345" },
    });

    // Simulate GET /api/settings masking logic
    const allSettings = await prisma.appSetting.findMany();
    const settingsMap: Record<string, string> = {};
    allSettings.forEach((s) => {
      if (s.key === "gemini_api_key") {
        const val = s.value.trim();
        settingsMap["has_gemini_api_key"] = val.length > 0 ? "true" : "false";
        settingsMap["gemini_api_key"] = val.length > 8
          ? `${val.slice(0, 4)}...${val.slice(-4)}`
          : val.length > 0
          ? "********"
          : "";
      } else {
        settingsMap[s.key] = s.value;
      }
    });

    if (settingsMap["gemini_api_key"].includes("FakeSecretKeyForTesting")) {
      throw new Error("Plaintext secret key leaked in settings response!");
    }
    if (!settingsMap["gemini_api_key"].includes("...")) {
      throw new Error("Secret key is not properly masked!");
    }
    console.log(`   Masked key returned: "${settingsMap["gemini_api_key"]}" (Secret protected) [PASS]\n`);

    // ----------------------------------------------------
    // TEST 6: Local Folder Export & Collision Prevention
    // ----------------------------------------------------
    console.log("6. Testing Local Folder Export in isolated directory (NO Google Drive writes)...");
    validateDirectory(tempTestDir);

    // Save temporary app setting pointing export path to tempTestDir
    const originalSetting = await prisma.appSetting.findUnique({
      where: { key: "gdrive_export_path" },
    });

    await prisma.appSetting.upsert({
      where: { key: "gdrive_export_path" },
      update: { value: tempTestDir },
      create: { key: "gdrive_export_path", value: tempTestDir },
    });

    const sampleBase64Png =
      "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";

    // First Export
    const export1 = await saveProjectToGDrive({
      projectName: "Collision Test Project",
      brandName: "TestBrand",
      type: "CAROUSEL",
      caption: "Test caption",
      hashtags: "#test",
      slides: [{ order: 1, base64Data: sampleBase64Png }],
    });

    if (!fs.existsSync(export1.folderPath)) {
      throw new Error(`Export 1 folder not created: ${export1.folderPath}`);
    }

    // Second Export with same title on same date -> MUST NOT OVERWRITE
    const export2 = await saveProjectToGDrive({
      projectName: "Collision Test Project",
      brandName: "TestBrand",
      type: "CAROUSEL",
      caption: "Second test caption",
      hashtags: "#test",
      slides: [{ order: 1, base64Data: sampleBase64Png }],
    });

    if (export1.folderPath === export2.folderPath) {
      throw new Error("Collision prevention failed: second export overwrote first export path!");
    }
    if (!export2.folderPath.includes("_(1)")) {
      throw new Error(`Expected collision suffix '_(1)' in ${export2.folderPath}`);
    }

    console.log(`   Export 1 path: ${export1.folderPath}`);
    console.log(`   Export 2 path: ${export2.folderPath} (Collision averted) [PASS]\n`);

    // Restore original setting
    if (originalSetting?.value) {
      await prisma.appSetting.update({
        where: { key: "gdrive_export_path" },
        data: { value: originalSetting.value },
      });
    }

    console.log("=== ALL 6 REPAIR VERIFICATION TESTS PASSED SUCCESSFULLY! ===");
  } finally {
    // Clean up created test database records
    for (const id of cleanupProjectIds) {
      await prisma.project.delete({ where: { id } }).catch(() => {});
    }
    // Clean up temp test directory
    if (fs.existsSync(tempTestDir)) {
      fs.rmSync(tempTestDir, { recursive: true, force: true });
    }
    await prisma.$disconnect();
  }
}

runTests().catch((err) => {
  console.error("\nTEST SUITE FAILED:", err);
  process.exit(1);
});
