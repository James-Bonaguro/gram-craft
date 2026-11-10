import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        brandKit: true,
        slides: { orderBy: { order: "asc" } },
        reelBeats: { orderBy: { order: "asc" } },
      },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    return NextResponse.json(project);
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const data = await req.json();

    // Update base project details
    await prisma.project.update({
      where: { id },
      data: {
        title: data.title,
        status: data.status,
        brandKitId: data.brandKitId || null,
        caption: data.caption,
        hashtags: data.hashtags,
        templateStyle: data.templateStyle,
      },
    });

    // If updated slides are provided, replace them atomically
    if (data.slides) {
      await prisma.carouselSlide.deleteMany({ where: { projectId: id } });
      if (data.slides.length > 0) {
        await prisma.carouselSlide.createMany({
          data: data.slides.map((s: { order: number; slideType: string; headline: string; subheadline?: string; bodyText?: string; bulletPoints?: string[]; badgeText?: string; quoteAuthor?: string; customJson?: string }) => ({
            projectId: id,
            order: s.order,
            slideType: s.slideType,
            headline: s.headline,
            subheadline: s.subheadline || null,
            bodyText: s.bodyText || null,
            bulletPoints: s.bulletPoints ? (Array.isArray(s.bulletPoints) ? JSON.stringify(s.bulletPoints) : s.bulletPoints) : null,
            badgeText: s.badgeText || null,
            quoteAuthor: s.quoteAuthor || null,
            customJson: s.customJson || null,
          })),
        });
      }
    }

    // If updated reel beats are provided, replace them atomically
    if (data.reelBeats) {
      await prisma.reelBeat.deleteMany({ where: { projectId: id } });
      if (data.reelBeats.length > 0) {
        await prisma.reelBeat.createMany({
          data: data.reelBeats.map((b: { order: number; beatType: string; visualCue: string; spokenAudio: string; onScreenText?: string; estimatedSeconds?: number }) => ({
            projectId: id,
            order: b.order,
            beatType: b.beatType,
            visualCue: b.visualCue,
            spokenAudio: b.spokenAudio,
            onScreenText: b.onScreenText || null,
            estimatedSeconds: b.estimatedSeconds || 5,
          })),
        });
      }
    }

    const updated = await prisma.project.findUnique({
      where: { id },
      include: {
        brandKit: true,
        slides: { orderBy: { order: "asc" } },
        reelBeats: { orderBy: { order: "asc" } },
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await prisma.project.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
