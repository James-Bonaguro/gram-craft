import prisma from "../prisma";
import { ReelHookData, SlideType } from "@/types";

export interface GenerateCarouselParams {
  input: string;
  inputMode: "PROMPT" | "REPURPOSE" | "HOOK_FORMULA";
  brandName?: string;
  toneVoice?: string;
  targetAudience?: string;
  bannedWords?: string;
  slideCount?: number;
  isDemo?: boolean;
}

export interface GeneratedCarouselResponse {
  title: string;
  caption: string;
  hashtags: string;
  slides: Array<{
    order: number;
    slideType: "COVER" | "CONTENT" | "QUOTE" | "COMPARISON" | "CTA";
    badgeText?: string;
    headline: string;
    subheadline?: string;
    bodyText?: string;
    bulletPoints?: string[];
    quoteAuthor?: string;
  }>;
}

export interface GenerateReelParams {
  input: string;
  inputMode: "PROMPT" | "REPURPOSE" | "HOOK_FORMULA";
  brandName?: string;
  toneVoice?: string;
  targetAudience?: string;
  bannedWords?: string;
  isDemo?: boolean;
}

export interface GeneratedReelResponse {
  title: string;
  caption: string;
  hashtags: string;
  hooks: ReelHookData[];
  beats: Array<{
    order: number;
    beatType: "HOOK" | "BODY" | "TRANSITION" | "CTA";
    visualCue: string;
    spokenAudio: string;
    onScreenText?: string;
    estimatedSeconds: number;
  }>;
}

async function getApiKey(): Promise<{ key: string | null; provider: string }> {
  const keySetting = await prisma.appSetting.findUnique({
    where: { key: "gemini_api_key" },
  });
  const providerSetting = await prisma.appSetting.findUnique({
    where: { key: "ai_provider" },
  });

  const rawKey = keySetting?.value?.trim() || process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || null;
  const key = rawKey && !rawKey.includes("...") && rawKey !== "********" ? rawKey : null;
  const provider = providerSetting?.value || "gemini";

  return { key, provider };
}

function validateCarouselData(data: unknown): GeneratedCarouselResponse {
  if (!data || typeof data !== "object") {
    throw new Error("Invalid AI response: Expected a JSON object.");
  }
  const obj = data as Record<string, unknown>;
  if (!obj.title || typeof obj.title !== "string") {
    throw new Error("Invalid AI response: Missing 'title' field.");
  }
  if (!Array.isArray(obj.slides) || obj.slides.length === 0) {
    throw new Error("Invalid AI response: 'slides' must be a non-empty array.");
  }

  const validSlides = obj.slides.map((s: unknown, idx: number) => {
    if (!s || typeof s !== "object") {
      throw new Error(`Invalid AI response: Slide ${idx + 1} must be an object.`);
    }
    const slideObj = s as Record<string, unknown>;
    if (!slideObj.headline || typeof slideObj.headline !== "string") {
      throw new Error(`Invalid AI response: Slide ${idx + 1} is missing a headline.`);
    }
    const order = typeof slideObj.order === "number" ? slideObj.order : idx + 1;
    const allowedTypes = ["COVER", "CONTENT", "QUOTE", "COMPARISON", "CTA"] as const;
    const slideType =
      typeof slideObj.slideType === "string" && (allowedTypes as readonly string[]).includes(slideObj.slideType)
        ? (slideObj.slideType as SlideType)
        : "CONTENT";

    return {
      order,
      slideType,
      badgeText: typeof slideObj.badgeText === "string" ? slideObj.badgeText : undefined,
      headline: String(slideObj.headline),
      subheadline: typeof slideObj.subheadline === "string" ? slideObj.subheadline : undefined,
      bodyText: typeof slideObj.bodyText === "string" ? slideObj.bodyText : undefined,
      bulletPoints: Array.isArray(slideObj.bulletPoints) ? slideObj.bulletPoints.map(String) : [],
      quoteAuthor: typeof slideObj.quoteAuthor === "string" ? slideObj.quoteAuthor : undefined,
    };
  });

  return {
    title: String(obj.title),
    caption: typeof obj.caption === "string" ? obj.caption : "",
    hashtags: typeof obj.hashtags === "string" ? obj.hashtags : "",
    slides: validSlides,
  };
}

