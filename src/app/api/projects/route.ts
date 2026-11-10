import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type");

    const projects = await prisma.project.findMany({
      where: type ? { type } : undefined,
      include: {
        brandKit: true,
        slides: {
          orderBy: { order: "asc" },
        },
        reelBeats: {
          orderBy: { order: "asc" },
        },
      },
      orderBy: { updatedAt: "desc" },
    });

    return NextResponse.json(projects);
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const data = await req.json();

    const project = await prisma.project.create({
      data: {
        title: data.title || "Untitled Project",
        type: data.type || "CAROUSEL",
        status: data.status || "DRAFT",
        brandKitId: data.brandKitId || null,
        caption: data.caption || "",
        hashtags: data.hashtags || "",
        rawInput: data.rawInput || "",
        inputType: data.inputType || "PROMPT",
        templateStyle: data.templateStyle || "minimal",
        slides: data.slides?.length
          ? {
              create: data.slides.map((s: { order: number; slideType: string; headline: string; subheadline?: string; bodyText?: string; bulletPoints?: string[]; badgeText?: string; quoteAuthor?: string; customJson?: string }) => ({
                order: s.order,
                slideType: s.slideType,
                headline: s.headline,
                subheadline: s.subheadline || null,
                bodyText: s.bodyText || null,
                bulletPoints: s.bulletPoints ? JSON.stringify(s.bulletPoints) : null,
                badgeText: s.badgeText || null,
                quoteAuthor: s.quoteAuthor || null,
                customJson: s.customJson || null,
              })),
            }
          : undefined,
        reelBeats: data.reelBeats?.length
          ? {
              create: data.reelBeats.map((b: { order: number; beatType: string; visualCue: string; spokenAudio: string; onScreenText?: string; estimatedSeconds?: number }) => ({
                order: b.order,
                beatType: b.beatType,
                visualCue: b.visualCue,
                spokenAudio: b.spokenAudio,
                onScreenText: b.onScreenText || null,
                estimatedSeconds: b.estimatedSeconds || 5,
              })),
            }
          : undefined,
      },
      include: {
        brandKit: true,
        slides: { orderBy: { order: "asc" } },
        reelBeats: { orderBy: { order: "asc" } },
      },
    });

    return NextResponse.json(project);
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
