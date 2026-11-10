"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
  Layers,
  Sparkles,
  Download,
  ChevronLeft,
  ChevronRight,
  Plus,
  Trash2,
  Save,
  Check,
  Loader2,
} from "lucide-react";
import { CarouselSlideData, BrandKitData, TemplateStyle, ProjectData } from "@/types";
import { SlideRenderer } from "@/components/carousel/SlideRenderer";
import { ExportModal } from "@/components/export/ExportModal";
import { HOOK_FORMULAS } from "@/lib/hook-formulas";

function CarouselStudioContent() {
  const searchParams = useSearchParams();
  const initialFormula = searchParams.get("formula");
  const projectId = searchParams.get("id");

  // State
  const [brands, setBrands] = useState<BrandKitData[]>([]);
  const [selectedBrand, setSelectedBrand] = useState<BrandKitData | null>(null);
  const [templateStyle, setTemplateStyle] = useState<TemplateStyle>("minimal");
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);

  // Input Hub State
  const [inputMode, setInputMode] = useState<"PROMPT" | "REPURPOSE" | "HOOK_FORMULA">(
    initialFormula ? "HOOK_FORMULA" : "PROMPT"
  );
  const [inputText, setInputText] = useState(initialFormula || "");
  const [slideCount, setSlideCount] = useState(6);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);

  // Active Project Data
  const [projectTitle, setProjectTitle] = useState("Instagram Carousel");
  const [caption, setCaption] = useState("");
  const [hashtags, setHashtags] = useState("");
  const [slides, setSlides] = useState<CarouselSlideData[]>([]);

  // Load brands and existing project if id is present
  useEffect(() => {
    fetch("/api/brands")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setBrands(data);
          const def = data.find((b) => b.isDefault) || data[0];
          setSelectedBrand(def);
        }
      });

    if (projectId) {
      fetch(`/api/projects/${projectId}`)
        .then((res) => res.json())
        .then((proj: ProjectData) => {
          if (proj && proj.id) {
            setProjectTitle(proj.title);
            setTemplateStyle(proj.templateStyle || "minimal");
            setCaption(proj.caption || "");
            setHashtags(proj.hashtags || "");
            if (proj.slides && proj.slides.length > 0) {
              setSlides(proj.slides);
            }
          }
        });
    }
  }, [projectId]);

  // AI Generation Trigger
  const handleGenerate = async () => {
    if (!inputText.trim()) {
      alert("Please enter a topic, notes, or select a hook formula.");
      return;
    }

    try {
      setIsGenerating(true);
      const res = await fetch("/api/ai/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "CAROUSEL",
          input: inputText,
          inputMode,
          brandKitId: selectedBrand?.id,
          slideCount,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Generation failed");

      setProjectTitle(data.title || "Instagram Carousel");
      setCaption(data.caption || "");
      setHashtags(data.hashtags || "");
      if (Array.isArray(data.slides)) {
        setSlides(data.slides);
        setCurrentSlideIndex(0);
      }
    } catch (err) {
      console.error(err);
      alert("Error generating carousel: " + String(err));
    } finally {
      setIsGenerating(false);
    }
  };

  // Save Project to Database
  const handleSaveProject = async () => {
    try {
      setIsSaving(true);
      const payload = {
        title: projectTitle,
        type: "CAROUSEL",
        brandKitId: selectedBrand?.id || null,
        caption,
        hashtags,
        rawInput: inputText,
        inputType: inputMode,
        templateStyle,
        slides,
      };

      const url = projectId ? `/api/projects/${projectId}` : "/api/projects";
      const method = projectId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Failed to save project");

      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 2500);
    } catch (err) {
      alert("Save error: " + String(err));
    } finally {
      setIsSaving(false);
    }
  };

  // Current slide helpers
  const currentSlide = slides[currentSlideIndex];

  const updateCurrentSlide = (field: keyof CarouselSlideData, val: string | number | string[] | undefined) => {
    if (!currentSlide) return;
    const updated = [...slides];
    updated[currentSlideIndex] = {
      ...updated[currentSlideIndex],
      [field]: val,
    };
    setSlides(updated);
  };

  const addSlide = () => {
    const newSlide: CarouselSlideData = {
      order: slides.length + 1,
      slideType: "CONTENT",
      headline: "New Key Takeaway",
      subheadline: "Supportive detail for this slide",
      bodyText: "Explain your point clearly and concisely with zero fluff.",
      bulletPoints: ["First important point", "Second actionable takeaway"],
    };
    setSlides([...slides, newSlide]);
    setCurrentSlideIndex(slides.length);
  };

  const deleteCurrentSlide = () => {
    if (slides.length <= 1) return alert("A carousel must have at least one slide.");
    const filtered = slides.filter((_, idx) => idx !== currentSlideIndex);
    const reordered = filtered.map((s, idx) => ({ ...s, order: idx + 1 }));
    setSlides(reordered);
    setCurrentSlideIndex(Math.max(0, currentSlideIndex - 1));
  };

  const moveSlide = (direction: "left" | "right") => {
    const targetIdx = direction === "left" ? currentSlideIndex - 1 : currentSlideIndex + 1;
    if (targetIdx < 0 || targetIdx >= slides.length) return;

    const updated = [...slides];
    const temp = updated[currentSlideIndex];
    updated[currentSlideIndex] = updated[targetIdx];
    updated[targetIdx] = temp;

    // Recalculate orders
    const reordered = updated.map((s, idx) => ({ ...s, order: idx + 1 }));
    setSlides(reordered);
    setCurrentSlideIndex(targetIdx);
  };

  return (
    <div className="flex-1 flex flex-col w-full bg-neutral-950 text-white">
      {/* Studio Header */}
      <div className="h-16 border-b border-neutral-800 bg-neutral-950/90 px-6 flex items-center justify-between z-20">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-indigo-400" />
            <input
              type="text"
              value={projectTitle}
              onChange={(e) => setProjectTitle(e.target.value)}
              className="bg-transparent text-lg font-bold text-white focus:outline-none border-b border-transparent focus:border-indigo-500 max-w-sm truncate"
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
            disabled={slides.length === 0}
            className="flex items-center gap-2 px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/20 transition-all disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            <span>Export & Handoff</span>
          </button>
        </div>
      </div>

      {/* Main Studio Body: 2 Columns */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden">
        {/* LEFT COLUMN: Input Hub & Slide Editor (5 cols) */}
        <div className="lg:col-span-5 border-r border-neutral-800 flex flex-col h-[calc(100vh-8rem)] overflow-y-auto p-6 space-y-6">
          {/* Section 1: Multi-Modal Input Hub */}
          <div className="p-5 rounded-2xl bg-neutral-900/60 border border-neutral-800 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" /> Multi-Modal Input Hub
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

            {/* Input Form based on mode */}
            {inputMode === "HOOK_FORMULA" && (
              <div className="space-y-2">
                <select
                  onChange={(e) => setInputText(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-neutral-300 focus:outline-none"
                >
                  <option value="">Select a proven viral formula...</option>
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
                  ? "Paste long-form notes, newsletter markdown, or an article here to repurpose into a carousel..."
                  : "Enter a topic (e.g. 5 counterintuitive lessons on scaling an agency without burnout)..."
              }
              className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-3.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-indigo-500 leading-relaxed font-sans"
            />

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs text-neutral-400 font-semibold">Slides:</span>
                <select
                  value={slideCount}
                  onChange={(e) => setSlideCount(Number(e.target.value))}
                  className="bg-neutral-950 border border-neutral-800 rounded-lg px-2 py-1 text-xs text-white"
                >
                  <option value={5}>5 slides</option>
                  <option value={6}>6 slides</option>
                  <option value={7}>7 slides</option>
                  <option value={8}>8 slides</option>
                  <option value={10}>10 slides</option>
                </select>
              </div>

              <button
                disabled={isGenerating}
                onClick={handleGenerate}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:opacity-90 text-white font-bold text-xs shadow-md transition-all disabled:opacity-50"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Writing Copy...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Generate Carousel</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Section 2: Template Style Switcher */}
          <div className="space-y-2">
            <span className="text-xs font-bold text-neutral-400 uppercase tracking-wider">
              Template Style
            </span>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: "minimal", name: "Minimal Editorial", desc: "Clean & refined" },
                { id: "tweet", name: "Social Card", desc: "Tweet-bubble style" },
                { id: "bold", name: "Bold Dark", desc: "High contrast gradient" },
                { id: "infographic", name: "Infographic", desc: "Structured comparison" },
              ].map((style) => (
                <button
                  key={style.id}
                  onClick={() => setTemplateStyle(style.id as TemplateStyle)}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    templateStyle === style.id
                      ? "bg-indigo-600/20 border-indigo-500 text-white shadow-sm"
                      : "bg-neutral-900/50 border-neutral-800 text-neutral-400 hover:text-white"
                  }`}
                >
                  <div className="text-xs font-bold text-white">{style.name}</div>
                  <div className="text-[10px] text-neutral-500">{style.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Section 3: Slide Content Editor */}
          {currentSlide && (
            <div className="p-5 rounded-2xl bg-neutral-900/60 border border-neutral-800 space-y-4">
              <div className="flex items-center justify-between border-b border-neutral-800/80 pb-3">
                <span className="text-xs font-black uppercase tracking-wider text-amber-400">
                  Editing Slide {currentSlide.order} of {slides.length}
                </span>

                <div className="flex items-center gap-1">
                  <button
                    disabled={currentSlideIndex === 0}
                    onClick={() => moveSlide("left")}
                    className="p-1 text-neutral-400 hover:text-white disabled:opacity-30"
                    title="Move slide left"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    disabled={currentSlideIndex === slides.length - 1}
                    onClick={() => moveSlide("right")}
                    className="p-1 text-neutral-400 hover:text-white disabled:opacity-30"
                    title="Move slide right"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                  <button
                    onClick={deleteCurrentSlide}
                    className="p-1 text-neutral-500 hover:text-red-400 ml-2"
                    title="Delete slide"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="space-y-3 text-xs">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="font-bold text-neutral-400 uppercase text-[10px]">Type</label>
                    <select
                      value={currentSlide.slideType}
                      onChange={(e) => updateCurrentSlide("slideType", e.target.value)}
                      className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-2 text-xs text-white"
                    >
                      <option value="COVER">COVER (Slide 1 Hook)</option>
                      <option value="CONTENT">CONTENT</option>
                      <option value="COMPARISON">COMPARISON (Myth vs Reality)</option>
                      <option value="QUOTE">QUOTE / INSIGHT</option>
                      <option value="CTA">CTA (Call to Action)</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-neutral-400 uppercase text-[10px]">Badge Tag</label>
                    <input
                      type="text"
                      value={currentSlide.badgeText || ""}
                      onChange={(e) => updateCurrentSlide("badgeText", e.target.value)}
                      placeholder="e.g. Step 1, Rule #2"
                      className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-2 text-xs text-white"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-neutral-400 uppercase text-[10px]">Headline</label>
                  <textarea
                    rows={2}
                    value={currentSlide.headline}
                    onChange={(e) => updateCurrentSlide("headline", e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-2 text-xs text-white leading-relaxed"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-neutral-400 uppercase text-[10px]">Subheadline / Detail</label>
                  <input
                    type="text"
                    value={currentSlide.subheadline || ""}
                    onChange={(e) => updateCurrentSlide("subheadline", e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-2 text-xs text-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-neutral-400 uppercase text-[10px]">Body Text</label>
                  <textarea
                    rows={3}
                    value={currentSlide.bodyText || ""}
                    onChange={(e) => updateCurrentSlide("bodyText", e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-2 text-xs text-white leading-relaxed"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: Live 4:5 Aspect Ratio Preview Canvas (7 cols) */}
        <div className="lg:col-span-7 flex flex-col h-[calc(100vh-8rem)] bg-neutral-900/30 overflow-hidden">
          {/* Preview Canvas Stage */}
          <div className="flex-1 flex items-center justify-center p-8 overflow-hidden relative">
            {slides.length > 0 && selectedBrand ? (
              <div className="relative shadow-2xl rounded-2xl overflow-hidden border border-neutral-800/80">
                {/* Visual scale container: Native size 1080x1350 scaled to fit screen (e.g. 0.42x = ~450x567) */}
                <div style={{ width: "453px", height: "567px", position: "relative", overflow: "hidden" }}>
                  <SlideRenderer
                    slide={slides[currentSlideIndex]}
                    brand={selectedBrand}
                    templateStyle={templateStyle}
                    totalSlides={slides.length}
                    scale={0.42}
                    idPrefix="active-preview"
                  />
                </div>
              </div>
            ) : (
              <div className="text-center space-y-3 text-neutral-500 max-w-sm">
                <Layers className="w-12 h-12 mx-auto text-neutral-600" />
                <h3 className="text-base font-bold text-neutral-300">No slides loaded yet</h3>
                <p className="text-xs">
                  Type a topic or paste long notes on the left, then click <strong>Generate Carousel</strong>.
                </p>
              </div>
            )}
          </div>

          {/* Bottom Slide Thumbnails Strip & Controls */}
          {slides.length > 0 && (
            <div className="h-24 border-t border-neutral-800 bg-neutral-950/90 px-6 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 overflow-x-auto py-2">
                {slides.map((s, idx) => (
                  <button
                    key={s.order}
                    onClick={() => setCurrentSlideIndex(idx)}
                    className={`h-16 w-12 rounded-lg border flex flex-col items-center justify-center font-bold text-xs shrink-0 transition-all ${
                      currentSlideIndex === idx
                        ? "border-indigo-500 bg-indigo-600/30 text-white scale-105 shadow-md shadow-indigo-500/20"
                        : "border-neutral-800 bg-neutral-900 text-neutral-400 hover:border-neutral-700"
                    }`}
                  >
                    <span>{s.order}</span>
                    <span className="text-[9px] uppercase text-neutral-500 font-mono">
                      {s.slideType.slice(0, 3)}
                    </span>
                  </button>
                ))}

                <button
                  onClick={addSlide}
                  className="h-16 w-12 rounded-lg border border-dashed border-neutral-700 hover:border-indigo-500 text-neutral-500 hover:text-white flex items-center justify-center shrink-0 transition-colors"
                  title="Add new slide"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  disabled={currentSlideIndex === 0}
                  onClick={() => setCurrentSlideIndex((i) => i - 1)}
                  className="p-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-neutral-300 disabled:opacity-40"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <span className="text-xs font-bold text-neutral-400 px-2 font-mono">
                  {currentSlideIndex + 1} / {slides.length}
                </span>
                <button
                  disabled={currentSlideIndex === slides.length - 1}
                  onClick={() => setCurrentSlideIndex((i) => i + 1)}
                  className="p-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-neutral-300 disabled:opacity-40"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Hidden Full-Resolution Container for Export (1080x1350) */}
      <div style={{ position: "absolute", left: "-9999px", top: "-9999px" }}>
        {slides.map((s) => selectedBrand && (
          <SlideRenderer
            key={s.order}
            slide={s}
            brand={selectedBrand}
            templateStyle={templateStyle}
            totalSlides={slides.length}
            scale={1}
            idPrefix="export-slide"
          />
        ))}
      </div>

      {/* Export Modal */}
      {selectedBrand && (
        <ExportModal
          isOpen={isExportOpen}
          onClose={() => setIsExportOpen(false)}
          type="CAROUSEL"
          projectTitle={projectTitle}
          brand={selectedBrand}
          caption={caption}
          hashtags={hashtags}
          slides={slides}
          slideElementPrefix="export-slide"
        />
      )}
    </div>
  );
}

export default function CarouselStudio() {
  return (
    <Suspense fallback={<div className="p-8 text-neutral-500">Loading Carousel Studio...</div>}>
      <CarouselStudioContent />
    </Suspense>
  );
}