function validateReelData(data: unknown): GeneratedReelResponse {
  if (!data || typeof data !== "object") {
    throw new Error("Invalid AI response: Expected a JSON object.");
  }
  const obj = data as Record<string, unknown>;
  if (!obj.title || typeof obj.title !== "string") {
    throw new Error("Invalid AI response: Missing 'title' field.");
  }
  if (!Array.isArray(obj.beats) || obj.beats.length === 0) {
    throw new Error("Invalid AI response: 'beats' must be a non-empty array.");
  }

  const hooks: ReelHookData[] = Array.isArray(obj.hooks)
    ? obj.hooks.map((h: unknown, idx: number) => {
        if (h && typeof h === "object") {
          const hObj = h as Record<string, unknown>;
          return {
            text: String(hObj.text || `Hook option ${idx + 1}`),
            angle: String(hObj.angle || `Angle ${idx + 1}`),
          };
        }
        return {
          text: String(h || `Hook option ${idx + 1}`),
          angle: `Angle ${idx + 1}`,
        };
      })
    : [{ text: String(obj.title), angle: "Direct Hook" }];

  const validBeats = obj.beats.map((b: unknown, idx: number) => {
    if (!b || typeof b !== "object") {
      throw new Error(`Invalid AI response: Beat ${idx + 1} must be an object.`);
    }
    const bObj = b as Record<string, unknown>;
    const order = typeof bObj.order === "number" ? bObj.order : idx + 1;
    const allowedTypes = ["HOOK", "BODY", "TRANSITION", "CTA"] as const;
    const beatType =
      typeof bObj.beatType === "string" && (allowedTypes as readonly string[]).includes(bObj.beatType)
        ? (bObj.beatType as "HOOK" | "BODY" | "TRANSITION" | "CTA")
        : "BODY";

    return {
      order,
      beatType,
      visualCue: typeof bObj.visualCue === "string" ? bObj.visualCue : "Direct to camera",
      spokenAudio: typeof bObj.spokenAudio === "string" ? bObj.spokenAudio : "",
      onScreenText: typeof bObj.onScreenText === "string" ? bObj.onScreenText : undefined,
      estimatedSeconds: typeof bObj.estimatedSeconds === "number" ? bObj.estimatedSeconds : 5,
    };
  });

  return {
    title: String(obj.title),
    caption: typeof obj.caption === "string" ? obj.caption : "",
    hashtags: typeof obj.hashtags === "string" ? obj.hashtags : "",
    hooks,
    beats: validBeats,
  };
}

export async function generateCarousel(params: GenerateCarouselParams): Promise<GeneratedCarouselResponse> {
  // If explicitly requested demo generation
  if (params.isDemo) {
    return generateFallbackCarousel(params);
  }

  const { key } = await getApiKey();
  if (!key) {
    throw new Error(
      "No Gemini API key configured. Please enter your API key in Settings, or enable 'Use Demo Template' for sample generation."
    );
  }

  const count = params.slideCount || 6;
  const prompt = `You are an Instagram Carousel copywriter and structured content designer.
Brand Voice: ${params.toneVoice || "Direct, insightful, punchy"}
Target Audience: ${params.targetAudience || "Creators, operators, and professionals"}
Banned Words (DO NOT USE): ${params.bannedWords || "synergy, paradigm, delve, crucial"}
Input Mode: ${params.inputMode}
Topic / Content Input:
"""
${params.input}
"""

Create an Instagram Carousel with exactly ${count} slides.
Requirements:
- Slide 1 MUST be a COVER slide with a curiosity-inducing hook and badgeText (e.g. "Swipe ➔", "Guide", "Framework").
- Slides 2 to ${count - 1} MUST be CONTENT, COMPARISON, or QUOTE slides. Keep text concise and punchy. Include bulletPoints where relevant.
- Slide ${count} MUST be a CALL_TO_ACTION (CTA) slide (e.g. "Save this for later", "Follow for more").
- Provide an Instagram caption with clean paragraph spacing and 10-15 relevant hashtags.

Return ONLY a valid JSON object matching this schema without markdown fences:
{
  "title": "Descriptive title",
  "caption": "Full Instagram caption text",
  "hashtags": "#instagram #growth ...",
  "slides": [
    {
      "order": 1,
      "slideType": "COVER",
      "badgeText": "Short category or swipe cue",
      "headline": "Bold Headline",
      "subheadline": "Supporting one-liner",
      "bodyText": "Concise context",
      "bulletPoints": [],
      "quoteAuthor": ""
    }
  ]
}`;

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${key}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          responseMimeType: "application/json",
          temperature: 0.7,
        },
      }),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Gemini API error (${response.status}): ${errorText}`);
  }

  const data = await response.json();
  const jsonText = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!jsonText) {
    throw new Error("Gemini API returned an empty response.");
  }

  try {
    const parsed = JSON.parse(jsonText);
    return validateCarouselData(parsed);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    throw new Error(`Failed to parse AI-generated carousel: ${message}`);
  }
}

export async function generateReel(params: GenerateReelParams): Promise<GeneratedReelResponse> {
  // If explicitly requested demo generation
  if (params.isDemo) {
    return generateFallbackReel(params);
  }

  const { key } = await getApiKey();
  if (!key) {
    throw new Error(
      "No Gemini API key configured. Please enter your API key in Settings, or enable 'Use Demo Template' for sample generation."
    );
  }

  const prompt = `You are an Instagram Reels scriptwriter and pacing coordinator.
