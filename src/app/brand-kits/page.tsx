"use client";

import React, { useEffect, useState } from "react";
import { Palette, Plus, Trash2, Edit3 } from "lucide-react";
import { BrandKitData } from "@/types";

export default function BrandKitsPage() {
  const [brands, setBrands] = useState<BrandKitData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingBrand, setEditingBrand] = useState<BrandKitData | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const fetchBrands = () => {
    setIsLoading(true);
    fetch("/api/brands")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setBrands(data);
      })
      .catch((err) => console.error("Error loading brand kits:", err))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    fetchBrands();
  }, []);

  const handleSave = async (brandData: BrandKitData) => {
    try {
      const isNew = !brandData.id;
      const url = isNew ? "/api/brands" : `/api/brands/${brandData.id}`;
      const method = isNew ? "POST" : "PUT";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(brandData),
      });

      if (!res.ok) throw new Error("Failed to save brand kit");

      setEditingBrand(null);
      setIsCreating(false);
      fetchBrands();
    } catch (err) {
      alert("Error saving brand kit: " + String(err));
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this brand kit?")) return;
    try {
      const res = await fetch(`/api/brands/${id}`, { method: "DELETE" });
      if (res.ok) fetchBrands();
    } catch (err) {
      alert("Error deleting brand kit: " + String(err));
    }
  };

  const handleSetDefault = async (brand: BrandKitData) => {
    try {
      await fetch(`/api/brands/${brand.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...brand, isDefault: true }),
      });
      fetchBrands();
    } catch (err) {
      alert("Error setting default brand kit: " + String(err));
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-6 py-10 w-full space-y-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-800 pb-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-xs font-bold uppercase tracking-wider mb-2">
            <Palette className="w-3.5 h-3.5" /> Brand Identity Engine
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Multi-Brand Kits</h1>
          <p className="text-neutral-400 text-sm mt-1">
            Store distinct visual palettes, typography, handles, and AI creator personas for each channel or client.
          </p>
        </div>

        <button
          onClick={() => {
            setEditingBrand({
              name: "",
              handle: "@",
              displayName: "",
              primaryColor: "#6366F1",
              secondaryColor: "#EC4899",
              bgColor: "#0F172A",
              cardBgColor: "#1E293B",
              textColor: "#F8FAFC",
              accentColor: "#F59E0B",
              fontHeading: "Inter",
              fontBody: "Inter",
              toneVoice: "Direct, punchy, insightful",
              targetAudience: "Founders, executives, and high-growth operators",
              bannedWords: "synergy, paradigm, delve",
              isDefault: brands.length === 0,
            });
            setIsCreating(true);
          }}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold shadow-lg shadow-indigo-600/20 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add Brand Kit</span>
        </button>
      </div>

      {/* Brand Kits Grid */}
      {isLoading ? (
        <div className="text-center py-16 text-neutral-500">Loading brand kits...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {brands.map((brand) => (
            <div
              key={brand.id}
              className="p-6 rounded-3xl bg-neutral-900/60 border border-neutral-800 flex flex-col justify-between gap-6 relative group"
            >
              {/* Top Details & Default Badge */}
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-xl text-white shadow-md"
                      style={{ backgroundColor: brand.primaryColor }}
                    >
                      {brand.displayName.charAt(0) || "B"}
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-white flex items-center gap-2">
                        <span>{brand.name}</span>
                        {brand.isDefault && (
                          <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                            Default
                          </span>
                        )}
                      </h3>
                      <p className="text-xs text-neutral-400">{brand.handle} • {brand.displayName}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setEditingBrand(brand)}
                      className="p-2 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 transition-colors"
                      title="Edit Brand Kit"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    {!brand.isDefault && (
                      <button
                        onClick={() => handleDelete(brand.id!)}
                        className="p-2 text-neutral-500 hover:text-red-400 rounded-lg hover:bg-neutral-800 transition-colors"
                        title="Delete Brand Kit"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Color Palette Swatches */}
                <div className="space-y-1.5">
                  <span className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider">Palette</span>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-neutral-950 border border-neutral-800 text-xs font-mono">
                      <span className="w-3.5 h-3.5 rounded-full border border-white/20" style={{ backgroundColor: brand.primaryColor }} />
                      <span className="text-neutral-400">{brand.primaryColor}</span>
                    </div>
                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-neutral-950 border border-neutral-800 text-xs font-mono">
                      <span className="w-3.5 h-3.5 rounded-full border border-white/20" style={{ backgroundColor: brand.secondaryColor }} />
                      <span className="text-neutral-400">{brand.secondaryColor}</span>
                    </div>
                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-neutral-950 border border-neutral-800 text-xs font-mono">
                      <span className="w-3.5 h-3.5 rounded-full border border-white/20" style={{ backgroundColor: brand.accentColor }} />
                      <span className="text-neutral-400">{brand.accentColor}</span>
                    </div>
                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-neutral-950 border border-neutral-800 text-xs font-mono">
                      <span className="w-3.5 h-3.5 rounded-full border border-white/20" style={{ backgroundColor: brand.bgColor }} />
                      <span className="text-neutral-400">BG</span>
                    </div>
                  </div>
                </div>

                {/* Persona Guidelines */}
                <div className="p-3.5 rounded-2xl bg-neutral-950/70 border border-neutral-800/80 space-y-1.5 text-xs">
                  <div>
                    <span className="font-bold text-neutral-400">Voice: </span>
                    <span className="text-neutral-300">{brand.toneVoice}</span>
                  </div>
                  <div>
                    <span className="font-bold text-neutral-400">Audience: </span>
                    <span className="text-neutral-300">{brand.targetAudience}</span>
                  </div>
                </div>
              </div>

              {/* Bottom Actions */}
              <div className="flex items-center justify-between border-t border-neutral-800/60 pt-4 text-xs">
                <span className="text-neutral-500 font-medium">
                  Heading: <strong className="text-neutral-300">{brand.fontHeading}</strong>
                </span>
                {!brand.isDefault && (
                  <button
                    onClick={() => handleSetDefault(brand)}
                    className="text-xs font-bold text-indigo-400 hover:text-indigo-300 transition-colors"
                  >
                    Set as Default
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit / Create Brand Kit Modal */}
      {editingBrand && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-neutral-900 border border-neutral-800 rounded-3xl max-w-2xl w-full p-8 text-white space-y-6 my-8">
            <h2 className="text-2xl font-bold">
              {isCreating ? "Create Brand Kit" : "Edit Brand Kit"}
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5 sm:col-span-2">
                <label className="text-xs font-bold text-neutral-400 uppercase">
                  Internal Kit Name (Workspace reference only)
                </label>
                <input
                  type="text"
                  value={editingBrand.name}
                  onChange={(e) => setEditingBrand({ ...editingBrand, name: e.target.value })}
                  placeholder="e.g. Modern Creator, Personal Brand, Client A"
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-neutral-400 uppercase">
                  Public Display Name (Printed on Slides)
                </label>
                <input
                  type="text"
                  value={editingBrand.displayName}
                  onChange={(e) => setEditingBrand({ ...editingBrand, displayName: e.target.value })}
                  placeholder="e.g. James Bonaguro"
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-neutral-400 uppercase">
                  Public Handle (Printed in Header/Footer)
                </label>
                <input
                  type="text"
                  value={editingBrand.handle}
                  onChange={(e) => setEditingBrand({ ...editingBrand, handle: e.target.value })}
                  placeholder="@yourhandle"
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-neutral-400 uppercase">Heading Font</label>
                <select
                  value={editingBrand.fontHeading}
                  onChange={(e) => setEditingBrand({ ...editingBrand, fontHeading: e.target.value })}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="Inter">Inter (Clean Modern Sans)</option>
                  <option value="System">System UI (Native Sans)</option>
                  <option value="Georgia">Georgia (Editorial Serif)</option>
                  <option value="Mono">Monospace (Technical)</option>
                  <option value="Helvetica">Helvetica (Classic Sans)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-neutral-400 uppercase">Body Font</label>
                <select
                  value={editingBrand.fontBody}
                  onChange={(e) => setEditingBrand({ ...editingBrand, fontBody: e.target.value })}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="Inter">Inter (Clean Modern Sans)</option>
                  <option value="System">System UI (Native Sans)</option>
                  <option value="Georgia">Georgia (Editorial Serif)</option>
                  <option value="Mono">Monospace (Technical)</option>
                  <option value="Helvetica">Helvetica (Classic Sans)</option>
                </select>
              </div>
            </div>

            {/* Colors Grid */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-neutral-400 uppercase">Color System</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 rounded-xl bg-neutral-950 border border-neutral-800 space-y-1.5">
                  <div className="text-[11px] font-bold text-neutral-400">Primary Color</div>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={editingBrand.primaryColor}
                      onChange={(e) => setEditingBrand({ ...editingBrand, primaryColor: e.target.value })}
                      className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border-0"
                    />
                    <input
                      type="text"
                      value={editingBrand.primaryColor}
                      onChange={(e) => setEditingBrand({ ...editingBrand, primaryColor: e.target.value })}
                      className="w-full text-xs font-mono bg-transparent text-white focus:outline-none"
                    />
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-neutral-950 border border-neutral-800 space-y-1.5">
                  <div className="text-[11px] font-bold text-neutral-400">Secondary Color</div>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={editingBrand.secondaryColor}
                      onChange={(e) => setEditingBrand({ ...editingBrand, secondaryColor: e.target.value })}
                      className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border-0"
                    />
                    <input
                      type="text"
                      value={editingBrand.secondaryColor}
                      onChange={(e) => setEditingBrand({ ...editingBrand, secondaryColor: e.target.value })}
                      className="w-full text-xs font-mono bg-transparent text-white focus:outline-none"
                    />
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-neutral-950 border border-neutral-800 space-y-1.5">
                  <div className="text-[11px] font-bold text-neutral-400">Accent Color</div>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={editingBrand.accentColor}
                      onChange={(e) => setEditingBrand({ ...editingBrand, accentColor: e.target.value })}
                      className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border-0"
                    />
                    <input
                      type="text"
                      value={editingBrand.accentColor}
                      onChange={(e) => setEditingBrand({ ...editingBrand, accentColor: e.target.value })}
                      className="w-full text-xs font-mono bg-transparent text-white focus:outline-none"
                    />
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-neutral-950 border border-neutral-800 space-y-1.5">
                  <div className="text-[11px] font-bold text-neutral-400">Background Color</div>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={editingBrand.bgColor}
                      onChange={(e) => setEditingBrand({ ...editingBrand, bgColor: e.target.value })}
                      className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border-0"
                    />
                    <input
                      type="text"
                      value={editingBrand.bgColor}
                      onChange={(e) => setEditingBrand({ ...editingBrand, bgColor: e.target.value })}
                      className="w-full text-xs font-mono bg-transparent text-white focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* AI Persona Voice Settings */}
            <div className="space-y-3">
              <label className="text-xs font-bold text-neutral-400 uppercase">AI Persona & Voice Guidelines</label>
              <div className="space-y-3">
                <div className="space-y-1">
                  <span className="text-xs text-neutral-400">Tone of Voice</span>
                  <input
                    type="text"
                    value={editingBrand.toneVoice}
                    onChange={(e) => setEditingBrand({ ...editingBrand, toneVoice: e.target.value })}
                    placeholder="e.g. Direct, punchy, insightful, authoritative"
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="space-y-1">
                  <span className="text-xs text-neutral-400">Target Audience</span>
                  <input
                    type="text"
                    value={editingBrand.targetAudience}
                    onChange={(e) => setEditingBrand({ ...editingBrand, targetAudience: e.target.value })}
                    placeholder="e.g. Founders, executives, high-growth creators"
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="space-y-1">
                  <span className="text-xs text-neutral-400">Banned Words (AI will avoid)</span>
                  <input
                    type="text"
                    value={editingBrand.bannedWords}
                    onChange={(e) => setEditingBrand({ ...editingBrand, bannedWords: e.target.value })}
                    placeholder="synergy, paradigm shift, delve, game changer"
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>
            </div>

            {/* Default toggle */}
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={editingBrand.isDefault}
                onChange={(e) => setEditingBrand({ ...editingBrand, isDefault: e.target.checked })}
                className="w-4 h-4 rounded text-indigo-600 focus:ring-0 cursor-pointer"
              />
              <span className="text-sm font-semibold text-neutral-300">Set as default brand kit</span>
            </label>

            {/* Modal Buttons */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-neutral-800">
              <button
                onClick={() => {
                  setEditingBrand(null);
                  setIsCreating(false);
                }}
                className="px-5 py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-sm font-bold text-neutral-300 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleSave(editingBrand)}
                className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-sm font-bold text-white shadow-lg shadow-indigo-600/20 transition-all"
              >
                Save Brand Kit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
