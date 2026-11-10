"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Layers, Video, Palette, ArrowRight, Sparkles, Clock, Trash2 } from "lucide-react";
import { ProjectData, BrandKitData } from "@/types";
import { HOOK_FORMULAS } from "@/lib/hook-formulas";

export default function Dashboard() {
  const [projects, setProjects] = useState<ProjectData[]>([]);
  const [brands, setBrands] = useState<BrandKitData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/projects").then((res) => res.json()),
      fetch("/api/brands").then((res) => res.json()),
    ])
      .then(([projData, brandData]) => {
        if (Array.isArray(projData)) setProjects(projData);
        if (Array.isArray(brandData)) setBrands(brandData);
      })
      .catch((err) => console.error("Error loading dashboard data:", err))
      .finally(() => setIsLoading(false));
  }, []);

  const deleteProject = async (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    if (!confirm("Are you sure you want to delete this project?")) return;
    try {
      const res = await fetch(`/api/projects/${id}`, { method: "DELETE" });
      if (res.ok) {
        setProjects((prev) => prev.filter((p) => p.id !== id));
      }
    } catch (err) {
      alert("Failed to delete project: " + String(err));
    }
  };

  const defaultBrand = brands.find((b) => b.isDefault) || brands[0];
  const carouselCount = projects.filter((p) => p.type === "CAROUSEL").length;
  const reelCount = projects.filter((p) => p.type === "REEL").length;

  return (
    <div className="max-w-7xl mx-auto px-6 py-10 w-full space-y-12">
      {/* Top Banner / Hero */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-neutral-800 pb-8">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" /> Creation Command Center
          </div>
          <h1 className="text-4xl font-extrabold text-white tracking-tight">
            Produce High-Converting Carousels & Reels
          </h1>
          <p className="text-neutral-400 text-base max-w-2xl">
            Generate pixel-perfect 4:5 Instagram carousel slides, script viral reel storyboards with fullscreen teleprompter mode, and auto-sync directly to your Google Drive.
          </p>
        </div>

        {/* Quick Create Buttons */}
        <div className="flex items-center gap-3 shrink-0">
          <Link
            href="/studio/carousel"
            className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold transition-all shadow-lg shadow-indigo-600/20 hover:scale-105"
          >
            <Layers className="w-5 h-5" />
            <span>New Carousel</span>
          </Link>
          <Link
            href="/studio/reel"
            className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-gradient-to-r from-pink-600 to-purple-600 hover:opacity-90 text-white font-bold transition-all shadow-lg shadow-pink-600/20 hover:scale-105"
          >
            <Video className="w-5 h-5" />
            <span>New Reel</span>
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-6 rounded-3xl bg-neutral-900/60 border border-neutral-800 space-y-2">
          <div className="flex items-center justify-between text-neutral-400 text-sm font-semibold">
            <span>Total Projects</span>
            <Sparkles className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-3xl font-extrabold text-white">{projects.length}</div>
          <div className="text-xs text-neutral-500">In draft & ready states</div>
        </div>

        <div className="p-6 rounded-3xl bg-neutral-900/60 border border-neutral-800 space-y-2">
          <div className="flex items-center justify-between text-neutral-400 text-sm font-semibold">
            <span>Carousels Created</span>
            <Layers className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-3xl font-extrabold text-white">{carouselCount}</div>
          <div className="text-xs text-neutral-500">1080x1350 4:5 slide decks</div>
        </div>

        <div className="p-6 rounded-3xl bg-neutral-900/60 border border-neutral-800 space-y-2">
          <div className="flex items-center justify-between text-neutral-400 text-sm font-semibold">
            <span>Reels Scripted</span>
            <Video className="w-4 h-4 text-pink-400" />
          </div>
          <div className="text-3xl font-extrabold text-white">{reelCount}</div>
          <div className="text-xs text-neutral-500">Storyboards with teleprompter</div>
        </div>

        <div className="p-6 rounded-3xl bg-neutral-900/60 border border-neutral-800 space-y-2">
          <div className="flex items-center justify-between text-neutral-400 text-sm font-semibold">
            <span>Active Brand Kit</span>
            <Palette className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-xl font-bold text-white truncate">
            {defaultBrand?.name || "None"}
          </div>
          <div className="text-xs text-neutral-400 flex items-center gap-1.5">
            <span
              className="w-2.5 h-2.5 rounded-full inline-block"
              style={{ backgroundColor: defaultBrand?.primaryColor || "#6366F1" }}
            />
            <span>{defaultBrand?.handle || "@creator"}</span>
          </div>
        </div>
      </div>

      {/* Featured Hook Inspiration Strip */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-400" />
            <span>Proven Hook Formulas</span>
          </h2>
          <span className="text-xs text-neutral-400">Click to start creating instantly</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {HOOK_FORMULAS.slice(0, 3).map((hook) => (
            <Link
              key={hook.id}
              href={`/studio/carousel?formula=${encodeURIComponent(hook.template)}`}
              className="p-5 rounded-2xl bg-neutral-900/40 border border-neutral-800/80 hover:border-neutral-700 hover:bg-neutral-900 transition-all group flex flex-col justify-between gap-4"
            >
              <div className="space-y-2">
                <span className="text-xs font-black uppercase tracking-wider text-amber-400">
                  {hook.category} Formula
                </span>
                <p className="text-sm font-semibold text-white group-hover:text-indigo-300 transition-colors">
                  {hook.title}
                </p>
                <p className="text-xs text-neutral-400 italic leading-relaxed line-clamp-2">
                  &ldquo;{hook.example}&rdquo;
                </p>
              </div>
              <div className="flex items-center gap-1 text-xs font-bold text-indigo-400 group-hover:translate-x-1 transition-transform">
                <span>Use In Studio</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Recent Projects Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Clock className="w-5 h-5 text-indigo-400" />
            <span>Recent Creations</span>
          </h2>
          {projects.length > 0 && (
            <span className="text-xs text-neutral-500 font-semibold">{projects.length} saved</span>
          )}
        </div>

        {isLoading ? (
          <div className="text-center py-16 text-neutral-500">Loading projects...</div>
        ) : projects.length === 0 ? (
          <div className="p-12 rounded-3xl bg-neutral-900/40 border border-neutral-800/80 text-center space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-neutral-800 text-neutral-400 mx-auto flex items-center justify-center">
              <Layers className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-white">No creations yet</h3>
              <p className="text-sm text-neutral-400">
                Kick off your first Instagram Carousel or Reel using the buttons above.
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {projects.map((p) => {
              const isCarousel = p.type === "CAROUSEL";
              const targetUrl = isCarousel ? `/studio/carousel?id=${p.id}` : `/studio/reel?id=${p.id}`;
              const slideCount = p.slides?.length || 0;
              const beatCount = p.reelBeats?.length || 0;

              return (
                <Link
                  key={p.id}
                  href={targetUrl}
                  className="p-6 rounded-3xl bg-neutral-900/60 border border-neutral-800/80 hover:border-neutral-700 hover:bg-neutral-900 transition-all flex flex-col justify-between gap-6 group relative"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider ${
                          isCarousel
                            ? "bg-indigo-500/20 text-indigo-400 border border-indigo-500/30"
                            : "bg-pink-500/20 text-pink-400 border border-pink-500/30"
                        }`}
                      >
                        {isCarousel ? `Carousel (${slideCount} slides)` : `Reel (${beatCount} beats)`}
                      </span>

                      <button
                        onClick={(e) => deleteProject(p.id!, e)}
                        className="text-neutral-500 hover:text-red-400 p-1.5 rounded-lg hover:bg-neutral-800 transition-colors"
                        title="Delete project"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <h3 className="text-lg font-bold text-white group-hover:text-indigo-300 transition-colors line-clamp-2">
                      {p.title}
                    </h3>

                    {p.caption && (
                      <p className="text-xs text-neutral-400 line-clamp-2 leading-relaxed">
                        {p.caption}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center justify-between text-xs text-neutral-500 border-t border-neutral-800/60 pt-4">
                    <span className="truncate max-w-[150px]">
                      {p.brandKit?.name || "Default Brand"}
                    </span>
                    <span className="flex items-center gap-1 text-indigo-400 font-semibold group-hover:translate-x-1 transition-transform">
                      Open in Studio <ArrowRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