Brand Voice: ${params.toneVoice || "Direct, energetic, authentic"}
Target Audience: ${params.targetAudience || "Ambitious builders, creators, and professionals"}
Banned Words: ${params.bannedWords || "synergy, revolutionary, delve"}
Input Mode: ${params.inputMode}
Topic / Content Input:
"""
${params.input}
"""

Generate a structured Reel storyboard and script.
Requirements:
- 3 Hook variants with descriptive creative angles (e.g. "Contrarian Angle", "Curiosity Angle", "Common Mistake Angle"). Do NOT invent fake retention percentages or performance claims.
- 5 to 7 shot-by-shot beats.
- Beat 1 is HOOK (0-3s).
- Beats 2-5 are high-pacing BODY beats with exact visual cues (what camera sees, B-roll, props) and spoken dialogue.
- Final beat is CALL TO ACTION (CTA).
- On-screen text for each beat (punchy 3-5 words).
- Complete Instagram caption with line breaks and hashtags.

Return ONLY a valid JSON object matching this schema without markdown fences:
{
  "title": "Descriptive title",
  "caption": "Full Instagram caption",
  "hashtags": "#reels #creator ...",
  "hooks": [
    { "text": "Hook 1 script", "angle": "Contrarian Angle" },
    { "text": "Hook 2 script", "angle": "Curiosity Angle" },
    { "text": "Hook 3 script", "angle": "Direct How-To Angle" }
  ],
  "beats": [
    {
      "order": 1,
      "beatType": "HOOK",
      "visualCue": "Direct to camera, medium-close",
      "spokenAudio": "Spoken dialogue here.",
      "onScreenText": "TEXT OVERLAY",
      "estimatedSeconds": 4
    }
  ]
}`;

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${key}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          responseMimeType: "application/json",
          temperature: 0.7,
        },
      }),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Gemini API error (${response.status}): ${errorText}`);
  }

  const data = await response.json();
  const jsonText = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!jsonText) {
    throw new Error("Gemini API returned an empty response.");
  }

  try {
    const parsed = JSON.parse(jsonText);
    return validateReelData(parsed);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    throw new Error(`Failed to parse AI-generated reel: ${message}`);
  }
}

