import prisma from "../prisma";

export interface GenerateCarouselParams {
  input: string;
  inputMode: "PROMPT" | "REPURPOSE" | "HOOK_FORMULA";
  brandName?: string;
  toneVoice?: string;
  targetAudience?: string;
  bannedWords?: string;
  slideCount?: number;
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
}

export interface GeneratedReelResponse {
  title: string;
  caption: string;
  hashtags: string;
  hooks: Array<{ text: string; score: number }>;
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
  // Check DB settings first
  const keySetting = await prisma.appSetting.findUnique({
    where: { key: "gemini_api_key" },
  });
  const providerSetting = await prisma.appSetting.findUnique({
    where: { key: "ai_provider" },
  });

  const key = keySetting?.value || process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || null;
  const provider = providerSetting?.value || "gemini";

  return { key, provider };
}

export async function generateCarousel(params: GenerateCarouselParams): Promise<GeneratedCarouselResponse> {
  const { key } = await getApiKey();

  const count = params.slideCount || 6;
  const prompt = `You are a world-class Instagram Carousel designer and copywriter.
Brand Voice: ${params.toneVoice || "Direct, insightful, punchy"}
Target Audience: ${params.targetAudience || "Creators, operators, and professionals"}
Banned Words (DO NOT USE): ${params.bannedWords || "synergy, paradigm, delve, crucial"}
Input Mode: ${params.inputMode}
Topic / Content Input:
"""
${params.input}
"""

Create an engaging Instagram Carousel with exactly ${count} slides.
Requirements:
- Slide 1 MUST be a high-converting COVER slide with a curiosity-inducing hook and badgeText (e.g. "Swipe ➔", "Must Read", "Cheat Sheet").
- Slides 2 to ${count - 1} MUST be high-value CONTENT, COMPARISON, or QUOTE slides. Keep text concise, punchy, and formatted with bulletPoints when appropriate.
- Slide ${count} MUST be a clear CALL_TO_ACTION slide (e.g. "Save this for later", "Share with someone who needs this", "Follow for more").
- Provide an Instagram caption with clean paragraph spacing and 10-15 relevant hashtags.

Return ONLY a valid JSON object matching this TypeScript interface without markdown fences:
{
  "title": "Short descriptive title",
  "caption": "Full Instagram caption text",
  "hashtags": "#instagram #growth ...",
  "slides": [
    {
      "order": 1,
      "slideType": "COVER",
      "badgeText": "Mini tag or category",
      "headline": "Bold Hook Headline",
      "subheadline": "Supporting one-liner",
      "bodyText": "Optional context",
      "bulletPoints": []
    }
  ]
}`;

  if (key) {
    try {
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

      if (response.ok) {
        const data = await response.json();
        const jsonText = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (jsonText) {
          return JSON.parse(jsonText);
        }
      }
    } catch (err) {
      console.error("Gemini API call error, falling back to smart generator:", err);
    }
  }

  // High-fidelity fallback / demo generator if API key is not yet set
  return generateFallbackCarousel(params);
}

export async function generateReel(params: GenerateReelParams): Promise<GeneratedReelResponse> {
  const { key } = await getApiKey();

  const prompt = `You are a top Instagram Reels director, scriptwriter, and viral pacing expert.
Brand Voice: ${params.toneVoice || "Direct, energetic, authentic"}
Target Audience: ${params.targetAudience || "Ambitious builders, creators, and professionals"}
Banned Words: ${params.bannedWords || "synergy, revolutionary, delve"}
Input Mode: ${params.inputMode}
Topic / Content Input:
"""
${params.input}
"""

Generate a structured Reel storyboard and script optimized for high watch-time and Instagram algorithm retention.
Requirements:
- 3 Hook variants with estimated viral retention scores (85-98%).
- 5 to 7 shot-by-shot beats.
- Beat 1 is HOOK (0-3s).
- Beats 2-5 are high-pacing BODY beats with exact visual cues (what camera sees, B-roll, props) and spoken dialogue (what creator says).
- Final beat is CALL TO ACTION.
- On-screen text for each beat (punchy 3-5 words to capture silent scrollers).
- Complete Instagram caption with line breaks and targeted hashtags.

Return ONLY a valid JSON object matching this structure:
{
  "title": "Title",
  "caption": "Full Instagram caption",
  "hashtags": "#reels #creator ...",
  "hooks": [
    { "text": "Hook 1 text", "score": 96 },
    { "text": "Hook 2 text", "score": 92 },
    { "text": "Hook 3 text", "score": 88 }
  ],
  "beats": [
    {
      "order": 1,
      "beatType": "HOOK",
      "visualCue": "Direct to camera, punch zoom",
      "spokenAudio": "If you're still doing X, stop right now.",
      "onScreenText": "STOP DOING THIS 🛑",
      "estimatedSeconds": 4
    }
  ]
}`;

  if (key) {
    try {
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

      if (response.ok) {
        const data = await response.json();
        const jsonText = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (jsonText) {
          return JSON.parse(jsonText);
        }
      }
    } catch (err) {
      console.error("Gemini API call error, falling back to smart generator:", err);
    }
  }

  return generateFallbackReel(params);
}

