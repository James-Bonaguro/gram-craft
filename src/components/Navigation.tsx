"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Layers, Video, Palette, Settings, LayoutDashboard, Folder, Sparkles } from "lucide-react";
import { BrandKitData } from "@/types";

export function Navigation() {
  const pathname = usePathname();
  const [activeBrand, setActiveBrand] = useState<BrandKitData | null>(null);

  useEffect(() => {
    fetch("/api/brands")
      .then((res) => res.json())
      .then((brands) => {
        if (Array.isArray(brands) && brands.length > 0) {
          const def = brands.find((b) => b.isDefault) || brands[0];
          setActiveBrand(def);
        }
      })
      .catch(() => {});
  }, [pathname]);

  const navLinks = [
    { name: "Dashboard", href: "/", icon: LayoutDashboard },
    { name: "Carousel Studio", href: "/studio/carousel", icon: Layers },
    { name: "Reel Studio", href: "/studio/reel", icon: Video },
    { name: "Brand Kits", href: "/brand-kits", icon: Palette },
    { name: "Settings", href: "/settings", icon: Settings },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-neutral-800 bg-neutral-950/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-pink-500 via-purple-600 to-indigo-500 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20 group-hover:scale-105 transition-transform">
              <Sparkles className="w-5 h-5" />
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold text-lg text-white tracking-tight flex items-center gap-1.5">
                GramCraft
                <span className="text-[10px] uppercase font-black px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                  Studio
                </span>
              </span>
            </div>
          </Link>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href || (link.href !== "/" && pathname.startsWith(link.href));
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-semibold transition-all ${
                    isActive
                      ? "bg-neutral-800 text-white shadow-sm"
                      : "text-neutral-400 hover:text-white hover:bg-neutral-900"
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? "text-indigo-400" : "text-neutral-500"}`} />
                  <span>{link.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Right Info: Active Brand Pill & Google Drive Indicator */}
        <div className="flex items-center gap-3">
          {activeBrand && (
            <Link
              href="/brand-kits"
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-neutral-900 border border-neutral-800 hover:border-neutral-700 transition-colors text-xs font-semibold"
            >
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: activeBrand.primaryColor }}
              />
              <span className="text-neutral-300">{activeBrand.name}</span>
            </Link>
          )}

          <Link
            href="/settings"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-neutral-900 border border-neutral-800 hover:border-neutral-700 text-neutral-300 text-xs font-semibold transition-colors"
            title="Configure local export directory in Settings"
          >
            <Folder className="w-3.5 h-3.5 text-indigo-400" />
            <span className="hidden sm:inline">Local Export Ready</span>
          </Link>
        </div>
      </div>
    </header>
  );
}
