"use client";

import React, { useState } from "react";
import { toPng } from "html-to-image";
import JSZip from "jszip";
import { Download, Cloud, Check, Copy, Loader2, X, FolderCheck, Sparkles } from "lucide-react";
import { CarouselSlideData, ReelBeatData, BrandKitData } from "@/types";

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: "CAROUSEL" | "REEL";
  projectTitle: string;
  brand: BrandKitData;
  caption?: string;
  hashtags?: string;
  slides?: CarouselSlideData[];
  reelBeats?: ReelBeatData[];
  slideElementPrefix?: string;
}

export function ExportModal({
  isOpen,
  onClose,
  type,
  projectTitle,
  brand,
  caption = "",
  hashtags = "",
  slides = [],
  reelBeats = [],
  slideElementPrefix = "preview-slide",
}: ExportModalProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState("");
  const [isGDriveSyncing, setIsGDriveSyncing] = useState(false);
  const [gdriveResult, setGdriveResult] = useState<{ folderPath: string; writtenFiles: string[] } | null>(null);
  const [copiedCaption, setCopiedCaption] = useState(false);
  const [copiedScript, setCopiedScript] = useState(false);

  if (!isOpen) return null;

  // 1. Download ZIP (for Carousels)
  const handleDownloadZip = async () => {
    try {
      setIsExporting(true);
      setExportProgress("Preparing 1080x1350 high-res rendering...");

      const zip = new JSZip();
      const folderName = `${projectTitle.replace(/[^a-zA-Z0-9_-]/g, "_")}_slides`;
      const imgFolder = zip.folder(folderName);

      // Render each slide DOM node to high-res PNG
      for (let i = 0; i < slides.length; i++) {
        const slide = slides[i];
        setExportProgress(`Rasterizing slide ${i + 1} of ${slides.length}...`);

        const elem = document.getElementById(`${slideElementPrefix}-${slide.order}`);
        if (elem) {
          const dataUrl = await toPng(elem, {
            pixelRatio: 1, // Target exact 1080x1350
            cacheBust: true,
          });
          const base64Data = dataUrl.replace(/^data:image\/png;base64,/, "");
          imgFolder?.file(`slide_${String(slide.order).padStart(2, "0")}.png`, base64Data, { base64: true });
        }
      }

      // Add captions file inside ZIP
      const captionText = `${caption}\n\n${hashtags}`;
      imgFolder?.file("caption_and_hashtags.txt", captionText);

      setExportProgress("Compressing ZIP archive...");
      const content = await zip.generateAsync({ type: "blob" });

      // Trigger browser download
      const link = document.createElement("a");
      link.href = URL.createObjectURL(content);
      link.download = `${projectTitle.replace(/[^a-zA-Z0-9_-]/g, "_")}_Instagram_Bundle.zip`;
      link.click();

      setExportProgress("Downloaded successfully!");
      setTimeout(() => setExportProgress(""), 2000);
    } catch (err) {
      console.error("ZIP Generation error:", err);
      alert("Failed to package ZIP: " + String(err));
    } finally {
      setIsExporting(false);
    }
  };

  // 2. Direct Sync to Google Drive
  const handleSyncToGDrive = async () => {
    try {
      setIsGDriveSyncing(true);

      const slidePayload: Array<{ order: number; base64Data: string }> = [];

      // If Carousel, capture slides as base64
      if (type === "CAROUSEL") {
        for (let i = 0; i < slides.length; i++) {
          const slide = slides[i];
          const elem = document.getElementById(`${slideElementPrefix}-${slide.order}`);
          if (elem) {
            const dataUrl = await toPng(elem, { pixelRatio: 1 });
            slidePayload.push({ order: slide.order, base64Data: dataUrl });
          }
        }
      }

      // Format script if Reel
      let scriptText = "";
      if (type === "REEL" && reelBeats.length > 0) {
        scriptText = reelBeats
          .map(
            (b) =>
              `[BEAT 0${b.order}: ${b.beatType}] (~${b.estimatedSeconds}s)\n` +
              `ACTION CUE: ${b.visualCue}\n` +
              `SPOKEN: "${b.spokenAudio}"\n` +
              (b.onScreenText ? `TEXT OVERLAY: [${b.onScreenText}]\n` : "")
          )
          .join("\n----------------------------------------\n\n");
      }

      const res = await fetch("/api/export/gdrive", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectName: projectTitle,
          brandName: brand.name,
          type,
          caption,
          hashtags,
          slides: slidePayload,
          scriptText,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to sync to Google Drive");

      setGdriveResult(data);
    } catch (err) {
      console.error("GDrive sync error:", err);
      alert("Google Drive Sync error: " + String(err));
    } finally {
      setIsGDriveSyncing(false);
    }
  };

  // Copy caption helper
  const copyCaption = () => {
    const fullText = `${caption}\n\n${hashtags}`;
    navigator.clipboard.writeText(fullText);
    setCopiedCaption(true);
    setTimeout(() => setCopiedCaption(false), 2000);
  };

  // Copy script helper
  const copyScript = () => {
    const fullScript = reelBeats.map((b) => b.spokenAudio).join("\n\n");
    navigator.clipboard.writeText(fullScript);
    setCopiedScript(true);
    setTimeout(() => setCopiedScript(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-neutral-900 border border-neutral-800 rounded-3xl max-w-2xl w-full p-8 text-white relative shadow-2xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-neutral-800 pb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Export & Handoff Center</h2>
              <p className="text-sm text-neutral-400">{projectTitle} • {type}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-neutral-400 hover:text-white rounded-xl hover:bg-neutral-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Primary Actions Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Card 1: 1-Click ZIP Download (For Carousel) or Script Download */}
          {type === "CAROUSEL" ? (
            <div className="p-6 rounded-2xl bg-neutral-950/60 border border-neutral-800 flex flex-col justify-between gap-4">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 text-indigo-400 font-bold">
                  <Download className="w-5 h-5" />
                  <span>High-Res ZIP Archive</span>
                </div>
                <p className="text-sm text-neutral-400">
                  Renders all {slides.length} slides at 1080×1350 PNG resolution with caption txt file.
                </p>
              </div>

              <button
                disabled={isExporting}
                onClick={handleDownloadZip}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold transition-all disabled:opacity-50"
              >
                {isExporting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span className="text-xs truncate">{exportProgress || "Rendering..."}</span>
                  </>
                ) : (
                  <>
                    <Download className="w-5 h-5" />
                    <span>Download ZIP ({slides.length} PNGs)</span>
                  </>
                )}
              </button>
            </div>
          ) : (
            <div className="p-6 rounded-2xl bg-neutral-950/60 border border-neutral-800 flex flex-col justify-between gap-4">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 text-indigo-400 font-bold">
                  <Copy className="w-5 h-5" />
                  <span>Copy Spoken Script</span>
                </div>
                <p className="text-sm text-neutral-400">
                  Copies all {reelBeats.length} spoken beats formatted for quick reading or voiceover recording.
                </p>
              </div>

              <button
                onClick={copyScript}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold transition-all"
              >
                {copiedScript ? <Check className="w-5 h-5 text-emerald-300" /> : <Copy className="w-5 h-5" />}
                <span>{copiedScript ? "Copied Script!" : "Copy Spoken Dialogue"}</span>
              </button>
            </div>
          )}

          {/* Card 2: Local Google Drive Sync */}
          <div className="p-6 rounded-2xl bg-neutral-950/60 border border-neutral-800 flex flex-col justify-between gap-4">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 text-emerald-400 font-bold">
                <Cloud className="w-5 h-5" />
                <span>Google Drive Auto-Sync</span>
              </div>
              <p className="text-sm text-neutral-400">
                Instantly writes master assets directly to your mounted Mac Google Drive folder.
              </p>
            </div>

            <button
              disabled={isGDriveSyncing}
              onClick={handleSyncToGDrive}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition-all disabled:opacity-50"
            >
              {isGDriveSyncing ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Writing to Drive...</span>
                </>
              ) : (
                <>
                  <Cloud className="w-5 h-5" />
                  <span>Sync to Google Drive</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Google Drive Result Banner if synced */}
        {gdriveResult && (
          <div className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-500/30 flex items-start gap-3 text-sm text-emerald-300">
            <FolderCheck className="w-5 h-5 shrink-0 mt-0.5" />
            <div>
              <div className="font-bold">Successfully synced {gdriveResult.writtenFiles.length} files to Google Drive!</div>
              <div className="text-xs text-neutral-400 font-mono break-all mt-1">{gdriveResult.folderPath}</div>
            </div>
          </div>
        )}

        {/* Card 3: Ready-to-Post Instagram Caption Box */}
        <div className="p-6 rounded-2xl bg-neutral-950/80 border border-neutral-800 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold text-neutral-300 uppercase tracking-wider">
              Instagram Caption & Hashtags
            </span>
            <button
              onClick={copyCaption}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-xs font-bold text-white transition-colors"
            >
              {copiedCaption ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              <span>{copiedCaption ? "Copied!" : "Copy Caption"}</span>
            </button>
          </div>

          <div className="p-4 rounded-xl bg-black/50 border border-neutral-800/80 text-sm text-neutral-300 whitespace-pre-wrap max-h-40 overflow-y-auto font-sans leading-relaxed">
            {caption || "No caption generated yet."}
            {"\n\n"}
            <span className="text-indigo-400">{hashtags}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
