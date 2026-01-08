// design rules and knowledge base for ai design intelligence

import { checkContrast, isLightColor, getTextColor } from "./color-theory";
import { TYPOGRAPHY_RULES, FONT_PAIRINGS, type FontMood } from "./typography";

export interface DesignRule {
  id: string;
  category: DesignCategory;
  rule: string;
  priority: "critical" | "important" | "suggestion";
  autoApply: boolean;
}

export interface DesignAuditResult {
  passed: boolean;
  issues: DesignIssue[];
  suggestions: DesignSuggestion[];
  score: number;
}

export interface DesignIssue {
  id: string;
  severity: "error" | "warning" | "info";
  element?: string;
  message: string;
  fix?: string;
  autoFixable: boolean;
}

export interface DesignSuggestion {
  id: string;
  category: DesignCategory;
  message: string;
  action?: string;
}

export type DesignCategory =
  | "color"
  | "typography"
  | "layout"
  | "hierarchy"
  | "spacing"
  | "accessibility"
  | "composition";

// design rules for ai to follow
export const DESIGN_RULES: DesignRule[] = [
  // color rules
  {
    id: "color-contrast-text",
    category: "color",
    rule: "text must have sufficient contrast ratio (4.5:1 minimum for normal text, 3:1 for large text) against its background",
    priority: "critical",
    autoApply: true,
  },
  {
    id: "color-dark-bg-light-text",
    category: "color",
    rule: "use light text colors (#FFFFFF or light tones) on dark backgrounds for readability",
    priority: "critical",
    autoApply: true,
  },
  {
    id: "color-light-bg-dark-text",
    category: "color",
    rule: "use dark text colors (#1A1A2E or dark tones) on light backgrounds for readability",
    priority: "critical",
    autoApply: true,
  },
  {
    id: "color-complementary-accent",
    category: "color",
    rule: "use complementary or contrasting colors for accent elements to draw attention",
    priority: "important",
    autoApply: false,
  },
  {
    id: "color-limit-palette",
    category: "color",
    rule: "limit color palette to 3-5 colors for visual cohesion",
    priority: "important",
    autoApply: false,
  },
  {
    id: "color-60-30-10",
    category: "color",
    rule: "follow 60-30-10 rule: 60% dominant color, 30% secondary, 10% accent",
    priority: "suggestion",
    autoApply: false,
  },

  // typography rules
  {
    id: "typo-max-fonts",
    category: "typography",
    rule: "use maximum 2-3 font families per design for consistency",
    priority: "important",
    autoApply: false,
  },
  {
    id: "typo-heading-body-contrast",
    category: "typography",
    rule: "pair serif headings with sans-serif body or vice versa for visual contrast",
    priority: "suggestion",
    autoApply: false,
  },
  {
    id: "typo-min-body-size",
    category: "typography",
    rule: "body text should be minimum 14px for readability, 16-18px preferred",
    priority: "important",
    autoApply: true,
  },
  {
    id: "typo-heading-hierarchy",
    category: "typography",
    rule: "maintain clear size hierarchy: h1 > h2 > h3 > body (typically 2x, 1.5x, 1.25x ratios)",
    priority: "important",
    autoApply: false,
  },
  {
    id: "typo-line-height",
    category: "typography",
    rule: "use line height of 1.4-1.6 for body text, 1.1-1.3 for headings",
    priority: "suggestion",
    autoApply: true,
  },

  // layout rules
  {
    id: "layout-alignment",
    category: "layout",
    rule: "align elements to a consistent grid or axis for visual order",
    priority: "important",
    autoApply: false,
  },
  {
    id: "layout-whitespace",
    category: "layout",
    rule: "use adequate whitespace (negative space) to prevent crowding and improve focus",
    priority: "important",
    autoApply: false,
  },
  {
    id: "layout-proximity",
    category: "layout",
    rule: "group related elements together and separate unrelated elements",
    priority: "important",
    autoApply: false,
  },
  {
    id: "layout-balance",
    category: "layout",
    rule: "maintain visual balance through symmetry or asymmetric tension",
    priority: "suggestion",
    autoApply: false,
  },

  // hierarchy rules
  {
    id: "hierarchy-focal-point",
    category: "hierarchy",
    rule: "every design should have one clear focal point or primary element",
    priority: "important",
    autoApply: false,
  },
  {
    id: "hierarchy-size-importance",
    category: "hierarchy",
    rule: "larger elements are perceived as more important - size reflects importance",
    priority: "important",
    autoApply: false,
  },
  {
    id: "hierarchy-color-emphasis",
    category: "hierarchy",
    rule: "use color to create emphasis - saturated colors draw more attention",
    priority: "suggestion",
    autoApply: false,
  },

  // spacing rules
  {
    id: "spacing-consistent",
    category: "spacing",
    rule: "use consistent spacing units (8px grid system recommended)",
    priority: "important",
    autoApply: true,
  },
  {
    id: "spacing-breathing-room",
    category: "spacing",
    rule: "give elements adequate padding and margin for visual breathing room",
    priority: "suggestion",
    autoApply: false,
  },

  // accessibility rules
  {
    id: "a11y-color-only",
    category: "accessibility",
    rule: "dont rely solely on color to convey information",
    priority: "important",
    autoApply: false,
  },
  {
    id: "a11y-text-size",
    category: "accessibility",
    rule: "ensure text is large enough to be readable (minimum 12px, 14px recommended)",
    priority: "critical",
    autoApply: true,
  },
];

