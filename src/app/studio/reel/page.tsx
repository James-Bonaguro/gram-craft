"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
  Video,
  Sparkles,
  Download,
  Plus,
  Trash2,
  Save,
  Check,
  Play,
  Loader2,
  Timer,
  AlertCircle,
  FileText,
} from "lucide-react";
import { ReelBeatData, ReelHookData, BrandKitData, ProjectData } from "@/types";
import { TeleprompterModal } from "@/components/reel/TeleprompterModal";
import { ExportModal } from "@/components/export/ExportModal";
import { HOOK_FORMULAS } from "@/lib/hook-formulas";

function ReelStudioContent() {
  const searchParams = useSearchParams();
  const initialFormula = searchParams.get("formula");
  const initialProjectId = searchParams.get("id");

  // Project ID State (retained across saves)
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(initialProjectId || null);

  // State
  const [brands, setBrands] = useState<BrandKitData[]>([]);
  const [selectedBrand, setSelectedBrand] = useState<BrandKitData | null>(null);

  // Input Hub State
  const [inputMode, setInputMode] = useState<"PROMPT" | "REPURPOSE" | "HOOK_FORMULA">(
    initialFormula ? "HOOK_FORMULA" : "PROMPT"
  );
  const [inputText, setInputText] = useState(initialFormula || "");
  const [useDemoMode, setUseDemoMode] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationError, setGenerationError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Reel Project State
  const [projectTitle, setProjectTitle] = useState("Instagram Reel Storyboard");
  const [caption, setCaption] = useState("");
  const [hashtags, setHashtags] = useState("");
  const [hooks, setHooks] = useState<ReelHookData[]>([]);
  const [selectedHookIndex, setSelectedHookIndex] = useState(0);
  const [beats, setBeats] = useState<ReelBeatData[]>([]);

  // Modals
  const [isTeleprompterOpen, setIsTeleprompterOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);

  useEffect(() => {
    fetch("/api/brands")
      .then((res) => res.json())
      .then((brandList) => {
        if (Array.isArray(brandList) && brandList.length > 0) {
          setBrands(brandList);

          if (currentProjectId) {
            fetch(`/api/projects/${currentProjectId}`)
              .then((res) => res.json())
              .then((proj: ProjectData) => {
                if (proj && proj.id) {
                  setProjectTitle(proj.title || "Instagram Reel Storyboard");
                  setCaption(proj.caption || "");
                  setHashtags(proj.hashtags || "");
                  if (proj.rawInput) setInputText(proj.rawInput);
                  if (proj.inputType) setInputMode(proj.inputType);

                  if (proj.brandKitId) {
                    const matched = brandList.find((b: BrandKitData) => b.id === proj.brandKitId);
                    if (matched) setSelectedBrand(matched);
                  } else {
                    const def = brandList.find((b: BrandKitData) => b.isDefault) || brandList[0];
                    setSelectedBrand(def);
                  }

                  if (proj.reelBeats && proj.reelBeats.length > 0) {
                    setBeats(proj.reelBeats);
                  }
                }
              })
              .catch((err) => console.error("Error loading reel project:", err));
          } else {
            const def = brandList.find((b: BrandKitData) => b.isDefault) || brandList[0];
            setSelectedBrand(def);
          }
        }
      });
  }, [currentProjectId]);

  // AI Reel Generation
  const handleGenerate = async () => {
    if (!inputText.trim()) {
      alert("Please enter a topic, notes, or select a hook formula.");
      return;
    }

    try {
      setIsGenerating(true);
      setGenerationError("");

      const res = await fetch("/api/ai/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "REEL",
          input: inputText,
          inputMode,
          brandKitId: selectedBrand?.id,
          isDemo: useDemoMode,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Generation failed");
      }

      setProjectTitle(data.title || "Instagram Reel Storyboard");
      setCaption(data.caption || "");
      setHashtags(data.hashtags || "");
      if (Array.isArray(data.hooks)) setHooks(data.hooks);
      if (Array.isArray(data.beats)) setBeats(data.beats);
    } catch (err: unknown) {
      console.error(err);
      const message = err instanceof Error ? err.message : "Failed to generate reel script.";
      setGenerationError(message);
    } finally {
      setIsGenerating(false);
    }
  };

  // Save Project (Atomic & ID retaining)
  const handleSaveProject = async () => {
    try {
      setIsSaving(true);
      const payload = {
        title: projectTitle,
        type: "REEL",
        brandKitId: selectedBrand?.id || null,
        caption,
        hashtags,
        rawInput: inputText,
        inputType: inputMode,
        reelBeats: beats,
      };

      const url = currentProjectId ? `/api/projects/${currentProjectId}` : "/api/projects";
      const method = currentProjectId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save project");

      if (!currentProjectId && data.id) {
        setCurrentProjectId(data.id);
        window.history.replaceState(null, "", `/studio/reel?id=${data.id}`);
      }

      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 2500);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      alert("Save error: " + message);
    } finally {
      setIsSaving(false);
    }
  };

  // Beat helpers
  const updateBeat = (index: number, field: keyof ReelBeatData, val: string | number | undefined) => {
    const updated = [...beats];
    updated[index] = { ...updated[index], [field]: val };
    setBeats(updated);
  };

  const addBeat = () => {
    const newBeat: ReelBeatData = {
      order: beats.length + 1,
      beatType: "BODY",
      visualCue: "Talking head, point to screen / graphics overlay",
      spokenAudio: "Here is the key takeaway to keep in mind.",
      onScreenText: "KEY TAKEAWAY 💡",
      estimatedSeconds: 5,
    };
    setBeats([...beats, newBeat]);
  };

  const deleteBeat = (index: number) => {
    if (beats.length <= 1) return alert("A reel must have at least one beat.");
    const filtered = beats.filter((_, idx) => idx !== index);
    const reordered = filtered.map((b, idx) => ({ ...b, order: idx + 1 }));
    setBeats(reordered);
  };

  const selectHook = (hookText: string, index: number) => {
    setSelectedHookIndex(index);
    if (beats.length > 0) {
      const updated = [...beats];
      updated[0] = { ...updated[0], spokenAudio: hookText };
      setBeats(updated);
    }
  };

  const totalSeconds = beats.reduce((acc, b) => acc + (b.estimatedSeconds || 0), 0);

  return (
    <div className="flex-1 flex flex-col w-full bg-neutral-950 text-white">
      {/* Studio Header */}
      <div className="h-16 border-b border-neutral-800 bg-neutral-950/90 px-6 flex items-center justify-between z-20">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Video className="w-5 h-5 text-pink-500" />
            <input
              type="text"
              value={projectTitle}
              onChange={(e) => setProjectTitle(e.target.value)}
              className="bg-transparent text-lg font-bold text-white focus:outline-none border-b border-transparent focus:border-pink-500 max-w-sm truncate"
            />
          </div>

          {/* Brand Switcher */}
          {brands.length > 0 && selectedBrand && (
            <select
              value={selectedBrand.id}
              onChange={(e) => {
                const b = brands.find((brand) => brand.id === e.target.value);
                if (b) setSelectedBrand(b);
              }}
              className="bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-1.5 text-xs font-semibold text-neutral-300 focus:outline-none"
            >
              {brands.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name} ({b.handle})
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Right Top Actions */}
        <div className="flex items-center gap-3">
          <button
            disabled={beats.length === 0}
            onClick={() => setIsTeleprompterOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold transition-all shadow-lg shadow-amber-500/20 disabled:opacity-50"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>Launch Teleprompter</span>
          </button>

          <button
            onClick={handleSaveProject}
            disabled={isSaving}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-xs font-bold text-neutral-200 transition-colors"
          >
            {savedSuccess ? (
              <>
                <Check className="w-4 h-4 text-emerald-400" />
                <span className="text-emerald-400">Saved!</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4 text-neutral-400" />
                <span>{isSaving ? "Saving..." : "Save Project"}</span>
              </>
            )}
          </button>

          <button
            onClick={() => setIsExportOpen(true)}
            disabled={beats.length === 0}
            className="flex items-center gap-2 px-5 py-2 rounded-xl bg-pink-600 hover:bg-pink-500 text-white text-xs font-bold shadow-lg shadow-pink-600/20 transition-all disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            <span>Export & Handoff</span>
          </button>
        </div>
      </div>

      {/* Main Studio Body: 2 Columns */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden">
        {/* LEFT COLUMN: Input Hub & Hook Matrix (4 cols) */}
        <div className="lg:col-span-4 border-r border-neutral-800 flex flex-col h-[calc(100vh-8rem)] overflow-y-auto p-6 space-y-6">
          {/* Multi-Modal Input Hub */}
          <div className="p-5 rounded-2xl bg-neutral-900/60 border border-neutral-800 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-pink-400 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" /> Reel Ideation Hub
              </span>

              {/* Mode Tabs */}
              <div className="flex items-center gap-1 bg-neutral-950 p-1 rounded-xl border border-neutral-800 text-xs font-semibold">
                <button
                  onClick={() => setInputMode("PROMPT")}
                  className={`px-2.5 py-1 rounded-lg transition-colors ${
                    inputMode === "PROMPT" ? "bg-neutral-800 text-white" : "text-neutral-500 hover:text-white"
                  }`}
                >
                  Prompt
                </button>
                <button
                  onClick={() => setInputMode("REPURPOSE")}
                  className={`px-2.5 py-1 rounded-lg transition-colors ${
                    inputMode === "REPURPOSE" ? "bg-neutral-800 text-white" : "text-neutral-500 hover:text-white"
                  }`}
                >
                  Repurpose
                </button>
                <button
                  onClick={() => setInputMode("HOOK_FORMULA")}
                  className={`px-2.5 py-1 rounded-lg transition-colors ${
                    inputMode === "HOOK_FORMULA" ? "bg-neutral-800 text-white" : "text-neutral-500 hover:text-white"
                  }`}
                >
                  Formulas
                </button>
              </div>
            </div>

            {inputMode === "HOOK_FORMULA" && (
              <div className="space-y-2">
                <select
                  onChange={(e) => setInputText(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-neutral-300 focus:outline-none"
                >
                  <option value="">Select a proven framework formula...</option>
                  {HOOK_FORMULAS.map((h) => (
                    <option key={h.id} value={h.template}>
                      [{h.category}] {h.title}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <textarea
              rows={inputMode === "REPURPOSE" ? 5 : 3}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={
                inputMode === "REPURPOSE"
                  ? "Paste long-form notes, newsletter or article text to transform into a high-retention reel script..."
                  : "Enter a reel concept or hook (e.g. 3 tools that save 10 hours a week)..."
              }
              className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-3.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-pink-500 leading-relaxed font-sans"
            />

            {/* Error Message if Generation Fails */}
            {generationError && (
              <div className="p-3 rounded-xl bg-red-950/40 border border-red-500/30 text-xs text-red-300 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-400" />
                <div className="space-y-1">
                  <div className="font-semibold">{generationError}</div>
                  <div className="text-[11px] text-neutral-400">
                    Configure your key in <a href="/settings" className="underline text-indigo-400">Settings</a> or enable <strong>Use Demo Template</strong> below.
                  </div>
                </div>
              </div>
            )}

            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-1.5 cursor-pointer text-xs text-neutral-400 hover:text-white">
                <input
                  type="checkbox"
                  checked={useDemoMode}
                  onChange={(e) => setUseDemoMode(e.target.checked)}
                  className="rounded text-pink-600 focus:ring-0"
                />
                <span>Use Demo Template</span>
              </label>

              <button
                disabled={isGenerating}
                onClick={handleGenerate}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-pink-600 to-purple-600 hover:opacity-90 text-white font-bold text-xs shadow-md transition-all disabled:opacity-50"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Scripting Reel...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>{useDemoMode ? "Populate Demo" : "Generate Reel"}</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Hook Variant Selector (Transparent Angle Descriptions) */}
          {hooks.length > 0 && (
            <div className="p-5 rounded-2xl bg-neutral-900/60 border border-neutral-800 space-y-3">
              <span className="text-xs font-bold text-neutral-400 uppercase tracking-wider">
                Hook Angles
              </span>
              <div className="space-y-2">
                {hooks.map((h, i) => (
                  <button
                    key={i}
                    onClick={() => selectHook(h.text, i)}
                    className={`w-full p-3.5 rounded-xl border text-left transition-all flex flex-col gap-2 ${
                      selectedHookIndex === i
                        ? "bg-pink-600/20 border-pink-500 text-white shadow-sm"
                        : "bg-neutral-950/60 border-neutral-800 text-neutral-400 hover:text-white"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black uppercase text-pink-400">
                        Option 0{i + 1}
                      </span>
                      <span className="text-xs font-mono font-bold text-indigo-300 bg-indigo-950/50 px-2 py-0.5 rounded-full border border-indigo-500/30">
                        {h.angle || `Angle 0${i + 1}`}
                      </span>
                    </div>
                    <p className="text-xs font-medium text-white/90 leading-snug">
                      &ldquo;{h.text}&rdquo;
                    </p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* In-Studio Caption & Hashtag Editor */}
          <div className="p-5 rounded-2xl bg-neutral-900/60 border border-neutral-800 space-y-3">
            <span className="text-xs font-bold text-neutral-300 uppercase tracking-wider flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-pink-400" />
              <span>Post Caption & Hashtags</span>
            </span>
            <textarea
              rows={4}
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Instagram reel caption with paragraph breaks..."
              className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-3 text-xs text-white leading-relaxed focus:outline-none"
            />
            <input
              type="text"
              value={hashtags}
              onChange={(e) => setHashtags(e.target.value)}
              placeholder="#reels #contentcreation #video..."
              className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-2.5 text-xs text-pink-300 font-mono focus:outline-none"
            />
          </div>

          {/* Timing & Pacing Barometer */}
          <div className="p-4 rounded-2xl bg-neutral-900/40 border border-neutral-800 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 text-neutral-400">
              <Timer className="w-4 h-4 text-amber-400" />
              <span>Estimated Duration:</span>
            </div>
            <div className="font-mono font-bold text-white text-sm">
              ~{totalSeconds}s{" "}
              <span className="text-xs text-neutral-500">
                ({beats.length} beats)
              </span>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Shot-by-Shot Storyboard Matrix (8 cols) */}
        <div className="lg:col-span-8 flex flex-col h-[calc(100vh-8rem)] overflow-y-auto p-8 space-y-6">
          <div className="flex items-center justify-between border-b border-neutral-800 pb-4">
            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <span>Shot-by-Shot Storyboard</span>
                <span className="text-xs font-mono text-neutral-400">
                  (~{totalSeconds}s Total)
                </span>
              </h2>
              <p className="text-xs text-neutral-400 mt-0.5">
                Each beat coordinates what the camera sees, what you speak, and text overlays.
              </p>
            </div>

            <button
              onClick={addBeat}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-xs font-bold text-white transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Add Beat</span>
            </button>
          </div>

          {beats.length === 0 ? (
            <div className="text-center py-20 text-neutral-500 space-y-3">
              <Video className="w-12 h-12 mx-auto text-neutral-600" />
              <h3 className="text-base font-bold text-neutral-300">No script generated yet</h3>
              <p className="text-xs">
                Enter a topic on the left or click <strong>Use Demo Template</strong> to preview a complete reel storyboard.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {beats.map((beat, idx) => (
                <div
                  key={beat.order}
                  className="p-6 rounded-3xl bg-neutral-900/60 border border-neutral-800 space-y-4 hover:border-neutral-700 transition-colors"
                >
                  {/* Beat Header Bar */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="w-7 h-7 rounded-lg bg-pink-600/20 text-pink-400 border border-pink-500/30 flex items-center justify-center font-bold text-xs">
                        0{beat.order}
                      </span>
                      <select
                        value={beat.beatType}
                        onChange={(e) => updateBeat(idx, "beatType", e.target.value)}
                        className="bg-neutral-950 border border-neutral-800 rounded-lg px-2.5 py-1 text-xs font-bold uppercase text-white"
                      >
                        <option value="HOOK">HOOK (0-3s)</option>
                        <option value="BODY">BODY</option>
                        <option value="TRANSITION">TRANSITION</option>
                        <option value="CTA">CALL TO ACTION</option>
                      </select>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1 text-xs text-neutral-400">
                        <span>Pacing:</span>
                        <input
                          type="number"
                          min="1"
                          max="25"
                          value={beat.estimatedSeconds}
                          onChange={(e) => updateBeat(idx, "estimatedSeconds", Number(e.target.value))}
                          className="w-12 bg-neutral-950 border border-neutral-800 rounded-lg px-2 py-0.5 text-xs text-white font-mono text-center"
                        />
                        <span>s</span>
                      </div>

                      <button
                        onClick={() => deleteBeat(idx)}
                        className="p-1.5 text-neutral-500 hover:text-red-400 rounded-lg"
                        title="Delete beat"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* 3-Part Beat Matrix */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                    {/* 1. Visual Action Cue */}
                    <div className="space-y-1">
                      <label className="font-bold text-indigo-400 uppercase text-[10px] flex items-center gap-1">
                        <span>Visual / Camera Cue</span>
                      </label>
                      <textarea
                        rows={3}
                        value={beat.visualCue}
                        onChange={(e) => updateBeat(idx, "visualCue", e.target.value)}
                        placeholder="What camera sees, B-roll, gesture..."
                        className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-3 text-xs text-white leading-relaxed focus:outline-none focus:border-indigo-500"
                      />
                    </div>

                    {/* 2. Spoken Dialogue */}
                    <div className="space-y-1 md:col-span-2">
                      <div className="flex items-center justify-between">
                        <label className="font-bold text-emerald-400 uppercase text-[10px]">
                          Spoken Dialogue / Teleprompter Script
                        </label>
                        {beat.onScreenText && (
                          <span className="text-[10px] text-neutral-400 font-mono">
                            Overlay: <strong className="text-white">{beat.onScreenText}</strong>
                          </span>
                        )}
                      </div>
                      <textarea
                        rows={3}
                        value={beat.spokenAudio}
                        onChange={(e) => updateBeat(idx, "spokenAudio", e.target.value)}
                        placeholder="Exact words spoken into camera or voiceover..."
                        className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-3 text-xs text-white font-medium leading-relaxed focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>

                  {/* Text Overlay Pill */}
                  <div className="flex items-center gap-2 pt-1 border-t border-neutral-800/60">
                    <span className="text-[10px] font-bold text-neutral-500 uppercase">Text Overlay:</span>
                    <input
                      type="text"
                      value={beat.onScreenText || ""}
                      onChange={(e) => updateBeat(idx, "onScreenText", e.target.value)}
                      placeholder="e.g. STOP DOING THIS 🛑"
                      className="bg-neutral-950 border border-neutral-800 rounded-lg px-2.5 py-1 text-xs text-indigo-300 font-semibold focus:outline-none w-64"
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Fullscreen Teleprompter Modal */}
      <TeleprompterModal
        isOpen={isTeleprompterOpen}
        onClose={() => setIsTeleprompterOpen(false)}
        title={projectTitle}
        beats={beats}
      />

      {/* Export & Local Folder Sync Modal */}
      {selectedBrand && (
        <ExportModal
          isOpen={isExportOpen}
          onClose={() => setIsExportOpen(false)}
          type="REEL"
          projectTitle={projectTitle}
          brand={selectedBrand}
          caption={caption}
          hashtags={hashtags}
          reelBeats={beats}
        />
      )}
    </div>
  );
}

export default function ReelStudio() {
  return (
    <Suspense fallback={<div className="p-8 text-neutral-500">Loading Reel Studio...</div>}>
      <ReelStudioContent />
    </Suspense>
  );
}
