import { satyanarayanPujaHome } from "./satyanarayan";
import { gymPoster } from "./gym-poster";
import type { DemoPreset, DemoId } from "./types";

export type { DemoPreset, DemoId } from "./types";
export type * from "./types";

// all available demo presets
const DEMO_PRESETS: Record<string, DemoPreset> = {
  satyanarayan_puja_home: satyanarayanPujaHome,
  gym_poster: gymPoster as DemoPreset,
};

export function getDemoPreset(id: string): DemoPreset | null {
  return DEMO_PRESETS[id] || null;
}

export function getAllDemoPresets(): DemoPreset[] {
  return Object.values(DEMO_PRESETS);
}

export function getDemoPresetIds(): string[] {
  return Object.keys(DEMO_PRESETS);
}

// predefined prompts shown during initial demo
export interface PredefinedPrompt {
  id: string;
  demoId: string;
  label: string;
  description: string;
  prompt: string;
  icon: string;
  gradient: [string, string];
}

export const PREDEFINED_PROMPTS: PredefinedPrompt[] = [
  {
    id: "prompt_satyanarayan",
    demoId: "satyanarayan_puja_home",
    label: "Satyanarayan Puja Invitation",
    description: "Traditional puja invitation with Marathi/English support",
    prompt: "Create a Satyanarayan Puja invitation for my home",
    icon: "flame-kindling",
    gradient: ["#B8860B", "#8B0000"],
  },
  {
    id: "prompt_gym",
    demoId: "gym_poster",
    label: "Gym Membership Poster",
    description: "Bold fitness poster with pricing, schedule & CTA",
    prompt: "Create a gym membership poster with pricing and schedule",
    icon: "dumbbell",
    gradient: ["#1A1A2E", "#F6E05E"],
  },
];

// checks if a user message matches a predefined demo prompt
export function matchDemoPrompt(message: string): PredefinedPrompt | null {
  const lower = message.toLowerCase().trim();

  for (const prompt of PREDEFINED_PROMPTS) {
    const keywords = prompt.prompt.toLowerCase().split(" ");
    const matchCount = keywords.filter((kw) => lower.includes(kw)).length;
    if (matchCount >= keywords.length * 0.6) return prompt;
  }

  // direct keyword matching
  if (lower.includes("satyanarayan") || lower.includes("puja invitation")) {
    return PREDEFINED_PROMPTS[0];
  }
  if (
    (lower.includes("gym") && lower.includes("poster")) ||
    (lower.includes("fitness") && lower.includes("poster"))
  ) {
    return PREDEFINED_PROMPTS[1];
  }

  return null;
}

export { satyanarayanPujaHome } from "./satyanarayan";
export { gymPoster } from "./gym-poster";
export { resolveText, PUJA_THEMES, MARATHI_TEXTS, HINDI_TEXTS } from "./satyanarayan";
export { resolveGymText, GYM_THEMES } from "./gym-poster";