// design knowledge for system prompt injection
export const DESIGN_KNOWLEDGE = {
  colorTheory: {
    rules: [
      "if background is dark (#1A1A2E, #000000, etc), use light text (#FFFFFF, #F8F9FA)",
      "if background is light (#FFFFFF, #F8F9FA, etc), use dark text (#1A1A2E, #212529)",
      "use complementary colors (opposite on color wheel) for high contrast accents",
      "use analogous colors (adjacent on color wheel) for harmonious, calm designs",
      "use triadic colors (equally spaced on color wheel) for vibrant, balanced designs",
      "limit palette to 3-5 colors for cohesion",
      "follow 60-30-10 rule: dominant, secondary, accent",
    ],
    contrastMinimums: {
      normalText: 4.5,
      largeText: 3.0,
      decorative: 1.5,
    },
  },
  typography: {
    rules: [
      "maximum 2-3 font families per design",
      "pair serif headings with sans-serif body for contrast",
      "or pair sans-serif headings with serif body",
      "never pair two decorative/display fonts together",
      "body text: 14-18px, headings: 24-72px depending on hierarchy",
      "line height 1.4-1.6 for body, 1.1-1.3 for headings",
    ],
    moodMapping: {
      wedding: ["elegant", "formal"] as FontMood[],
      party: ["playful", "casual"] as FontMood[],
      birthday: ["playful", "casual"] as FontMood[],
      corporate: ["professional", "modern"] as FontMood[],
      resume: ["modern", "minimal"] as FontMood[],
      poster: ["bold", "creative"] as FontMood[],
      invitation: ["elegant", "formal"] as FontMood[],
    },
  },
  hierarchy: {
    rules: [
      "one clear focal point per design",
      "size = importance (larger = more important)",
      "position matters: top-left to bottom-right reading flow",
      "contrast draws attention",
      "repetition creates rhythm and unity",
    ],
  },
  layout: {
    rules: [
      "use consistent alignment (left, center, or right)",
      "group related elements with proximity",
      "use whitespace to create focus and breathing room",
      "maintain visual balance",
      "use grid system for alignment (8px base unit)",
    ],
  },
};

// build design-aware system prompt section
export function buildDesignPromptSection(): string {
  return `
DESIGN INTELLIGENCE:

COLOR THEORY:
${DESIGN_KNOWLEDGE.colorTheory.rules.map((r) => `- ${r}`).join("\n")}

TYPOGRAPHY:
${DESIGN_KNOWLEDGE.typography.rules.map((r) => `- ${r}`).join("\n")}

VISUAL HIERARCHY:
${DESIGN_KNOWLEDGE.hierarchy.rules.map((r) => `- ${r}`).join("\n")}

LAYOUT PRINCIPLES:
${DESIGN_KNOWLEDGE.layout.rules.map((r) => `- ${r}`).join("\n")}

AUTOMATIC DESIGN DECISIONS:
- When adding text to dark backgrounds, always use light colors (#FFFFFF, #F8F9FA)
- When adding text to light backgrounds, always use dark colors (#1A1A2E, #212529)
- For wedding/invitation designs, suggest elegant font pairings (Playfair Display + Lato)
- For party/birthday designs, suggest playful fonts (Fredoka One + Quicksand)
- For corporate/resume designs, suggest modern clean fonts (Inter, Montserrat)
- Always consider contrast ratios for accessibility
- Suggest color palettes based on mood and existing canvas colors
`;
}

