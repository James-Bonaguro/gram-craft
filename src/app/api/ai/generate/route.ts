import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { generateCarousel, generateReel } from "@/lib/ai";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { type, input, inputMode, brandKitId, slideCount, isDemo } = body;

    if (!input || !input.trim()) {
      return NextResponse.json({ error: "Input prompt or text is required." }, { status: 400 });
    }

    // Look up brand kit if selected
    let brand;
    if (brandKitId) {
      brand = await prisma.brandKit.findUnique({ where: { id: brandKitId } });
    }
    if (!brand) {
      brand = await prisma.brandKit.findFirst({ where: { isDefault: true } });
    }

    if (type === "REEL") {
      const generated = await generateReel({
        input,
        inputMode: inputMode || "PROMPT",
        brandName: brand?.displayName || brand?.name,
        toneVoice: brand?.toneVoice,
        targetAudience: brand?.targetAudience,
        bannedWords: brand?.bannedWords,
        isDemo: Boolean(isDemo),
      });
      return NextResponse.json(generated);
    } else {
      // Default CAROUSEL
      const generated = await generateCarousel({
        input,
        inputMode: inputMode || "PROMPT",
        brandName: brand?.displayName || brand?.name,
        toneVoice: brand?.toneVoice,
        targetAudience: brand?.targetAudience,
        bannedWords: brand?.bannedWords,
        slideCount: slideCount || 6,
        isDemo: Boolean(isDemo),
      });
      return NextResponse.json(generated);
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
