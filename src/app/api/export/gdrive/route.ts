import { NextResponse } from "next/server";
import { saveProjectToGDrive, getGDriveExportPath } from "@/lib/gdrive";

export async function GET() {
  try {
    const currentPath = await getGDriveExportPath();
    return NextResponse.json({ path: currentPath });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const result = await saveProjectToGDrive(body);
    return NextResponse.json(result);
  } catch (error) {
    console.error("GDrive Export Error:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