function generateFallbackCarousel(params: GenerateCarouselParams): GeneratedCarouselResponse {
  const cleanInput = params.input.replace(/[\n\r]+/g, " ").trim();
  const rawTitle = cleanInput.slice(0, 40) || "5 Rules Every Creator Needs";
  const title = `[Demo] ${rawTitle}`;

  return {
    title,
    caption: `Most people overcomplicate this.\n\nHere is a structured breakdown you can reference.\n\nSave this post so you have it when you need it.\n\nWhich slide resonated most with you? Let me know below 👇`,
    hashtags: "#growthmindset #contentcreation #creators #instagramstrategy #productivity #buildinpublic",
    slides: [
      {
        order: 1,
        slideType: "COVER",
        badgeText: "Framework ➔",
        headline: cleanInput || "The Unpopular Truth About Sustainable Growth",
        subheadline: "Swipe to see the 5 principles nobody talks about.",
        bodyText: "Most people focus on the wrong 80%. Here is the real 20% that moves the needle.",
        bulletPoints: [],
      },
      {
        order: 2,
        slideType: "CONTENT",
        badgeText: "Principle 01",
        headline: "Focus on Velocity Over Perfection",
        subheadline: "Speed of execution beats perfection every time.",
        bodyText: "Ship the 80% version and let real feedback dictate the next iteration. Momentum is your most valuable asset.",
        bulletPoints: [
          "Ship the 80% version today",
          "Let real feedback dictate the next iteration",
          "Momentum is your most valuable asset",
        ],
      },
      {
        order: 3,
        slideType: "COMPARISON",
        badgeText: "Myth vs Reality",
        headline: "Amateurs Guess. Pros Build Systems.",
        subheadline: "The difference between erratic results and compound growth.",
        bodyText: "Stop reinventing the wheel every session. Build reusable templates and clear routines.",
        bulletPoints: [
          "Amateur: Relies on random motivation",
          "Professional: Follows a scheduled ritual",
          "Amateur: Starts from a blank canvas",
          "Professional: Refines proven frameworks",
        ],
      },
      {
        order: 4,
        slideType: "QUOTE",
        badgeText: "Key Insight",
        headline: "“Consistency is only hard when you haven't engineered the friction out of your process.”",
        subheadline: "Design your workflow so starting takes seconds.",
        bodyText: "When creation takes minutes instead of hours, you don't need willpower to stay consistent.",
        quoteAuthor: params.brandName || "Creator",
        bulletPoints: [],
      },
      {
        order: 5,
        slideType: "CONTENT",
        badgeText: "Principle 02",
        headline: "Own Your Assets & Workflows",
        subheadline: "Never build your entire foundation on rented land.",
        bodyText: "Social algorithms change constantly. Direct exports, local asset archives, and clean files protect your work.",
        bulletPoints: [
          "Keep high-res master exports of every post",
          "Sync directly to your local archives",
          "Repurpose single ideas across multiple mediums",
        ],
      },
      {
        order: 6,
        slideType: "CTA",
        badgeText: "Action Steps",
        headline: "Save This For Your Next Creation Session",
        subheadline: "Share with someone who needs this today.",
        bodyText: "Hit the save icon below to reference these frameworks. Follow for weekly breakdowns on execution and strategy.",
        bulletPoints: [
          "Save this post 🔖",
          "Share to your story ↗️",
          "Drop a comment with your thoughts 👇",
        ],
      },
    ],
  };
}

function generateFallbackReel(params: GenerateReelParams): GeneratedReelResponse {
  const cleanInput = params.input.replace(/[\n\r]+/g, " ").trim();
  const topic = cleanInput.slice(0, 35) || "Content Systems";
  const title = `[Demo] ${topic}`;

  return {
    title,
    caption: `If you want to scale your output without burning out, here is the breakdown.\n\nDrop a comment with 'SYSTEM' and I'll send you our complete workflow checklist. 🚀`,
    hashtags: "#reelsvideo #creatoreconomy #instagramtips #businesstips #workflow #productivitytips",
    hooks: [
      { text: `Stop making this common mistake with ${topic}:`, angle: "Mistake Hook" },
      { text: `The single biggest misconception about ${topic}:`, angle: "Contrarian Hook" },
      { text: `How to build a streamlined workflow for ${topic} in 3 steps:`, angle: "How-To Hook" },
    ],
    beats: [
      {
        order: 1,
        beatType: "HOOK",
        visualCue: "Direct to camera, medium-close, slight zoom-in, energetic delivery",
        spokenAudio: `If you are still struggling with ${topic}, here is the one thing you need to rethink.`,
        onScreenText: "STOP DOING THIS 🛑",
        estimatedSeconds: 4,
      },
      {
        order: 2,
        beatType: "BODY",
        visualCue: "Cut to side-angle B-roll typing at desk or pointing to screen",
        spokenAudio: "Most people think they have a time problem. But the truth is, you have a friction problem.",
        onScreenText: "IT'S A FRICTION PROBLEM ⏳",
        estimatedSeconds: 5,
      },
      {
        order: 3,
        beatType: "BODY",
        visualCue: "Screen recording / high-contrast graphic showing the 3-step workflow",
        spokenAudio: "Top creators build templated design systems and automated local export from day one.",
        onScreenText: "BUILD THE SYSTEM ⚙️",
        estimatedSeconds: 6,
      },
      {
        order: 4,
        beatType: "BODY",
        visualCue: "Back to talking head with snappy hands-on gestures",
        spokenAudio: "When every slide and reel beat is structured before you hit record, creation takes minutes instead of hours.",
        onScreenText: "MINUTES, NOT HOURS ⚡",
        estimatedSeconds: 5,
      },
      {
        order: 5,
        beatType: "CTA",
        visualCue: "Point down towards the comment section with confident delivery",
        spokenAudio: "Comment the word 'SYSTEM' below, and I'll send you our step-by-step setup guide for free.",
        onScreenText: "COMMENT 'SYSTEM' 👇",
        estimatedSeconds: 4,
      },
    ],
  };
}
