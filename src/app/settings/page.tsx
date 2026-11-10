"use client";

import React, { useEffect, useState } from "react";
import { Settings, Cloud, Key, Check, Save, Sparkles } from "lucide-react";

export default function SettingsPage() {
  const [settings, setSettings] = useState<Record<string, string>>({
    gdrive_export_path:
      "/Users/jamesbonaguro/Library/CloudStorage/GoogleDrive-james.bonaguro@gmail.com/My Drive/GramCraft Exports",
    ai_provider: "gemini",
    gemini_api_key: "",
    openai_api_key: "",
    anthropic_api_key: "",
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    fetch("/api/settings")
      .then((res) => res.json())
      .then((data) => {
        if (data && typeof data === "object") {
          setSettings((prev) => ({ ...prev, ...data }));
        }
      })
      .catch((err) => console.error("Error fetching settings:", err))
      .finally(() => setIsLoading(false));
  }, []);

  const handleSave = async () => {
    try {
      setIsSaving(true);
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });

      if (!res.ok) throw new Error("Failed to save settings");

      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 2500);
    } catch (err) {
      alert("Error saving settings: " + String(err));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-6 py-10 w-full space-y-10 text-white">
      {/* Header */}
      <div className="border-b border-neutral-800 pb-6 flex items-center justify-between">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-bold uppercase tracking-wider mb-2">
            <Settings className="w-3.5 h-3.5" /> Workspace Configuration
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight">App Settings</h1>
          <p className="text-neutral-400 text-sm mt-1">
            Configure Google Drive export paths and pluggable AI providers.
          </p>
        </div>

        <button
          onClick={handleSave}
          disabled={isSaving}
          className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold shadow-lg shadow-indigo-600/20 transition-all disabled:opacity-50"
        >
          {savedSuccess ? (
            <>
              <Check className="w-4 h-4 text-emerald-400" />
              <span>Saved!</span>
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              <span>Save Changes</span>
            </>
          )}
        </button>
      </div>

      {isLoading ? (
        <div className="text-center py-16 text-neutral-500">Loading settings...</div>
      ) : (
        <div className="space-y-8">
          {/* Section 1: Google Drive Sync Directory */}
          <div className="p-8 rounded-3xl bg-neutral-900/60 border border-neutral-800 space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <Cloud className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold">Google Drive Auto-Sync Path</h2>
                <p className="text-xs text-neutral-400">
                  Direct local filesystem export path into your mounted macOS Google Drive directory.
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-neutral-400 uppercase tracking-wider">
                Mounted Export Directory
              </label>
              <input
                type="text"
                value={settings.gdrive_export_path || ""}
                onChange={(e) => setSettings({ ...settings, gdrive_export_path: e.target.value })}
                placeholder="/Users/.../GoogleDrive-.../My Drive/GramCraft Exports"
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3 text-sm text-neutral-200 font-mono focus:outline-none focus:border-emerald-500"
              />
              <p className="text-xs text-neutral-500">
                Whenever you export, slides, scripts, captions, and hashtags are saved here into organized brand and date folders, syncing automatically to the cloud.
              </p>
            </div>
          </div>

          {/* Section 2: AI Provider & API Keys */}
          <div className="p-8 rounded-3xl bg-neutral-900/60 border border-neutral-800 space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                <Key className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold">AI Engine & API Keys</h2>
                <p className="text-xs text-neutral-400">
                  Google Gemini powers high-speed structured generation. You can also configure OpenAI or Anthropic.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5 sm:col-span-2">
                <label className="text-xs font-bold text-neutral-400 uppercase tracking-wider">
                  Primary AI Provider
                </label>
                <select
                  value={settings.ai_provider || "gemini"}
                  onChange={(e) => setSettings({ ...settings, ai_provider: e.target.value })}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none"
                >
                  <option value="gemini">Google Gemini (Gemini 2.0 Flash / Pro) — Recommended</option>
                  <option value="openai">OpenAI (GPT-4o / GPT-4o-mini)</option>
                  <option value="anthropic">Anthropic (Claude 3.5 Sonnet)</option>
                </select>
              </div>

              <div className="space-y-1.5 sm:col-span-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-neutral-400 uppercase tracking-wider">
                    Google Gemini API Key
                  </label>
                  <span className="text-[11px] text-indigo-400 font-medium">Recommended for speed & context</span>
                </div>
                <input
                  type="password"
                  value={settings.gemini_api_key || ""}
                  onChange={(e) => setSettings({ ...settings, gemini_api_key: e.target.value })}
                  placeholder="AIzaSy..."
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3 text-sm text-white font-mono focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-neutral-400 uppercase tracking-wider">
                  OpenAI API Key (Optional)
                </label>
                <input
                  type="password"
                  value={settings.openai_api_key || ""}
                  onChange={(e) => setSettings({ ...settings, openai_api_key: e.target.value })}
                  placeholder="sk-..."
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3 text-sm text-white font-mono focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-neutral-400 uppercase tracking-wider">
                  Anthropic API Key (Optional)
                </label>
                <input
                  type="password"
                  value={settings.anthropic_api_key || ""}
                  onChange={(e) => setSettings({ ...settings, anthropic_api_key: e.target.value })}
                  placeholder="sk-ant-..."
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3 text-sm text-white font-mono focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-indigo-950/20 border border-indigo-500/20 flex items-start gap-3 text-xs text-indigo-300">
              <Sparkles className="w-4 h-4 shrink-0 mt-0.5" />
              <span>
                Note: Even without entering an API key immediately, GramCraft includes built-in viral generation templates and smart fallbacks so you can test and preview all carousels and reels instantly.
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
