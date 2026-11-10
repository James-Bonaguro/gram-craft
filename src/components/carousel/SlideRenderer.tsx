"use client";

import React from "react";
import { CarouselSlideData, BrandKitData, TemplateStyle } from "@/types";
import { CheckCircle2, ChevronRight, Sparkles, ArrowRight, XCircle } from "lucide-react";

interface SlideRendererProps {
  slide: CarouselSlideData;
  brand: BrandKitData;
  templateStyle: TemplateStyle;
  totalSlides: number;
  scale?: number; // Scaling factor for preview vs full resolution (1080x1350)
  idPrefix?: string;
}

export function SlideRenderer({
  slide,
  brand,
  templateStyle,
  totalSlides,
  scale = 1,
  idPrefix = "slide",
}: SlideRendererProps) {
  // Base dimensions: 1080 x 1350 (4:5 aspect ratio)
  const baseWidth = 1080;
  const baseHeight = 1350;

  // Render bullet points safely
  const bullets: string[] = Array.isArray(slide.bulletPoints)
    ? slide.bulletPoints
    : typeof slide.bulletPoints === "string"
    ? (() => {
        try {
          return JSON.parse(slide.bulletPoints);
        } catch {
          return [];
        }
      })()
    : [];

  const isCover = slide.slideType === "COVER" || slide.order === 1;
  const isCTA = slide.slideType === "CTA" || slide.order === totalSlides;
  const isComparison = slide.slideType === "COMPARISON";

  // Dynamic style tokens from brand kit
  const bg = brand.bgColor || "#0F172A";
  const cardBg = brand.cardBgColor || "#1E293B";
  const primary = brand.primaryColor || "#6366F1";
  const secondary = brand.secondaryColor || "#EC4899";
  const text = brand.textColor || "#F8FAFC";
  const accent = brand.accentColor || "#F59E0B";

  // Render template variations
  return (
    <div
      id={`${idPrefix}-${slide.order}`}
      style={{
        width: `${baseWidth}px`,
        height: `${baseHeight}px`,
        transform: `scale(${scale})`,
        transformOrigin: "top left",
        backgroundColor: bg,
        color: text,
      }}
      className="relative flex flex-col justify-between p-16 select-none overflow-hidden shrink-0 font-sans"
    >
      {/* 1. TOP HEADER BAR: Brand Handle & Slide Counter */}
      <div className="flex items-center justify-between w-full border-b pb-6 border-white/10 z-10">
        <div className="flex items-center gap-4">
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center font-bold text-xl text-white shadow-md"
            style={{ backgroundColor: primary }}
          >
            {brand.displayName ? brand.displayName.charAt(0) : "C"}
          </div>
          <div>
            <div className="text-xl font-bold tracking-tight text-white/90">
              {brand.displayName || "Creator"}
            </div>
            <div className="text-sm font-medium text-white/60">
              {brand.handle || "@creator"}
            </div>
          </div>
        </div>

        {/* Slide Counter / Progress Indicator */}
        <div className="flex items-center gap-2 bg-white/5 border border-white/10 px-4 py-2 rounded-full text-base font-semibold text-white/80">
          <span>{slide.order}</span>
          <span className="text-white/40">/</span>
          <span className="text-white/40">{totalSlides}</span>
        </div>
      </div>

      {/* 2. BODY CONTENT AREA */}
      <div className="flex-1 flex flex-col justify-center py-10 z-10">
        {/* TEMPLATE VARIANT 1: MINIMAL EDITORIAL */}
        {templateStyle === "minimal" && (
          <div className="flex flex-col gap-8 max-w-4xl mx-auto w-full">
            {slide.badgeText && (
              <span
                className="self-start px-4 py-1.5 rounded-md text-sm font-semibold tracking-wider uppercase"
                style={{ backgroundColor: `${primary}25`, color: primary, border: `1px solid ${primary}50` }}
              >
                {slide.badgeText}
              </span>
            )}

            <h1
              className={`font-extrabold tracking-tight leading-[1.15] ${
                isCover ? "text-6xl text-white" : "text-5xl text-white"
              }`}
              style={{ fontFamily: brand.fontHeading || "Inter" }}
            >
              {slide.headline}
            </h1>

            {slide.subheadline && (
              <p className="text-2xl font-medium text-white/80 leading-relaxed">
                {slide.subheadline}
              </p>
            )}

            {slide.bodyText && (
              <div
                className="text-2xl text-white/70 leading-relaxed p-8 rounded-2xl border border-white/10"
                style={{ backgroundColor: cardBg }}
              >
                {slide.bodyText}
              </div>
            )}

            {bullets.length > 0 && (
              <div className="flex flex-col gap-4 mt-2">
                {bullets.map((b, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-4 p-5 rounded-xl border border-white/10"
                    style={{ backgroundColor: cardBg }}
                  >
                    <CheckCircle2 className="w-8 h-8 shrink-0 mt-0.5" style={{ color: primary }} />
                    <span className="text-2xl text-white/90 font-medium leading-snug">{b}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TEMPLATE VARIANT 2: TWEET / SOCIAL CARD */}
        {templateStyle === "tweet" && (
          <div
            className="w-full max-w-4xl mx-auto rounded-3xl p-12 border shadow-2xl flex flex-col gap-8"
            style={{ backgroundColor: cardBg, borderColor: `${primary}30` }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div
                  className="w-16 h-16 rounded-full flex items-center justify-center font-bold text-2xl text-white shadow-lg"
                  style={{ backgroundColor: primary }}
                >
                  {brand.displayName.charAt(0)}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-bold text-white">{brand.displayName}</span>
                    <span className="w-5 h-5 rounded-full bg-blue-500 text-white flex items-center justify-center text-xs font-black">
                      ✓
                    </span>
                  </div>
                  <div className="text-lg text-white/60">{brand.handle}</div>
                </div>
              </div>

              {slide.badgeText && (
                <div
                  className="px-4 py-1.5 rounded-full text-sm font-bold uppercase tracking-wider"
                  style={{ backgroundColor: `${accent}20`, color: accent }}
                >
                  {slide.badgeText}
                </div>
              )}
            </div>

            <h2 className="text-4xl font-extrabold text-white leading-tight tracking-tight">
              {slide.headline}
            </h2>

            {slide.subheadline && (
              <p className="text-2xl text-white/80 font-normal leading-relaxed">
                {slide.subheadline}
              </p>
            )}

            {slide.bodyText && (
              <div className="text-2xl text-white/70 leading-relaxed border-l-4 pl-6 border-white/20">
                {slide.bodyText}
              </div>
            )}

            {bullets.length > 0 && (
              <div className="flex flex-col gap-3 pt-2">
                {bullets.map((b, i) => (
                  <div key={i} className="flex items-center gap-3 text-2xl text-white/90">
                    <span className="text-xl" style={{ color: primary }}>•</span>
                    <span>{b}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TEMPLATE VARIANT 3: BOLD DARK / GRADIENT */}
        {templateStyle === "bold" && (
          <div className="flex flex-col gap-8 max-w-4xl mx-auto w-full relative">
            <div className="flex items-center gap-4">
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl font-black text-white shadow-xl"
                style={{
                  background: `linear-gradient(135deg, ${primary}, ${secondary})`,
                }}
              >
                0{slide.order}
              </div>
              {slide.badgeText && (
                <span
                  className="px-4 py-2 rounded-xl text-base font-black uppercase tracking-wider text-black"
                  style={{ backgroundColor: accent }}
                >
                  {slide.badgeText}
                </span>
              )}
            </div>

            <h1 className="text-6xl font-black tracking-tight leading-[1.1] text-white">
              {slide.headline}
            </h1>

            {slide.subheadline && (
              <p className="text-2xl font-semibold text-white/85 leading-relaxed">
                {slide.subheadline}
              </p>
            )}

            {slide.bodyText && (
              <div
                className="p-8 rounded-3xl text-2xl text-white/90 leading-relaxed border-2"
                style={{
                  backgroundColor: cardBg,
                  borderColor: `${primary}50`,
                  boxShadow: `0 10px 40px ${primary}20`,
                }}
              >
                {slide.bodyText}
              </div>
            )}

            {bullets.length > 0 && (
              <div className="grid grid-cols-1 gap-4 mt-2">
                {bullets.map((b, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-4 p-5 rounded-2xl border border-white/10"
                    style={{ backgroundColor: `${cardBg}cc` }}
                  >
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-lg text-white shrink-0"
                      style={{ backgroundColor: primary }}
                    >
                      {i + 1}
                    </div>
                    <span className="text-2xl text-white font-medium">{b}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TEMPLATE VARIANT 4: INFOGRAPHIC / FRAMEWORKS */}
        {templateStyle === "infographic" && (
          <div className="flex flex-col gap-8 max-w-4xl mx-auto w-full">
            <div className="flex items-center justify-between">
              {slide.badgeText && (
                <span
                  className="px-5 py-2 rounded-xl text-base font-bold uppercase tracking-wider text-white"
                  style={{ backgroundColor: primary }}
                >
                  {slide.badgeText}
                </span>
              )}
              <span className="text-xl font-bold text-white/50 tracking-widest uppercase">
                {slide.slideType}
              </span>
            </div>

            <h2 className="text-5xl font-black text-white leading-tight">
              {slide.headline}
            </h2>

            {slide.subheadline && (
              <p className="text-2xl font-medium text-white/80">
                {slide.subheadline}
              </p>
            )}

            {/* If COMPARISON slide */}
            {isComparison ? (
              <div className="grid grid-cols-2 gap-6 my-4">
                <div className="p-6 rounded-2xl border border-red-500/30 bg-red-950/20 flex flex-col gap-4">
                  <div className="flex items-center gap-2 text-red-400 font-bold text-xl uppercase tracking-wider">
                    <XCircle className="w-6 h-6" /> What Doesn&apos;t Work
                  </div>
                  <p className="text-xl text-white/80 leading-relaxed">
                    {slide.bodyText || "Relying on random inspiration and guessing."}
                  </p>
                </div>
                <div
                  className="p-6 rounded-2xl border flex flex-col gap-4"
                  style={{ borderColor: `${primary}60`, backgroundColor: `${primary}15` }}
                >
                  <div className="flex items-center gap-2 font-bold text-xl uppercase tracking-wider" style={{ color: primary }}>
                    <CheckCircle2 className="w-6 h-6" /> The Winning Strategy
                  </div>
                  <p className="text-xl text-white/90 leading-relaxed">
                    {bullets[0] || "Using systematic frameworks and consistent templates."}
                  </p>
                </div>
              </div>
            ) : (
              slide.bodyText && (
                <div
                  className="p-8 rounded-2xl border border-white/10 text-2xl text-white/80 leading-relaxed"
                  style={{ backgroundColor: cardBg }}
                >
                  {slide.bodyText}
                </div>
              )
            )}

            {bullets.length > 0 && !isComparison && (
              <div className="grid grid-cols-2 gap-4">
                {bullets.map((b, i) => (
                  <div
                    key={i}
                    className="p-5 rounded-2xl border border-white/10 flex items-start gap-3"
                    style={{ backgroundColor: cardBg }}
                  >
                    <CheckCircle2 className="w-6 h-6 shrink-0 mt-1" style={{ color: accent }} />
                    <span className="text-xl text-white/90 font-medium leading-snug">{b}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* 3. BOTTOM FOOTER BAR: Swipe Indicator or CTA */}
      <div className="flex items-center justify-between w-full pt-6 border-t border-white/10 z-10">
        <div className="flex items-center gap-2 text-white/60 font-semibold text-lg">
          <Sparkles className="w-5 h-5" style={{ color: accent }} />
          <span>{brand.name}</span>
        </div>

        {isCTA ? (
          <div
            className="flex items-center gap-3 px-6 py-3 rounded-full font-bold text-xl text-white shadow-lg"
            style={{ backgroundColor: primary }}
          >
            <span>Save & Follow</span>
            <ChevronRight className="w-6 h-6" />
          </div>
        ) : (
          <div className="flex items-center gap-2 text-white/80 font-bold text-xl">
            <span>Swipe</span>
            <ArrowRight className="w-6 h-6 animate-pulse" style={{ color: primary }} />
          </div>
        )}
      </div>

      {/* Decorative Background Glow */}
      <div
        className="absolute -top-40 -right-40 w-96 h-96 rounded-full blur-3xl opacity-30 pointer-events-none"
        style={{ backgroundColor: primary }}
      />
      <div
        className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full blur-3xl opacity-20 pointer-events-none"
        style={{ backgroundColor: secondary }}
      />
    </div>
  );
}
