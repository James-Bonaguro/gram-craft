import prisma from "../src/lib/prisma";
import { generateCarousel, generateReel } from "../src/lib/ai";
import { saveProjectToGDrive, getGDriveExportPath } from "../src/lib/gdrive";

async function runTests() {
  console.log("=== RUNNING GRAM-CRAFT VERIFICATION TESTS ===\n");

  // 1. Database & Brand Kits
  console.log("1. Checking Brand Kits in SQLite...");
  const brands = await prisma.brandKit.findMany();
  console.log(`   Found ${brands.length} brand kits.`);
  const defaultBrand = brands.find((b) => b.isDefault);
  if (!defaultBrand) throw new Error("No default brand kit found!");
  console.log(`   Default brand: ${defaultBrand.name} (${defaultBrand.handle}) [OK]\n`);

  // 2. Carousel Generation Test
  console.log("2. Testing Carousel Generation engine...");
  const carousel = await generateCarousel({
    input: "3 counterintuitive rules for high-ticket client acquisition",
    inputMode: "PROMPT",
    brandName: defaultBrand.name,
    toneVoice: defaultBrand.toneVoice,
    targetAudience: defaultBrand.targetAudience,
    bannedWords: defaultBrand.bannedWords,
    slideCount: 6,
  });
  console.log(`   Generated title: "${carousel.title}"`);
  console.log(`   Slides count: ${carousel.slides.length}`);
  if (carousel.slides.length !== 6) throw new Error("Expected 6 slides!");
  console.log(`   Slide 1 Hook: "${carousel.slides[0].headline}" [OK]\n`);

  // 3. Reel Generation Test
  console.log("3. Testing Reel Storyboard & Script engine...");
  const reel = await generateReel({
    input: "Why most founders fail at scaling content",
    inputMode: "PROMPT",
    brandName: defaultBrand.name,
    toneVoice: defaultBrand.toneVoice,
    targetAudience: defaultBrand.targetAudience,
  });
  console.log(`   Reel title: "${reel.title}"`);
  console.log(`   Hook variants generated: ${reel.hooks.length}`);
  console.log(`   Beats generated: ${reel.beats.length}`);
  console.log(`   Beat 1 Action: "${reel.beats[0].visualCue}"`);
  console.log(`   Beat 1 Spoken: "${reel.beats[0].spokenAudio}" [OK]\n`);

  // 4. Persistence Test (Save Project & Slides to DB)
  console.log("4. Testing Project Persistence in SQLite...");
  const savedProject = await prisma.project.create({
    data: {
      title: carousel.title,
      type: "CAROUSEL",
      status: "READY",
      brandKitId: defaultBrand.id,
      caption: carousel.caption,
      hashtags: carousel.hashtags,
      inputType: "PROMPT",
      templateStyle: "minimal",
      slides: {
        create: carousel.slides.map((s) => ({
          order: s.order,
          slideType: s.slideType,
          headline: s.headline,
          subheadline: s.subheadline,
          bodyText: s.bodyText,
          bulletPoints: s.bulletPoints ? JSON.stringify(s.bulletPoints) : null,
          badgeText: s.badgeText,
        })),
      },
    },
    include: { slides: true },
  });
  console.log(`   Saved project ID: ${savedProject.id} with ${savedProject.slides.length} slides [OK]\n`);

  // 5. Google Drive Sync Integration Test
  console.log("5. Testing Google Drive Local Sync...");
  const gdrivePath = await getGDriveExportPath();
  console.log(`   Target Google Drive Path: ${gdrivePath}`);

  // Test export with 1 sample 1x1 base64 transparent PNG
  const sampleBase64Png =
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";

  const exportResult = await saveProjectToGDrive({
    projectName: "Test Reel Export",
    brandName: defaultBrand.name,
    type: "REEL",
    caption: reel.caption,
    hashtags: reel.hashtags,
    scriptText: reel.beats.map((b) => `Beat ${b.order}: ${b.spokenAudio}`).join("\n"),
    slides: [{ order: 1, base64Data: sampleBase64Png }],
  });

  console.log(`   Exported successfully to: ${exportResult.folderPath}`);
  console.log(`   Files written: ${exportResult.writtenFiles.join(", ")} [OK]\n`);

  console.log("=== ALL GRAM-CRAFT VERIFICATION TESTS PASSED SUCCESSFULLY! ===");
}

runTests()
  .catch((err) => {
    console.error("Test failed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
