"use client";

import React from "react";
import { CarouselSlideData, BrandKitData, TemplateStyle } from "@/types";
import { CheckCircle2, ChevronRight, Sparkles, ArrowRight, XCircle, Quote } from "lucide-react";

interface SlideRendererProps {
  slide: CarouselSlideData;
  brand: BrandKitData;
  templateStyle: TemplateStyle;
  totalSlides: number;
  scale?: number; // Scaling factor for preview vs full resolution (1080x1350)
  idPrefix?: string;
}

// System font stacks that render reliably without external CDN dependencies
export const SYSTEM_FONT_STACKS: Record<string, string> = {
  Inter: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  System: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  Georgia: 'Georgia, Cambria, "Times New Roman", Times, serif',
  Serif: 'Georgia, Cambria, "Times New Roman", Times, serif',
  Mono: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
  Helvetica: '"Helvetica Neue", Helvetica, Arial, sans-serif',
};

function getFontFamily(fontName: string | undefined): string {
  if (!fontName) return SYSTEM_FONT_STACKS.Inter;
  return SYSTEM_FONT_STACKS[fontName] || `${fontName}, -apple-system, BlinkMacSystemFont, sans-serif`;
}

function getLuminance(hex: string): number {
  const clean = (hex || "#000000").replace("#", "");
  const r = parseInt(clean.substring(0, 2), 16) || 0;
  const g = parseInt(clean.substring(2, 4), 16) || 0;
  const b = parseInt(clean.substring(4, 6), 16) || 0;
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
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
          const parsed = JSON.parse(slide.bulletPoints);
          return Array.isArray(parsed) ? parsed : [];
        } catch {
          return [];
        }
      })()
    : [];

  const isCover = slide.slideType === "COVER" || slide.order === 1;
  const isCTA = slide.slideType === "CTA" || slide.order === totalSlides;
  const isQuote = slide.slideType === "QUOTE";
  const isComparison = slide.slideType === "COMPARISON";

  // Dynamic style tokens from brand kit
  const bg = brand.bgColor || "#0F172A";
  const bgIsLight = getLuminance(bg) > 0.5;

  // Ensure text colors remain readable regardless of chosen palette
  const textPrimary = brand.textColor && (bgIsLight ? getLuminance(brand.textColor) < 0.5 : getLuminance(brand.textColor) > 0.5)
    ? brand.textColor
    : bgIsLight ? "#0F172A" : "#F8FAFC";

  const textSecondary = bgIsLight ? "rgba(15, 23, 42, 0.75)" : "rgba(248, 250, 252, 0.75)";
  const textMuted = bgIsLight ? "rgba(15, 23, 42, 0.55)" : "rgba(248, 250, 252, 0.55)";
  const borderColor = bgIsLight ? "rgba(15, 23, 42, 0.12)" : "rgba(255, 255, 255, 0.12)";

  const cardBg = brand.cardBgColor && (bgIsLight ? getLuminance(brand.cardBgColor) > 0.4 : getLuminance(brand.cardBgColor) < 0.6)
    ? brand.cardBgColor
    : bgIsLight ? "#F1F5F9" : "#1E293B";

  const primary = brand.primaryColor || "#6366F1";
  const secondary = brand.secondaryColor || "#EC4899";
  const accent = brand.accentColor || "#F59E0B";

  const headingFont = getFontFamily(brand.fontHeading);
  const bodyFont = getFontFamily(brand.fontBody);

  // Distinguish internal kit name from public branding
  const publicDisplayName = brand.displayName || "Creator";
  const publicHandle = brand.handle || "@creator";

  return (
    <div
      id={`${idPrefix}-${slide.order}`}
      style={{
        width: `${baseWidth}px`,
        height: `${baseHeight}px`,
        transform: `scale(${scale})`,
        transformOrigin: "top left",
        backgroundColor: bg,
        color: textPrimary,
        fontFamily: bodyFont,
      }}
      className="relative flex flex-col justify-between p-16 select-none overflow-hidden shrink-0"
    >
      {/* 1. TOP HEADER BAR: Brand Handle & Slide Counter */}
      <div
        className="flex items-center justify-between w-full pb-6 z-10"
        style={{ borderBottom: `1px solid ${borderColor}` }}
      >
        <div className="flex items-center gap-4">
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center font-bold text-xl text-white shadow-md shrink-0"
            style={{ backgroundColor: primary, fontFamily: headingFont }}
          >
            {publicDisplayName.charAt(0)}
          </div>
          <div>
            <div className="text-xl font-bold tracking-tight" style={{ color: textPrimary, fontFamily: headingFont }}>
              {publicDisplayName}
            </div>
            <div className="text-sm font-medium" style={{ color: textMuted }}>
              {publicHandle}
            </div>
          </div>
        </div>

        {/* Slide Counter / Progress Indicator */}
        <div
          className="flex items-center gap-2 px-4 py-2 rounded-full text-base font-semibold"
          style={{ backgroundColor: cardBg, border: `1px solid ${borderColor}`, color: textPrimary }}
        >
          <span>{slide.order}</span>
          <span style={{ color: textMuted }}>/</span>
          <span style={{ color: textMuted }}>{totalSlides}</span>
        </div>
      </div>

      {/* 2. BODY CONTENT AREA */}
      <div className="flex-1 flex flex-col justify-center py-8 z-10 overflow-hidden">
        {/* SPECIAL LAYOUT: DEDICATED QUOTE LAYOUT */}
        {isQuote ? (
          <div className="flex flex-col gap-8 max-w-4xl mx-auto w-full p-10 rounded-3xl" style={{ backgroundColor: cardBg, border: `1px solid ${borderColor}` }}>
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-white" style={{ backgroundColor: primary }}>
              <Quote className="w-8 h-8" />
            </div>

            <blockquote
              className="text-4xl md:text-5xl font-extrabold tracking-tight leading-tight italic"
              style={{ color: textPrimary, fontFamily: headingFont }}
            >
              &ldquo;{slide.headline}&rdquo;
            </blockquote>

            {slide.subheadline && (
              <p className="text-2xl font-medium leading-relaxed" style={{ color: textSecondary }}>
                {slide.subheadline}
              </p>
            )}

            {slide.bodyText && (
              <p className="text-xl leading-relaxed" style={{ color: textSecondary }}>
                {slide.bodyText}
              </p>
            )}

            <div className="pt-4 border-t" style={{ borderColor }}>
              <div className="text-2xl font-bold tracking-wide" style={{ color: primary, fontFamily: headingFont }}>
                — {slide.quoteAuthor || publicDisplayName}
              </div>
            </div>
          </div>
        ) : isComparison ? (
          /* SPECIAL LAYOUT: COMPARISON LAYOUT (Without dropped content) */
          <div className="flex flex-col gap-6 max-w-4xl mx-auto w-full">
            {slide.badgeText && (
              <span
                className="self-start px-4 py-1.5 rounded-md text-sm font-semibold tracking-wider uppercase"
                style={{ backgroundColor: `${primary}20`, color: primary, border: `1px solid ${primary}40` }}
              >
                {slide.badgeText}
              </span>
            )}

            <h1
              className="text-5xl font-extrabold tracking-tight leading-tight"
              style={{ color: textPrimary, fontFamily: headingFont }}
            >
              {slide.headline}
            </h1>

            {slide.subheadline && (
              <p className="text-2xl font-medium leading-relaxed" style={{ color: textSecondary }}>
                {slide.subheadline}
              </p>
            )}

            <div className="grid grid-cols-2 gap-6 my-2">
              {/* Column 1: What to Avoid */}
              <div
                className="p-6 rounded-2xl flex flex-col gap-4 border"
                style={{
                  backgroundColor: bgIsLight ? "rgba(239, 68, 68, 0.08)" : "rgba(127, 29, 29, 0.25)",
                  borderColor: "rgba(239, 68, 68, 0.3)",
                }}
              >
                <div className="flex items-center gap-2 text-red-500 font-bold text-xl uppercase tracking-wider">
                  <XCircle className="w-6 h-6 shrink-0" />
                  <span>The Pitfall</span>
                </div>
                <p className="text-xl leading-relaxed" style={{ color: textSecondary }}>
                  {slide.bodyText || "Relying on random inspiration or unproven assumptions."}
                </p>
              </div>

              {/* Column 2: What to Do */}
              <div
                className="p-6 rounded-2xl flex flex-col gap-4 border"
                style={{
                  backgroundColor: bgIsLight ? `${primary}10` : `${primary}20`,
                  borderColor: `${primary}50`,
                }}
              >
                <div className="flex items-center gap-2 font-bold text-xl uppercase tracking-wider" style={{ color: primary }}>
                  <CheckCircle2 className="w-6 h-6 shrink-0" />
                  <span>The Solution</span>
                </div>
                {bullets.length > 0 ? (
                  <div className="flex flex-col gap-3">
                    {bullets.map((b, i) => (
                      <div key={i} className="flex items-start gap-2.5">
                        <span className="font-bold text-lg" style={{ color: primary }}>•</span>
                        <span className="text-xl font-medium leading-snug" style={{ color: textPrimary }}>{b}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xl leading-relaxed" style={{ color: textPrimary }}>
                    Build reusable systems and test with feedback.
                  </p>
                )}
              </div>
            </div>
          </div>
        ) : templateStyle === "minimal" ? (
          /* TEMPLATE 1: MINIMAL EDITORIAL */
          <div className="flex flex-col gap-8 max-w-4xl mx-auto w-full">
            {slide.badgeText && (
              <span
                className="self-start px-4 py-1.5 rounded-md text-sm font-semibold tracking-wider uppercase"
                style={{ backgroundColor: `${primary}20`, color: primary, border: `1px solid ${primary}40` }}
              >
                {slide.badgeText}
              </span>
            )}

            <h1
              className={`font-extrabold tracking-tight leading-[1.15] ${
                isCover ? "text-6xl" : "text-5xl"
              }`}
              style={{ color: textPrimary, fontFamily: headingFont }}
            >
              {slide.headline}
            </h1>

            {slide.subheadline && (
              <p className="text-2xl font-medium leading-relaxed" style={{ color: textSecondary }}>
                {slide.subheadline}
              </p>
            )}

            {slide.bodyText && (
              <div
                className="text-2xl leading-relaxed p-8 rounded-2xl border"
                style={{ backgroundColor: cardBg, borderColor, color: textSecondary }}
              >
                {slide.bodyText}
              </div>
            )}

            {bullets.length > 0 && (
              <div className="flex flex-col gap-4 mt-2">
                {bullets.map((b, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-4 p-5 rounded-xl border"
                    style={{ backgroundColor: cardBg, borderColor }}
                  >
                    <CheckCircle2 className="w-8 h-8 shrink-0 mt-0.5" style={{ color: primary }} />
                    <span className="text-2xl font-medium leading-snug" style={{ color: textPrimary }}>{b}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : templateStyle === "tweet" ? (
          /* TEMPLATE 2: SOCIAL CARD (No fake verified badge) */
          <div
            className="w-full max-w-4xl mx-auto rounded-3xl p-12 border shadow-2xl flex flex-col gap-8"
            style={{ backgroundColor: cardBg, borderColor }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div
                  className="w-16 h-16 rounded-full flex items-center justify-center font-bold text-2xl text-white shadow-lg"
                  style={{ backgroundColor: primary, fontFamily: headingFont }}
                >
                  {publicDisplayName.charAt(0)}
                </div>
                <div>
                  <div className="text-2xl font-bold" style={{ color: textPrimary, fontFamily: headingFont }}>
                    {publicDisplayName}
                  </div>
                  <div className="text-lg" style={{ color: textMuted }}>
                    {publicHandle}
                  </div>
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

            <h2
              className="text-4xl font-extrabold leading-tight tracking-tight"
              style={{ color: textPrimary, fontFamily: headingFont }}
            >
              {slide.headline}
            </h2>

            {slide.subheadline && (
              <p className="text-2xl font-normal leading-relaxed" style={{ color: textSecondary }}>
                {slide.subheadline}
              </p>
            )}

            {slide.bodyText && (
              <div
                className="text-2xl leading-relaxed border-l-4 pl-6"
                style={{ borderColor: primary, color: textSecondary }}
              >
                {slide.bodyText}
              </div>
            )}

            {bullets.length > 0 && (
              <div className="flex flex-col gap-3 pt-2">
                {bullets.map((b, i) => (
                  <div key={i} className="flex items-center gap-3 text-2xl" style={{ color: textPrimary }}>
                    <span className="text-xl" style={{ color: primary }}>•</span>
                    <span>{b}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : templateStyle === "bold" ? (
          /* TEMPLATE 3: BOLD GRADIENT */
          <div className="flex flex-col gap-8 max-w-4xl mx-auto w-full relative">
            <div className="flex items-center gap-4">
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl font-black text-white shadow-xl"
                style={{
                  background: `linear-gradient(135deg, ${primary}, ${secondary})`,
                  fontFamily: headingFont,
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

            <h1
              className="text-6xl font-black tracking-tight leading-[1.1]"
              style={{ color: textPrimary, fontFamily: headingFont }}
            >
              {slide.headline}
            </h1>

            {slide.subheadline && (
              <p className="text-2xl font-semibold leading-relaxed" style={{ color: textSecondary }}>
                {slide.subheadline}
              </p>
            )}

            {slide.bodyText && (
              <div
                className="p-8 rounded-3xl text-2xl leading-relaxed border-2"
                style={{
                  backgroundColor: cardBg,
                  borderColor: `${primary}50`,
                  color: textPrimary,
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
                    className="flex items-center gap-4 p-5 rounded-2xl border"
                    style={{ backgroundColor: cardBg, borderColor }}
                  >
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-lg text-white shrink-0"
                      style={{ backgroundColor: primary, fontFamily: headingFont }}
                    >
                      {i + 1}
                    </div>
                    <span className="text-2xl font-medium" style={{ color: textPrimary }}>{b}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          /* TEMPLATE 4: INFOGRAPHIC */
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
              <span className="text-xl font-bold tracking-widest uppercase" style={{ color: textMuted }}>
                {slide.slideType}
              </span>
            </div>

            <h2
              className="text-5xl font-black leading-tight"
              style={{ color: textPrimary, fontFamily: headingFont }}
            >
              {slide.headline}
            </h2>

            {slide.subheadline && (
              <p className="text-2xl font-medium" style={{ color: textSecondary }}>
                {slide.subheadline}
              </p>
            )}

            {slide.bodyText && (
              <div
                className="p-8 rounded-2xl border text-2xl leading-relaxed"
                style={{ backgroundColor: cardBg, borderColor, color: textSecondary }}
              >
                {slide.bodyText}
              </div>
            )}

            {bullets.length > 0 && (
              <div className="grid grid-cols-2 gap-4">
                {bullets.map((b, i) => (
                  <div
                    key={i}
                    className="p-5 rounded-2xl border flex items-start gap-3"
                    style={{ backgroundColor: cardBg, borderColor }}
                  >
                    <CheckCircle2 className="w-6 h-6 shrink-0 mt-1" style={{ color: accent }} />
                    <span className="text-xl font-medium leading-snug" style={{ color: textPrimary }}>{b}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* 3. BOTTOM FOOTER BAR: Public Branding & Swipe Indicator / CTA */}
      <div
        className="flex items-center justify-between w-full pt-6 z-10"
        style={{ borderTop: `1px solid ${borderColor}` }}
      >
        <div className="flex items-center gap-2 font-semibold text-lg" style={{ color: textSecondary }}>
          <Sparkles className="w-5 h-5 shrink-0" style={{ color: accent }} />
          <span>{publicHandle || publicDisplayName}</span>
        </div>

        {isCTA ? (
          <div
            className="flex items-center gap-3 px-6 py-3 rounded-full font-bold text-xl text-white shadow-lg"
            style={{ backgroundColor: primary, fontFamily: headingFont }}
          >
            <span>Save & Follow</span>
            <ChevronRight className="w-6 h-6" />
          </div>
        ) : (
          <div className="flex items-center gap-2 font-bold text-xl" style={{ color: textPrimary }}>
            <span>Swipe</span>
            <ArrowRight className="w-6 h-6 animate-pulse" style={{ color: primary }} />
          </div>
        )}
      </div>

      {/* Decorative Glow Elements (Subtle) */}
      <div
        className="absolute -top-40 -right-40 w-96 h-96 rounded-full blur-3xl opacity-20 pointer-events-none"
        style={{ backgroundColor: primary }}
      />
      <div
        className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full blur-3xl opacity-15 pointer-events-none"
        style={{ backgroundColor: secondary }}
      />
    </div>
  );
}
