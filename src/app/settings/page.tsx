"use client";

import React, { useEffect, useState } from "react";
import { Settings, Folder, Key, Check, Save, Info } from "lucide-react";

export default function SettingsPage() {
  const [settings, setSettings] = useState<Record<string, string>>({
    gdrive_export_path:
      "/Users/jamesbonaguro/Library/CloudStorage/GoogleDrive-james.bonaguro@gmail.com/My Drive/GramCraft Exports",
    ai_provider: "gemini",
    gemini_api_key: "",
    has_gemini_api_key: "false",
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

      // Re-fetch to refresh masked state
      const refreshed = await fetch("/api/settings").then((r) => r.json());
      if (refreshed && typeof refreshed === "object") {
        setSettings((prev) => ({ ...prev, ...refreshed }));
      }
    } catch (err) {
      alert("Error saving settings: " + String(err));
    } finally {
      setIsSaving(false);
    }
  };

  const isKeyConfigured = settings.has_gemini_api_key === "true";

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
            Configure your local export folder destination and AI credentials.
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
          {/* Section 1: Local Export Folder */}
          <div className="p-8 rounded-3xl bg-neutral-900/60 border border-neutral-800 space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <Folder className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold">Local Export Directory</h2>
                <p className="text-xs text-neutral-400">
                  Local filesystem folder where slide PNGs, reel scripts, and caption text are saved.
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-neutral-400 uppercase tracking-wider">
                Export Destination Path
              </label>
              <input
                type="text"
                value={settings.gdrive_export_path || ""}
                onChange={(e) => setSettings({ ...settings, gdrive_export_path: e.target.value })}
                placeholder="/Users/.../GoogleDrive-.../My Drive/GramCraft Exports"
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3 text-sm text-neutral-200 font-mono focus:outline-none focus:border-emerald-500"
              />
              <p className="text-xs text-neutral-400 leading-relaxed">
                GramCraft writes files directly to this local disk path. If you point this to your mounted Google Drive folder (e.g. inside <code className="text-neutral-300">~/Library/CloudStorage/...</code>), the Google Drive desktop client will automatically sync the exported files to the cloud in the background.
              </p>
            </div>
          </div>

          {/* Section 2: AI Engine & API Keys */}
          <div className="p-8 rounded-3xl bg-neutral-900/60 border border-neutral-800 space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                <Key className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold">AI Provider & Credentials</h2>
                <p className="text-xs text-neutral-400">
                  Google Gemini powers live copy generation, reel scripts, and structured formatting.
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-neutral-400 uppercase tracking-wider">
                  Active Provider
                </label>
                <div className="p-3 bg-neutral-950 border border-neutral-800 rounded-xl text-sm text-white font-medium flex items-center justify-between">
                  <span>Google Gemini (gemini-2.0-flash)</span>
                  <span className="text-xs text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/30 font-semibold">
                    Supported
                  </span>
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-neutral-400 uppercase tracking-wider">
                    Google Gemini API Key
                  </label>
                  {isKeyConfigured ? (
                    <span className="text-xs text-emerald-400 flex items-center gap-1 font-semibold">
                      <Check className="w-3.5 h-3.5" /> Key Saved
                    </span>
                  ) : (
                    <span className="text-xs text-amber-400 font-medium">Key Not Configured</span>
                  )}
                </div>
                <input
                  type="password"
                  value={settings.gemini_api_key || ""}
                  onChange={(e) => setSettings({ ...settings, gemini_api_key: e.target.value })}
                  placeholder={isKeyConfigured ? "Enter new key to replace existing" : "AIzaSy..."}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3 text-sm text-white font-mono focus:outline-none focus:border-indigo-500"
                />
                <p className="text-xs text-neutral-500">
                  Stored keys are kept local in SQLite and masked in API responses.
                </p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-neutral-950/80 border border-neutral-800 flex items-start gap-3 text-xs text-neutral-300">
              <Info className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
              <span>
                <strong>Demo Mode Available</strong>: If no Gemini API key is configured or you wish to work offline, select <strong>&quot;Use Demo Template&quot;</strong> in the studio to populate sample slide decks and storyboard layouts without making live API calls.
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