function generateFallbackCarousel(params: GenerateCarouselParams): GeneratedCarouselResponse {
  const cleanInput = params.input.replace(/[\n\r]+/g, " ").trim();
  const summaryTitle = cleanInput.slice(0, 45) || "5 Rules Every Creator Needs";

  return {
    title: summaryTitle,
    caption: `Most people overcomplicate this.\n\nHere is the exact playbook broken down step-by-step so you can execute immediately.\n\nSave this post so you have it when you need it.\n\nWhich slide resonated most with you? Let me know below 👇`,
    hashtags: "#growthmindset #contentcreation #creators #instagramstrategy #entrepreneurship #productivity #digitalmarketing #buildinpublic",
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
        bodyText: "If you take 3 weeks to publish what someone tests in 2 days, they learn 10x faster than you. Test rapidly, gather feedback, and iterate in public.",
        bulletPoints: [
          "Ship the 80% version today",
          "Let real feedback dictate the next iteration",
          "Momentum is your most valuable asset"
        ],
      },
      {
        order: 3,
        slideType: "COMPARISON",
        badgeText: "Myth vs Reality",
        headline: "Amateurs Guess. Pros Build Systems.",
        subheadline: "The difference between erratic results and compound growth.",
        bodyText: "Stop reinventing the wheel every Monday morning. Build reusable templates, clear SOPs, and automated workflows.",
        bulletPoints: [
          "Amateur: Relies on random motivation",
          "Professional: Follows a scheduled ritual",
          "Amateur: Starts from a blank canvas",
          "Professional: Refines proven frameworks"
        ],
      },
      {
        order: 4,
        slideType: "QUOTE",
        badgeText: "Key Insight",
        headline: "“Consistency is only hard when you haven't engineered the friction out of your process.”",
        subheadline: "",
        bodyText: "When creation takes 2 hours instead of 2 days, you don't need willpower to stay consistent.",
        quoteAuthor: params.brandName || "James Bonaguro",
        bulletPoints: [],
      },
      {
        order: 5,
        slideType: "CONTENT",
        badgeText: "Principle 02",
        headline: "Own Your Distribution & Archives",
        subheadline: "Never build your entire foundation on rented land.",
        bodyText: "Social algorithms change constantly. Direct sync, email archives, and local asset libraries protect your intellectual property.",
        bulletPoints: [
          "Keep high-res master exports of every post",
          "Sync directly to your cloud storage",
          "Repurpose single ideas across multiple mediums"
        ],
      },
      {
        order: 6,
        slideType: "CTA",
        badgeText: "Action Steps",
        headline: "Save This For Your Next Creation Session",
        subheadline: "Tag someone who needs to see this today.",
        bodyText: "Hit the save icon below to reference these frameworks. Follow for weekly breakdowns on execution and strategy.",
        bulletPoints: [
          "Save this post 🔖",
          "Share to your story ↗️",
          "Drop a comment with your favorite slide 👇"
        ],
      },
    ],
  };
}

function generateFallbackReel(params: GenerateReelParams): GeneratedReelResponse {
  const cleanInput = params.input.replace(/[\n\r]+/g, " ").trim();
  const topic = cleanInput.slice(0, 40) || "Scaling Your Content Engine";

  return {
    title: topic,
    caption: `If you want to scale your output without burning out, you need to hear this.\n\nDrop a comment with 'SYSTEM' and I'll send you our complete workflow checklist.\n\nDouble-tap if this was helpful! 🚀`,
    hashtags: "#reelsvideo #creatoreconomy #instagramtips #businesstips #workflow #founder #marketinghacks #productivitytips",
    hooks: [
      { text: `Stop making this massive mistake with ${topic} in 2026:`, score: 96 },
      { text: `The biggest lie you've been told about ${topic} (and what actually works):`, score: 92 },
      { text: `How I automated my entire ${topic} process in 3 simple steps:`, score: 89 },
    ],
    beats: [
      {
        order: 1,
        beatType: "HOOK",
        visualCue: "Direct to camera, medium-close, slight zoom-in, energetic delivery",
        spokenAudio: `If you are still struggling with ${topic}, you need to stop doing this one thing right now.`,
        onScreenText: "STOP DOING THIS 🛑",
        estimatedSeconds: 4,
      },
      {
        order: 2,
        beatType: "BODY",
        visualCue: "Cut to side-angle B-roll typing at desk or pointing to screen",
        spokenAudio: "Most people think they need more hours in the day. But the truth is, you don't have a time problem — you have a friction problem.",
        onScreenText: "IT'S A FRICTION PROBLEM ⏳",
        estimatedSeconds: 5,
      },
      {
        order: 3,
        beatType: "BODY",
        visualCue: "Screen recording / high-contrast graphic showing the 3-step workflow",
        spokenAudio: "Here's what top creators do instead: They build templated design systems and automated cloud sync from day one.",
        onScreenText: "BUILD THE SYSTEM ⚙️",
        estimatedSeconds: 6,
      },
      {
        order: 4,
        beatType: "BODY",
        visualCue: "Back to talking head with snappy hands-on gestures",
        spokenAudio: "When every slide and reel script is structured before you hit record, creation takes minutes instead of hours.",
        onScreenText: "MINUTES, NOT HOURS ⚡",
        estimatedSeconds: 5,
      },
      {
        order: 5,
        beatType: "CTA",
        visualCue: "Point down towards the comment section with confident smile",
        spokenAudio: "Comment the word 'SYSTEM' below, and I'll send you our exact step-by-step setup guide for free.",
        onScreenText: "COMMENT 'SYSTEM' 👇",
        estimatedSeconds: 4,
      },
    ],
  };
}
