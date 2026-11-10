import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const brands = await prisma.brandKit.findMany({
      orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }],
    });
    return NextResponse.json(brands);
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const data = await req.json();

    if (data.isDefault) {
      // Unset previous defaults
      await prisma.brandKit.updateMany({
        where: { isDefault: true },
        data: { isDefault: false },
      });
    }

    const brand = await prisma.brandKit.create({
      data: {
        name: data.name || "Untitled Brand",
        handle: data.handle || "@creator",
        displayName: data.displayName || "Creator",
        avatarUrl: data.avatarUrl || null,
        primaryColor: data.primaryColor || "#6366F1",
        secondaryColor: data.secondaryColor || "#EC4899",
        bgColor: data.bgColor || "#0F172A",
        cardBgColor: data.cardBgColor || "#1E293B",
        textColor: data.textColor || "#F8FAFC",
        accentColor: data.accentColor || "#F59E0B",
        fontHeading: data.fontHeading || "Inter",
        fontBody: data.fontBody || "Inter",
        toneVoice: data.toneVoice || "Direct, punchy, insightful",
        targetAudience: data.targetAudience || "Entrepreneurs & creators",
        bannedWords: data.bannedWords || "synergy, paradigm, delve",
        isDefault: Boolean(data.isDefault),
      },
    });

    return NextResponse.json(brand);
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