// audit design for issues
export function auditDesign(elements: {
  texts: Array<{ fill: string; fontSize?: number; background?: string }>;
  shapes: Array<{ fill: string }>;
  canvasBackground: string;
  fonts: string[];
}): DesignAuditResult {
  const issues: DesignIssue[] = [];
  const suggestions: DesignSuggestion[] = [];
  let score = 100;

  // check text contrast
  for (let i = 0; i < elements.texts.length; i++) {
    const text = elements.texts[i];
    const bg = text.background || elements.canvasBackground;
    const contrast = checkContrast(text.fill, bg);

    if (!contrast.aa) {
      issues.push({
        id: `contrast-${i}`,
        severity: contrast.aaLarge ? "warning" : "error",
        element: `text-${i}`,
        message: `text has low contrast ratio (${contrast.ratio}:1) against background`,
        fix: `change text color to ${getTextColor(bg)}`,
        autoFixable: true,
      });
      score -= contrast.aaLarge ? 5 : 15;
    }
  }

  // check font size
  for (let i = 0; i < elements.texts.length; i++) {
    const text = elements.texts[i];
    if (text.fontSize && text.fontSize < 12) {
      issues.push({
        id: `fontsize-${i}`,
        severity: "warning",
        element: `text-${i}`,
        message: `text size (${text.fontSize}px) is too small for readability`,
        fix: "increase font size to at least 14px",
        autoFixable: true,
      });
      score -= 5;
    }
  }

  // check font count
  const uniqueFonts = new Set(elements.fonts);
  if (uniqueFonts.size > TYPOGRAPHY_RULES.maxFonts) {
    issues.push({
      id: "too-many-fonts",
      severity: "warning",
      message: `using ${uniqueFonts.size} fonts - consider limiting to ${TYPOGRAPHY_RULES.maxFonts}`,
      autoFixable: false,
    });
    score -= 10;
  }

  // add suggestions based on canvas background
  if (isLightColor(elements.canvasBackground)) {
    suggestions.push({
      id: "light-bg-suggestion",
      category: "color",
      message: "light background detected - ensure all text uses dark colors for readability",
    });
  } else {
    suggestions.push({
      id: "dark-bg-suggestion",
      category: "color",
      message: "dark background detected - ensure all text uses light colors for readability",
    });
  }

  return {
    passed: issues.filter((i) => i.severity === "error").length === 0,
    issues,
    suggestions,
    score: Math.max(0, score),
  };
}

// get auto-fix recommendations
export function getAutoFixes(
  issues: DesignIssue[]
): Array<{ issueId: string; action: string; payload: Record<string, unknown> }> {
  return issues
    .filter((i) => i.autoFixable)
    .map((issue) => {
      if (issue.id.startsWith("contrast-")) {
        return {
          issueId: issue.id,
          action: "modify_element",
          payload: {
            elementQuery: issue.element,
            properties: { fill: issue.fix?.match(/#[A-Fa-f0-9]{6}/)?.[0] || "#FFFFFF" },
          },
        };
      }
      if (issue.id.startsWith("fontsize-")) {
        return {
          issueId: issue.id,
          action: "modify_element",
          payload: {
            elementQuery: issue.element,
            properties: { fontSize: 14 },
          },
        };
      }
      return null;
    })
    .filter(Boolean) as Array<{
      issueId: string;
      action: string;
      payload: Record<string, unknown>;
    }>;
}

// get design suggestion for intent
export function getDesignSuggestionForIntent(intent: string): {
  palette?: string;
  fontMood?: FontMood;
  templateCategory?: string;
} {
  const lower = intent.toLowerCase();

  // wedding/invitation
  if (lower.includes("wedding") || lower.includes("marriage") || lower.includes("engagement")) {
    return {
      palette: "elegant-gold",
      fontMood: "elegant",
      templateCategory: "invitations",
    };
  }

  // party/celebration
  if (
    lower.includes("party") ||
    lower.includes("birthday") ||
    lower.includes("celebration")
  ) {
    return {
      palette: "vibrant-energy",
      fontMood: "playful",
      templateCategory: "events",
    };
  }

  // business/corporate
  if (
    lower.includes("business") ||
    lower.includes("corporate") ||
    lower.includes("professional") ||
    lower.includes("meeting")
  ) {
    return {
      palette: "modern-dark",
      fontMood: "professional",
      templateCategory: "business",
    };
  }

  // resume/portfolio
  if (lower.includes("resume") || lower.includes("portfolio") || lower.includes("cv")) {
    return {
      palette: "clean-minimal",
      fontMood: "modern",
      templateCategory: "resume",
    };
  }

  // poster/flyer
  if (lower.includes("poster") || lower.includes("flyer") || lower.includes("banner")) {
    return {
      palette: "vibrant-energy",
      fontMood: "bold",
      templateCategory: "poster",
    };
  }

  // religious/puja
  if (
    lower.includes("puja") ||
    lower.includes("religious") ||
    lower.includes("ceremony") ||
    lower.includes("ritual")
  ) {
    return {
      palette: "elegant-gold",
      fontMood: "formal",
      templateCategory: "invitations",
    };
  }

  return {};
}

// export combined design intelligence
export const designIntelligence = {
  rules: DESIGN_RULES,
  knowledge: DESIGN_KNOWLEDGE,
  buildPrompt: buildDesignPromptSection,
  audit: auditDesign,
  getAutoFixes,
  getSuggestion: getDesignSuggestionForIntent,
};
