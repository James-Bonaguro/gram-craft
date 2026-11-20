import fs from "fs";
import path from "path";
import prisma from "./prisma";

export async function getGDriveExportPath(): Promise<string> {
  const setting = await prisma.appSetting.findUnique({
    where: { key: "gdrive_export_path" },
  });

  if (setting?.value) {
    return setting.value;
  }

  // Fallback to default user path
  return "/Users/jamesbonaguro/Library/CloudStorage/GoogleDrive-james.bonaguro@gmail.com/My Drive/GramCraft Exports";
}

export function validateDirectory(dirPath: string): { isValid: boolean; error?: string } {
  try {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
    fs.accessSync(dirPath, fs.constants.W_OK);
    return { isValid: true };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return { isValid: false, error: errorMsg };
  }
}

export interface SaveExportPayload {
  projectName: string;
  brandName?: string;
  type: "CAROUSEL" | "REEL";
  caption?: string;
  hashtags?: string;
  slides?: Array<{ order: number; base64Data: string }>;
  scriptText?: string;
}

export async function saveProjectToGDrive(payload: SaveExportPayload) {
  const basePath = await getGDriveExportPath();
  const brandFolder = payload.brandName
    ? payload.brandName.replace(/[^a-zA-Z0-9_-]/g, "_")
    : "General";

  const safeTitle = payload.projectName.replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 40);
  const dateStr = new Date().toISOString().split("T")[0];
  let targetFolder = path.join(basePath, brandFolder, `${dateStr}_${safeTitle}`);

  // Prevent silently overwriting previous exports
  if (fs.existsSync(targetFolder)) {
    let counter = 1;
    while (fs.existsSync(`${targetFolder}_(${counter})`)) {
      counter++;
    }
    targetFolder = `${targetFolder}_(${counter})`;
  }

  const validation = validateDirectory(targetFolder);
  if (!validation.isValid) {
    throw new Error(`Failed to access local export directory: ${validation.error}`);
  }

  const writtenFiles: string[] = [];

  // Write Caption & Hashtags
  const captionContent = `=== INSTAGRAM CAPTION ===\n\n${payload.caption || ""}\n\n=== HASHTAGS ===\n\n${payload.hashtags || ""}\n\n=== PROJECT TYPE: ${payload.type} ===\nExported: ${new Date().toLocaleString()}`;
  const captionPath = path.join(targetFolder, "caption_and_hashtags.txt");
  fs.writeFileSync(captionPath, captionContent, "utf-8");
  writtenFiles.push(captionPath);

  // Write Reel Script if applicable
  if (payload.scriptText) {
    const scriptPath = path.join(targetFolder, "reel_storyboard_script.txt");
    fs.writeFileSync(scriptPath, payload.scriptText, "utf-8");
    writtenFiles.push(scriptPath);
  }

  // Write Slide Images if applicable
  if (payload.slides && payload.slides.length > 0) {
    for (const slide of payload.slides) {
      const fileName = `slide_${String(slide.order).padStart(2, "0")}.png`;
      const filePath = path.join(targetFolder, fileName);
      // Remove base64 data URL prefix if present
      const cleanBase64 = slide.base64Data.replace(/^data:image\/\w+;base64,/, "");
      fs.writeFileSync(filePath, Buffer.from(cleanBase64, "base64"));
      writtenFiles.push(filePath);
    }
  }

  return {
    success: true,
    folderPath: targetFolder,
    writtenFiles,
  };
}
