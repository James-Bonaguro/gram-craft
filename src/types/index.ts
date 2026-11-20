export type TemplateStyle = "minimal" | "tweet" | "bold" | "infographic";

export type SlideType = "COVER" | "CONTENT" | "QUOTE" | "COMPARISON" | "CTA";

export type ProjectType = "CAROUSEL" | "REEL";

export type InputMode = "PROMPT" | "REPURPOSE" | "HOOK_FORMULA";

export interface BrandKitData {
  id?: string;
  name: string;
  handle: string;
  displayName: string;
  avatarUrl?: string | null;
  primaryColor: string;
  secondaryColor: string;
  bgColor: string;
  cardBgColor: string;
  textColor: string;
  accentColor: string;
  fontHeading: string;
  fontBody: string;
  toneVoice: string;
  targetAudience: string;
  bannedWords: string;
  isDefault: boolean;
}

export interface CarouselSlideData {
  id?: string;
  order: number;
  slideType: SlideType;
  headline: string;
  subheadline?: string;
  bodyText?: string;
  bulletPoints?: string[]; // Parsed from JSON string in DB
  badgeText?: string;
  quoteAuthor?: string;
  customJson?: string;
}

export interface ReelBeatData {
  id?: string;
  order: number;
  beatType: "HOOK" | "BODY" | "TRANSITION" | "CTA";
  visualCue: string;
  spokenAudio: string;
  onScreenText?: string;
  estimatedSeconds: number;
}

export interface ReelHookData {
  text: string;
  angle: string;
}

export interface ProjectData {
  id?: string;
  title: string;
  type: ProjectType;
  status: "DRAFT" | "READY" | "EXPORTED";
  brandKitId?: string | null;
  brandKit?: BrandKitData;
  caption?: string | null;
  hashtags?: string | null;
  rawInput?: string | null;
  inputType: InputMode;
  templateStyle: TemplateStyle;
  slides?: CarouselSlideData[];
  reelBeats?: ReelBeatData[];
  createdAt?: string;
  updatedAt?: string;
}

export interface HookFormula {
  id: string;
  title: string;
  template: string;
  example: string;
  category: "Curiosity" | "Contrarian" | "How-To" | "Mistake" | "Story";
}
