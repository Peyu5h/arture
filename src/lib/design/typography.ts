// typography system with font pairings

export interface FontPairing {
  id: string;
  name: string;
  heading: FontConfig;
  body: FontConfig;
  mood: FontMood;
  tags: string[];
  description: string;
}

export interface FontConfig {
  family: string;
  weight: number | string;
  fallback: string;
  category: FontCategory;
}

export type FontCategory = "serif" | "sans-serif" | "display" | "monospace" | "handwritten";

export type FontMood =
  | "formal"
  | "playful"
  | "modern"
  | "classic"
  | "elegant"
  | "casual"
  | "bold"
  | "minimal"
  | "creative"
  | "professional";

// typography rules for ai design decisions
export const TYPOGRAPHY_RULES = {
  maxFonts: 3,
  headingBodyContrast:
    "pair serif headings with sans-serif body or vice versa for visual contrast",
  hierarchy: "use size, weight, and spacing to create clear visual hierarchy",
  readability: "body text should be 16-18px minimum, line height 1.5-1.7",
  consistency: "maintain consistent font usage across similar elements",
};

// font pairings organized by mood
export const FONT_PAIRINGS: FontPairing[] = [
  // formal pairings
  {
    id: "formal-classic",
    name: "Classic Formal",
    heading: {
      family: "Playfair Display",
      weight: 700,
      fallback: "Georgia, serif",
      category: "serif",
    },
    body: {
      family: "Source Sans Pro",
      weight: 400,
      fallback: "Arial, sans-serif",
      category: "sans-serif",
    },
    mood: "formal",
    tags: ["wedding", "invitation", "certificate", "legal"],
    description: "elegant serif headings with clean sans-serif body",
  },
  {
    id: "formal-modern",
    name: "Modern Formal",
    heading: {
      family: "Cormorant Garamond",
      weight: 600,
      fallback: "Times New Roman, serif",
      category: "serif",
    },
    body: {
      family: "Nunito Sans",
      weight: 400,
      fallback: "Helvetica, sans-serif",
      category: "sans-serif",
    },
    mood: "formal",
    tags: ["business", "corporate", "report", "professional"],
    description: "refined serif with modern sans-serif pairing",
  },

  // playful pairings
  {
    id: "playful-fun",
    name: "Fun & Friendly",
    heading: {
      family: "Fredoka One",
      weight: 400,
      fallback: "Comic Sans MS, cursive",
      category: "display",
    },
    body: {
      family: "Quicksand",
      weight: 400,
      fallback: "Arial, sans-serif",
      category: "sans-serif",
    },
    mood: "playful",
    tags: ["party", "kids", "celebration", "birthday"],
    description: "rounded playful fonts for friendly designs",
  },
  {
    id: "playful-creative",
    name: "Creative Pop",
    heading: {
      family: "Pacifico",
      weight: 400,
      fallback: "cursive",
      category: "handwritten",
    },
    body: {
      family: "Poppins",
      weight: 400,
      fallback: "Arial, sans-serif",
      category: "sans-serif",
    },
    mood: "playful",
    tags: ["creative", "art", "summer", "beach"],
    description: "handwritten headings with clean body text",
  },

  // modern pairings
  {
    id: "modern-tech",
    name: "Tech Modern",
    heading: {
      family: "Inter",
      weight: 700,
      fallback: "system-ui, sans-serif",
      category: "sans-serif",
    },
    body: {
      family: "Inter",
      weight: 400,
      fallback: "system-ui, sans-serif",
      category: "sans-serif",
    },
    mood: "modern",
    tags: ["tech", "startup", "app", "digital"],
    description: "clean geometric sans-serif for tech designs",
  },
  {
    id: "modern-minimal",
    name: "Minimal Modern",
    heading: {
      family: "Montserrat",
      weight: 600,
      fallback: "Arial, sans-serif",
      category: "sans-serif",
    },
    body: {
      family: "Open Sans",
      weight: 400,
      fallback: "Helvetica, sans-serif",
      category: "sans-serif",
    },
    mood: "modern",
    tags: ["minimal", "clean", "portfolio", "resume"],
    description: "versatile modern pairing for any design",
  },

  // classic pairings
  {
    id: "classic-traditional",
    name: "Traditional Classic",
    heading: {
      family: "Merriweather",
      weight: 700,
      fallback: "Georgia, serif",
      category: "serif",
    },
    body: {
      family: "Merriweather",
      weight: 400,
      fallback: "Georgia, serif",
      category: "serif",
    },
    mood: "classic",
    tags: ["traditional", "newspaper", "editorial", "book"],
    description: "timeless serif for classic editorial look",
  },
  {
    id: "classic-academic",
    name: "Academic Classic",
    heading: {
      family: "Libre Baskerville",
      weight: 700,
      fallback: "Times New Roman, serif",
      category: "serif",
    },
    body: {
      family: "Lora",
      weight: 400,
      fallback: "Georgia, serif",
      category: "serif",
    },
    mood: "classic",
    tags: ["academic", "scholarly", "literary", "journal"],
    description: "scholarly serif pairing for academic content",
  },

  // elegant pairings
  {
    id: "elegant-luxury",
    name: "Luxury Elegant",
    heading: {
      family: "Cinzel",
      weight: 500,
      fallback: "Times New Roman, serif",
      category: "serif",
    },
    body: {
      family: "Raleway",
      weight: 400,
      fallback: "Arial, sans-serif",
      category: "sans-serif",
    },
    mood: "elegant",
    tags: ["luxury", "fashion", "jewelry", "high-end"],
    description: "refined display font with elegant body text",
  },
  {
    id: "elegant-wedding",
    name: "Wedding Elegant",
    heading: {
      family: "Great Vibes",
      weight: 400,
      fallback: "cursive",
      category: "handwritten",
    },
    body: {
      family: "Lato",
      weight: 300,
      fallback: "Arial, sans-serif",
      category: "sans-serif",
    },
    mood: "elegant",
    tags: ["wedding", "romance", "invitation", "love"],
    description: "romantic script with clean supporting text",
  },

  // casual pairings
  {
    id: "casual-friendly",
    name: "Casual Friendly",
    heading: {
      family: "Nunito",
      weight: 700,
      fallback: "Arial, sans-serif",
      category: "sans-serif",
    },
    body: {
      family: "Nunito",
      weight: 400,
      fallback: "Arial, sans-serif",
      category: "sans-serif",
    },
    mood: "casual",
    tags: ["casual", "friendly", "blog", "social"],
    description: "rounded friendly font for approachable designs",
  },

  // bold pairings
  {
    id: "bold-impact",
    name: "Bold Impact",
    heading: {
      family: "Bebas Neue",
      weight: 400,
      fallback: "Impact, sans-serif",
      category: "display",
    },
    body: {
      family: "Roboto",
      weight: 400,
      fallback: "Arial, sans-serif",
      category: "sans-serif",
    },
    mood: "bold",
    tags: ["poster", "sports", "event", "announcement"],
    description: "high-impact display with neutral body text",
  },
  {
    id: "bold-dynamic",
    name: "Dynamic Bold",
    heading: {
      family: "Oswald",
      weight: 600,
      fallback: "Impact, sans-serif",
      category: "sans-serif",
    },
    body: {
      family: "Source Sans Pro",
      weight: 400,
      fallback: "Arial, sans-serif",
      category: "sans-serif",
    },
    mood: "bold",
    tags: ["fitness", "action", "dynamic", "sports"],
    description: "condensed bold heading with readable body",
  },

  // minimal pairings
  {
    id: "minimal-clean",
    name: "Clean Minimal",
    heading: {
      family: "Helvetica Neue",
      weight: 500,
      fallback: "Arial, sans-serif",
      category: "sans-serif",
    },
    body: {
      family: "Helvetica Neue",
      weight: 300,
      fallback: "Arial, sans-serif",
      category: "sans-serif",
    },
    mood: "minimal",
    tags: ["minimal", "clean", "swiss", "design"],
    description: "swiss-style minimal typography",
  },

  // creative pairings
  {
    id: "creative-artistic",
    name: "Artistic Creative",
    heading: {
      family: "Abril Fatface",
      weight: 400,
      fallback: "Georgia, serif",
      category: "display",
    },
    body: {
      family: "Work Sans",
      weight: 400,
      fallback: "Arial, sans-serif",
      category: "sans-serif",
    },
    mood: "creative",
    tags: ["art", "gallery", "creative", "design"],
    description: "artistic display font with modern body",
  },

  // professional pairings
  {
    id: "professional-corporate",
    name: "Corporate Professional",
    heading: {
      family: "Roboto Slab",
      weight: 600,
      fallback: "Georgia, serif",
      category: "serif",
    },
    body: {
      family: "Roboto",
      weight: 400,
      fallback: "Arial, sans-serif",
      category: "sans-serif",
    },
    mood: "professional",
    tags: ["corporate", "business", "report", "presentation"],
    description: "professional slab serif with matching sans body",
  },
];

