import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const settings = await prisma.appSetting.findMany();
    const map: Record<string, string> = {};
    settings.forEach((s) => {
      if (s.key === "gemini_api_key") {
        const val = s.value.trim();
        map["has_gemini_api_key"] = val.length > 0 ? "true" : "false";
        map["gemini_api_key"] = val.length > 8
          ? `${val.slice(0, 4)}...${val.slice(-4)}`
          : val.length > 0
          ? "********"
          : "";
      } else {
        map[s.key] = s.value;
      }
    });
    return NextResponse.json(map);
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body: Record<string, string> = await req.json();

    for (const [key, rawValue] of Object.entries(body)) {
      const value = String(rawValue).trim();
      
      // Protect secret key from being overwritten with masked value or blank when already set
      if (key === "gemini_api_key") {
        if (value.includes("...") || value === "********" || value === "") {
          continue; // Keep existing stored secret
        }
      }

      await prisma.appSetting.upsert({
        where: { key },
        update: { value },
        create: { key, value },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
