"use client";

import React, { useState, useEffect, useRef } from "react";
import { ReelBeatData } from "@/types";
import { Play, Pause, RotateCcw, X, Video, Timer } from "lucide-react";

interface TeleprompterModalProps {
  beats: ReelBeatData[];
  title: string;
  isOpen: boolean;
  onClose: () => void;
}

export function TeleprompterModal({ beats, title, isOpen, onClose }: TeleprompterModalProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [wpm, setWpm] = useState(130);
  const [fontSize, setFontSize] = useState(48); // in px
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isMirrored, setIsMirrored] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Timer loop
  useEffect(() => {
    if (isPlaying) {
      timerRef.current = setInterval(() => {
        setElapsedSeconds((prev) => prev + 1);
      }, 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying]);

  // Teleprompter auto-scroll loop
  useEffect(() => {
    let animationFrameId: number;

    const scroll = () => {
      if (isPlaying && scrollRef.current) {
        // Calculate pixels per frame based on WPM (roughly 5 chars per word)
        const pixelsPerSecond = (wpm / 60) * (fontSize * 0.7);
        scrollRef.current.scrollTop += pixelsPerSecond / 60;
      }
      animationFrameId = requestAnimationFrame(scroll);
    };

    if (isPlaying) {
      animationFrameId = requestAnimationFrame(scroll);
    }

    return () => cancelAnimationFrame(animationFrameId);
  }, [isPlaying, wpm, fontSize]);

  if (!isOpen) return null;

  const resetAll = () => {
    setIsPlaying(false);
    setElapsedSeconds(0);
    if (scrollRef.current) {
      scrollRef.current.scrollTop = 0;
    }
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  return (
    <div className="fixed inset-0 z-50 bg-black text-white flex flex-col font-sans select-none">
      {/* Top Teleprompter Controls Header */}
      <div className="flex items-center justify-between px-8 py-5 border-b border-neutral-800 bg-neutral-950/90 backdrop-blur-md z-20">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-red-500 animate-pulse" />
            <h2 className="text-xl font-bold truncate max-w-sm">{title || "Reel Teleprompter"}</h2>
          </div>

          {/* Running Timer & Pacing Milestones */}
          <div className="flex items-center gap-3 bg-neutral-900 border border-neutral-800 px-4 py-2 rounded-xl">
            <Timer className="w-5 h-5 text-amber-400" />
            <span className="font-mono text-2xl font-bold text-white">{formatTime(elapsedSeconds)}</span>
            <div className="flex items-center gap-1.5 ml-2 text-xs font-semibold">
              <span
                className={`px-2 py-0.5 rounded ${
                  elapsedSeconds <= 15 ? "bg-emerald-500/20 text-emerald-400" : "text-neutral-500"
                }`}
              >
                15s Hook
              </span>
              <span
                className={`px-2 py-0.5 rounded ${
                  elapsedSeconds > 15 && elapsedSeconds <= 30
                    ? "bg-blue-500/20 text-blue-400"
                    : "text-neutral-500"
                }`}
              >
                30s Sweet Spot
              </span>
              <span
                className={`px-2 py-0.5 rounded ${
                  elapsedSeconds > 30 && elapsedSeconds <= 60
                    ? "bg-purple-500/20 text-purple-400"
                    : "text-neutral-500"
                }`}
              >
                60s Max
              </span>
            </div>
          </div>
        </div>

        {/* Center Playback Controls */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-lg transition-all ${
              isPlaying
                ? "bg-amber-500 hover:bg-amber-400 text-black shadow-lg shadow-amber-500/20"
                : "bg-emerald-500 hover:bg-emerald-400 text-black shadow-lg shadow-emerald-500/20"
            }`}
          >
            {isPlaying ? <Pause className="w-6 h-6 fill-current" /> : <Play className="w-6 h-6 fill-current" />}
            <span>{isPlaying ? "Pause" : "Start Prompter"}</span>
          </button>

          <button
            onClick={resetAll}
            className="p-2.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-neutral-300 transition-colors"
            title="Reset to Start"
          >
            <RotateCcw className="w-5 h-5" />
          </button>
        </div>

        {/* Right Settings */}
        <div className="flex items-center gap-6">
          {/* Speed slider */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-neutral-400">SPEED:</span>
            <input
              type="range"
              min="80"
              max="240"
              step="10"
              value={wpm}
              onChange={(e) => setWpm(Number(e.target.value))}
              className="w-24 accent-amber-500 cursor-pointer"
            />
            <span className="font-mono text-sm font-semibold w-12 text-right">{wpm} WPM</span>
          </div>

          {/* Font Size controls */}
          <div className="flex items-center gap-1 bg-neutral-900 border border-neutral-800 rounded-xl p-1">
            <button
              onClick={() => setFontSize((s) => Math.max(28, s - 4))}
              className="px-2.5 py-1 text-sm font-bold text-neutral-300 hover:bg-neutral-800 rounded-lg"
            >
              A-
            </button>
            <span className="text-xs text-neutral-500 px-1 font-mono">{fontSize}px</span>
            <button
              onClick={() => setFontSize((s) => Math.min(80, s + 4))}
              className="px-2.5 py-1 text-sm font-bold text-neutral-300 hover:bg-neutral-800 rounded-lg"
            >
              A+
            </button>
          </div>

          {/* Mirror toggle */}
          <button
            onClick={() => setIsMirrored(!isMirrored)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
              isMirrored ? "bg-indigo-600 text-white" : "bg-neutral-900 text-neutral-400 hover:text-white"
            }`}
          >
            Mirror {isMirrored ? "ON" : "OFF"}
          </button>

          {/* Close */}
          <button
            onClick={onClose}
            className="p-2 text-neutral-400 hover:text-white rounded-xl hover:bg-neutral-900 transition-colors"
          >
            <X className="w-7 h-7" />
          </button>
        </div>
      </div>

      {/* Main Scrolling Text Stage */}
      <div
        ref={scrollRef}
        style={{
          transform: isMirrored ? "scaleX(-1)" : "none",
        }}
        className="flex-1 overflow-y-auto px-16 py-32 space-y-24 scroll-smooth"
      >
        <div className="max-w-4xl mx-auto space-y-20">
          {beats.map((beat) => (
            <div
              key={beat.order}
              className="p-8 rounded-3xl bg-neutral-900/60 border border-neutral-800/80 space-y-6"
            >
              {/* Cue banner */}
              <div className="flex items-center justify-between text-base">
                <div className="flex items-center gap-3">
                  <span className="px-3.5 py-1 rounded-full text-xs font-black tracking-wider uppercase bg-amber-500/20 text-amber-400 border border-amber-500/30">
                    Beat 0{beat.order}: {beat.beatType}
                  </span>
                  <span className="text-neutral-400 font-mono text-sm">~{beat.estimatedSeconds}s</span>
                </div>

                {beat.onScreenText && (
                  <div className="flex items-center gap-2 bg-indigo-500/20 border border-indigo-500/40 px-3.5 py-1 rounded-full text-indigo-300 text-xs font-bold uppercase">
                    <span>OVERLAY:</span>
                    <span className="text-white">{beat.onScreenText}</span>
                  </div>
                )}
              </div>

              {/* Visual Cue Alert */}
              <div className="flex items-start gap-3 p-4 rounded-xl bg-neutral-950/80 border border-neutral-800 text-neutral-400 text-lg">
                <Video className="w-6 h-6 text-indigo-400 shrink-0 mt-0.5" />
                <span><strong className="text-indigo-300">Action Cue:</strong> {beat.visualCue}</span>
              </div>

              {/* Large Spoken Dialogue */}
              <div
                style={{ fontSize: `${fontSize}px`, lineHeight: 1.35 }}
                className="font-extrabold text-white tracking-tight leading-snug"
              >
                {beat.spokenAudio}
              </div>
            </div>
          ))}

          {/* End padding for smooth finish */}
          <div className="h-96 flex items-center justify-center text-neutral-600 font-bold text-2xl uppercase tracking-widest">
            — End of Reel Script —
          </div>
        </div>
      </div>
    </div>
  );
}