// suggest font pairing based on mood
export function suggestFontPairing(mood: FontMood): FontPairing[] {
  const pairings = FONT_PAIRINGS.filter((p) => p.mood === mood);
  if (pairings.length === 0) {
    return FONT_PAIRINGS.filter((p) => p.mood === "modern").slice(0, 2);
  }
  return pairings;
}

// suggest font pairing based on tags/keywords
export function suggestFontPairingByKeyword(keyword: string): FontPairing[] {
  const lower = keyword.toLowerCase();

  // direct tag match
  const tagMatches = FONT_PAIRINGS.filter((p) =>
    p.tags.some((t) => t.includes(lower) || lower.includes(t))
  );

  if (tagMatches.length > 0) {
    return tagMatches.slice(0, 3);
  }

  // mood keyword mapping
  const moodKeywords: Record<string, FontMood> = {
    wedding: "elegant",
    party: "playful",
    birthday: "playful",
    business: "professional",
    corporate: "professional",
    resume: "modern",
    portfolio: "modern",
    poster: "bold",
    flyer: "bold",
    invitation: "elegant",
    formal: "formal",
    fun: "playful",
    tech: "modern",
    startup: "modern",
    luxury: "elegant",
    minimal: "minimal",
    clean: "minimal",
    creative: "creative",
    art: "creative",
  };

  for (const [key, mood] of Object.entries(moodKeywords)) {
    if (lower.includes(key)) {
      return suggestFontPairing(mood);
    }
  }

  // default to modern
  return suggestFontPairing("modern");
}

