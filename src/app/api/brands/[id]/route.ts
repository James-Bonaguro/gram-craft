import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const data = await req.json();

    if (data.isDefault) {
      await prisma.brandKit.updateMany({
        where: { id: { not: id }, isDefault: true },
        data: { isDefault: false },
      });
    }

    const brand = await prisma.brandKit.update({
      where: { id },
      data: {
        name: data.name,
        handle: data.handle,
        displayName: data.displayName,
        avatarUrl: data.avatarUrl,
        primaryColor: data.primaryColor,
        secondaryColor: data.secondaryColor,
        bgColor: data.bgColor,
        cardBgColor: data.cardBgColor,
        textColor: data.textColor,
        accentColor: data.accentColor,
        fontHeading: data.fontHeading,
        fontBody: data.fontBody,
        toneVoice: data.toneVoice,
        targetAudience: data.targetAudience,
        bannedWords: data.bannedWords,
        isDefault: Boolean(data.isDefault),
      },
    });

    return NextResponse.json(brand);
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await prisma.brandKit.delete({
      where: { id },
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
