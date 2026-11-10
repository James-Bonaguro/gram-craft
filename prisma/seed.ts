import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding initial GramCraft data...");

  // Default Brand Kit 1: Tech & Modern Dark
  const existingDefault = await prisma.brandKit.findFirst({
    where: { isDefault: true },
  });

  if (!existingDefault) {
    await prisma.brandKit.create({
      data: {
        name: "Intersection Modern",
        handle: "@jamesbonaguro",
        displayName: "James Bonaguro",
        primaryColor: "#6366F1", // Indigo
        secondaryColor: "#EC4899", // Pink
        bgColor: "#090D16", // Deep Slate
        cardBgColor: "#131C2E", // Elevated Slate
        textColor: "#F8FAFC", // Off-white
        accentColor: "#F59E0B", // Warm Amber
        fontHeading: "Inter",
        fontBody: "Inter",
        toneVoice: "Direct, authoritative, tactical, zero fluff",
        targetAudience: "Founders, executives, and high-growth operators",
        bannedWords: "synergy, paradigm shift, revolutionary, game-changer",
        isDefault: true,
      },
    });

    // Brand Kit 2: Minimal Editorial
    await prisma.brandKit.create({
      data: {
        name: "Minimalist Thought Leader",
        handle: "@insightcraft",
        displayName: "Insight Craft",
        primaryColor: "#18181B", // Zinc 900
        secondaryColor: "#71717A", // Zinc 500
        bgColor: "#FFFFFF", // Pure White
        cardBgColor: "#F4F4F5", // Light Gray Card
        textColor: "#09090B", // Black
        accentColor: "#2563EB", // Royal Blue
        fontHeading: "Georgia",
        fontBody: "Inter",
        toneVoice: "Thoughtful, analytical, narrative-driven",
        targetAudience: "Curious builders and independent creators",
        bannedWords: "delve, unpack, crucial, needless to say",
        isDefault: false,
      },
    });

    console.log("Created default brand kits.");
  }

  // Seed default Google Drive path setting
  const defaultGDrive =
    "/Users/jamesbonaguro/Library/CloudStorage/GoogleDrive-james.bonaguro@gmail.com/My Drive/GramCraft Exports";

  await prisma.appSetting.upsert({
    where: { key: "gdrive_export_path" },
    update: {},
    create: {
      key: "gdrive_export_path",
      value: defaultGDrive,
    },
  });

  await prisma.appSetting.upsert({
    where: { key: "ai_provider" },
    update: {},
    create: {
      key: "ai_provider",
      value: "gemini",
    },
  });

  console.log("Seeding complete!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