// get font css string
export function getFontCSS(config: FontConfig): string {
  return `font-family: "${config.family}", ${config.fallback}; font-weight: ${config.weight};`;
}

// get google fonts url for pairing
export function getGoogleFontsUrl(pairing: FontPairing): string {
  const fonts = new Set<string>();
  fonts.add(
    `${pairing.heading.family.replace(/ /g, "+")}:wght@${pairing.heading.weight}`
  );
  if (pairing.heading.family !== pairing.body.family) {
    fonts.add(
      `${pairing.body.family.replace(/ /g, "+")}:wght@${pairing.body.weight}`
    );
  }
  return `https://fonts.googleapis.com/css2?family=${Array.from(fonts).join("&family=")}&display=swap`;
}

// get all available moods
export function getAvailableMoods(): FontMood[] {
  return [
    "formal",
    "playful",
    "modern",
    "classic",
    "elegant",
    "casual",
    "bold",
    "minimal",
    "creative",
    "professional",
  ];
}

// validate font pairing rule
export function validateFontUsage(fonts: string[]): {
  valid: boolean;
  warnings: string[];
} {
  const warnings: string[] = [];

  if (fonts.length > TYPOGRAPHY_RULES.maxFonts) {
    warnings.push(
      `using ${fonts.length} fonts - consider limiting to ${TYPOGRAPHY_RULES.maxFonts} for better consistency`
    );
  }

  return {
    valid: warnings.length === 0,
    warnings,
  };
}
