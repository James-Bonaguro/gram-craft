import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { generateCarousel, generateReel } from "@/lib/ai";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { type, input, inputMode, brandKitId, slideCount } = body;

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
        brandName: brand?.name || brand?.displayName,
        toneVoice: brand?.toneVoice,
        targetAudience: brand?.targetAudience,
        bannedWords: brand?.bannedWords,
      });
      return NextResponse.json(generated);
    } else {
      // Default CAROUSEL
      const generated = await generateCarousel({
        input,
        inputMode: inputMode || "PROMPT",
        brandName: brand?.name || brand?.displayName,
        toneVoice: brand?.toneVoice,
        targetAudience: brand?.targetAudience,
        bannedWords: brand?.bannedWords,
        slideCount: slideCount || 6,
      });
      return NextResponse.json(generated);
    }
  } catch (error) {
    console.error("AI Generation Route Error:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
