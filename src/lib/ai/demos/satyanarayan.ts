import type { DemoPreset } from "./types";

// satyanarayan puja invitation - home variant
export const satyanarayanPujaHome: DemoPreset = {
  id: "satyanarayan_puja_home",
  name: "Satyanarayan Puja Invitation",
  description:
    "Create a beautiful Satyanarayan Puja invitation for home or society",
  prompt: "Create a Satyanarayan Puja invitation",
  language: "mixed",
  locationType: "home",

  analyzePhrases: [
    { text: "Understanding your request...", durationMs: 800 },
    { text: "Identifying puja invitation format...", durationMs: 1200 },
    { text: "Selecting traditional design elements...", durationMs: 1000 },
    { text: "Preparing customization options...", durationMs: 600 },
  ],

  collectConfig: {
    title: "Satyanarayan Puja Invitation Details",
    description: "Fill in the details to craft your personalized invitation",
    groups: [
      { id: "basic", label: "Basic Info", icon: "scroll-text" },
      { id: "datetime", label: "Date & Time", icon: "calendar" },
      { id: "location", label: "Location", icon: "map-pin" },
      { id: "style", label: "Style", icon: "palette" },
    ],
    fields: [
      {
        id: "language",
        type: "select",
        label: "Language",
        required: true,
        defaultValue: "mixed",
        options: [
          { value: "english", label: "English" },
          { value: "marathi", label: "Marathi" },
          { value: "hindi", label: "Hindi" },
          { value: "mixed", label: "Mixed (English + Marathi)" },
        ],
        group: "basic",
      },
      {
        id: "host_name",
        type: "text",
        label: "Host Name / Family Name",
        placeholder: "e.g. Sharma Family",
        required: true,
        group: "basic",
      },
      {
        id: "occasion_note",
        type: "text",
        label: "Occasion Note",
        placeholder: "e.g. On the occasion of Griha Pravesh",
        group: "basic",
      },
      {
        id: "location_type",
        type: "select",
        label: "Venue Type",
        required: true,
        defaultValue: "home",
        options: [
          { value: "home", label: "Home", icon: "house" },
          {
            value: "society",
            label: "Society / Community Hall",
            icon: "building-2",
          },
          { value: "temple", label: "Temple", icon: "landmark" },
          { value: "hall", label: "Function Hall", icon: "warehouse" },
        ],
        group: "location",
      },
      {
        id: "venue_address",
        type: "text",
        label: "Venue / Address",
        placeholder: "e.g. Flat 301, Sunshine Apt, Pune",
        group: "location",
      },
      {
        id: "puja_date",
        type: "date",
        label: "Puja Date",
        required: true,
        group: "datetime",
      },
      {
        id: "puja_time",
        type: "time",
        label: "Puja Time",
        defaultValue: "11:00",
        group: "datetime",
      },
      {
        id: "prasad_time",
        type: "time",
        label: "Prasad / Mahaprasad Time",
        placeholder: "e.g. 1:00 PM",
        group: "datetime",
      },
      {
        id: "theme",
        type: "select",
        label: "Design Theme",
        defaultValue: "traditional",
        options: [
          { value: "traditional", label: "Traditional Gold & Red" },
          { value: "elegant", label: "Elegant Maroon & Cream" },
          { value: "modern", label: "Modern Saffron & White" },
          { value: "royal", label: "Royal Purple & Gold" },
        ],
        group: "style",
      },
      {
        id: "include_om",
        type: "toggle",
        label: "Include Om / Swastik symbol",
        defaultValue: true,
        group: "style",
      },
    ],
  },

  canvasWidth: 800,
  canvasHeight: 1100,

  background: {
    type: "gradient",
    colors: ["#FFF8E7", "#FDEBD0"],
    direction: "vertical",
  },

  // placeholder positions
  textElements: [
    {
      id: "sn_header_om",
      text: "|| Shri Ganeshaya Namah ||",
      fontSize: 20,
      fontFamily: "Noto Serif Devanagari",
      fontWeight: 600,
      fill: "#B8860B",
      position: "top-center",
      textAlign: "center",
      opacity: 0.9,
    },
    {
      id: "sn_title",
      text: "Satyanarayan Puja",
      fontSize: 52,
      fontFamily: "Playfair Display",
      fontWeight: 700,
      fill: "#8B0000",
      position: { x: 400, y: 200 },
      textAlign: "center",
    },
    {
      id: "sn_subtitle",
      text: "You are cordially invited",
      fontSize: 22,
      fontFamily: "Lora",
      fill: "#5C3317",
      position: { x: 400, y: 280 },
      textAlign: "center",
    },
    {
      id: "sn_host",
      text: "{{host_name}}",
      fontSize: 36,
      fontFamily: "Playfair Display",
      fontWeight: 600,
      fill: "#B8860B",
      position: { x: 400, y: 380 },
      textAlign: "center",
    },
    {
      id: "sn_occasion",
      text: "{{occasion_note}}",
      fontSize: 18,
      fontFamily: "Lora",
      fill: "#6B4226",
      position: { x: 400, y: 440 },
      textAlign: "center",
      opacity: 0.85,
    },
    {
      id: "sn_date",
      text: "{{puja_date}}",
      fontSize: 28,
      fontFamily: "Playfair Display",
      fontWeight: 600,
      fill: "#8B0000",
      position: { x: 400, y: 540 },
      textAlign: "center",
    },
    {
      id: "sn_time",
      text: "Puja: {{puja_time}} | Prasad: {{prasad_time}}",
      fontSize: 18,
      fontFamily: "Lora",
      fill: "#5C3317",
      position: { x: 400, y: 590 },
      textAlign: "center",
    },
    {
      id: "sn_venue",
      text: "{{venue_address}}",
      fontSize: 18,
      fontFamily: "Lora",
      fill: "#5C3317",
      position: { x: 400, y: 640 },
      textAlign: "center",
      width: 500,
    },
    {
      id: "sn_footer",
      text: "Kripaya upasthit rahun ashirwad dyave",
      fontSize: 16,
      fontFamily: "Noto Serif Devanagari",
      fill: "#B8860B",
      position: "bottom-center",
      textAlign: "center",
      opacity: 0.8,
    },
  ],

  imageElements: [
    {
      id: "sn_img_kalash",
      query: "golden kalash hindu puja",
      position: { x: 350, y: 700 },
      width: 120,
      opacity: 0.9,
    },
    {
      id: "sn_img_border_top",
      query: "indian traditional floral border gold",
      position: "top-center",
      width: 600,
      opacity: 0.4,
    },
    {
      id: "sn_img_diya",
      query: "diya lamp hindu",
      position: { x: 80, y: 500 },
      width: 80,
      opacity: 0.7,
    },
  ],

  steps: [
    {
      id: "sn_step_bg",
      type: "set_background",
      label: "Setting invitation background",
      description: "Applying warm traditional gradient",
      toolName: "apply_gradient_background",
      toolArgs: {
        colors: ["#FFF8E7", "#FDEBD0"],
        direction: "vertical",
      },
      thinkingDurationMs: 600,
      executionDurationMs: 400,
    },
    {
      id: "sn_step_font_header",
      type: "apply_font",
      label: "Loading Devanagari font",
      description: "Preparing Noto Serif Devanagari typeface",
      toolName: "load_font",
      toolArgs: { fontFamily: "Noto Serif Devanagari" },
      thinkingDurationMs: 500,
      executionDurationMs: 800,
    },
    {
      id: "sn_step_header",
      type: "add_text",
      label: "Adding sacred header",
      description: "Placing || Shri Ganeshaya Namah ||",
      toolName: "add_text",
      toolArgs: { elementRef: "sn_header_om" },
      thinkingDurationMs: 700,
      executionDurationMs: 300,
      dependsOn: "sn_step_font_header",
    },
    {
      id: "sn_step_title",
      type: "add_text",
      label: "Adding puja title",
      description: "Placing main heading text",
      toolName: "add_text",
      toolArgs: { elementRef: "sn_title" },
      thinkingDurationMs: 500,
      executionDurationMs: 300,
    },
    {
      id: "sn_step_subtitle",
      type: "add_text",
      label: "Adding invitation line",
      description: "You are cordially invited",
      toolName: "add_text",
      toolArgs: { elementRef: "sn_subtitle" },
      thinkingDurationMs: 400,
      executionDurationMs: 250,
    },
    {
      id: "sn_step_host",
      type: "add_text",
      label: "Adding host name",
      description: "Placing family / host name",
      toolName: "add_text",
      toolArgs: { elementRef: "sn_host" },
      thinkingDurationMs: 350,
      executionDurationMs: 250,
    },
    {
      id: "sn_step_occasion",
      type: "add_text",
      label: "Adding occasion note",
      description: "On the occasion of...",
      toolName: "add_text",
      toolArgs: { elementRef: "sn_occasion" },
      thinkingDurationMs: 400,
      executionDurationMs: 250,
    },
    {
      id: "sn_step_date",
      type: "add_text",
      label: "Adding puja date",
      description: "Setting date & day",
      toolName: "add_text",
      toolArgs: { elementRef: "sn_date" },
      thinkingDurationMs: 300,
      executionDurationMs: 250,
    },
    {
      id: "sn_step_time",
      type: "add_text",
      label: "Adding timing details",
      description: "Puja time and prasad time",
      toolName: "add_text",
      toolArgs: { elementRef: "sn_time" },
      thinkingDurationMs: 350,
      executionDurationMs: 250,
    },
    {
      id: "sn_step_venue",
      type: "add_text",
      label: "Adding venue",
      description: "Placing address details",
      toolName: "add_text",
      toolArgs: { elementRef: "sn_venue" },
      thinkingDurationMs: 300,
      executionDurationMs: 250,
    },
    {
      id: "sn_step_img_border",
      type: "add_image",
      label: "Searching decorative border",
      description: "Finding traditional floral border",
      toolName: "search_images",
      toolArgs: { imageRef: "sn_img_border_top" },
      thinkingDurationMs: 800,
      executionDurationMs: 1200,
    },
    {
      id: "sn_step_img_kalash",
      type: "add_image",
      label: "Adding kalash illustration",
      description: "Searching for golden kalash",
      toolName: "search_images",
      toolArgs: { imageRef: "sn_img_kalash" },
      thinkingDurationMs: 600,
      executionDurationMs: 1000,
    },
    {
      id: "sn_step_img_diya",
      type: "add_image",
      label: "Adding diya decoration",
      description: "Placing decorative lamp",
      toolName: "search_images",
      toolArgs: { imageRef: "sn_img_diya" },
      thinkingDurationMs: 500,
      executionDurationMs: 900,
    },
    {
      id: "sn_step_footer",
      type: "add_text",
      label: "Adding blessing footer",
      description: "Placing closing blessing text",
      toolName: "add_text",
      toolArgs: { elementRef: "sn_footer" },
      thinkingDurationMs: 400,
      executionDurationMs: 250,
    },
    {
      id: "sn_step_finalize",
      type: "finalize",
      label: "Finalizing design",
      description: "Adjusting layout and spacing",
      toolName: "finalize_layout",
      toolArgs: {},
      thinkingDurationMs: 600,
      executionDurationMs: 400,
    },
  ],
};

// theme color maps for dynamic theming
export const PUJA_THEMES: Record<
  string,
  {
    bg: string[];
    primary: string;
    secondary: string;
    accent: string;
    text: string;
  }
> = {
  traditional: {
    bg: ["#FFF8E7", "#FDEBD0"],
    primary: "#8B0000",
    secondary: "#B8860B",
    accent: "#DAA520",
    text: "#5C3317",
  },
  elegant: {
    bg: ["#FFF5F5", "#F5E6D3"],
    primary: "#6B0F1A",
    secondary: "#8B6914",
    accent: "#C9A959",
    text: "#4A2C2A",
  },
  modern: {
    bg: ["#FFFDF7", "#FFF3E0"],
    primary: "#E65100",
    secondary: "#BF360C",
    accent: "#FF8F00",
    text: "#3E2723",
  },
  royal: {
    bg: ["#F8F0FF", "#EDE0F5"],
    primary: "#4A0072",
    secondary: "#B8860B",
    accent: "#FFD700",
    text: "#311B54",
  },
};

// marathi text variants for mixed language mode
export const MARATHI_TEXTS = {
  header: "|| श्री गणेशाय नमः ||",
  title: "श्री सत्यनारायण पूजा",
  subtitle: "आपणास सादर आमंत्रित",
  footer: "कृपया उपस्थित राहून आशीर्वाद द्यावे",
  prasad: "महाप्रसाद",
  puja: "पूजा",
  date_label: "दिनांक",
  time_label: "वेळ",
  venue_label: "स्थळ",
};

export const HINDI_TEXTS = {
  header: "|| श्री गणेशाय नमः ||",
  title: "श्री सत्यनारायण पूजा",
  subtitle: "आप सादर आमंत्रित हैं",
  footer: "कृपया उपस्थित होकर आशीर्वाद दें",
  prasad: "महाप्रसाद",
  puja: "पूजा",
  date_label: "दिनांक",
  time_label: "समय",
  venue_label: "स्थान",
};

// resolves template placeholders with collected data
export function resolveText(
  template: string,
  data: Record<string, unknown>,
  language?: string,
): string {
  let resolved = template;

  Object.entries(data).forEach(([key, value]) => {
    if (typeof value === "string" && value.trim()) {
      resolved = resolved.replace(new RegExp(`\\{\\{${key}\\}\\}`, "g"), value);
    }
  });

  // remove unfilled placeholders
  resolved = resolved.replace(/\{\{[^}]+\}\}/g, "").trim();

  // swap to marathi/hindi if needed
  if (language === "marathi") {
    if (template.includes("Shri Ganeshaya")) resolved = MARATHI_TEXTS.header;
    if (template === "Satyanarayan Puja") resolved = MARATHI_TEXTS.title;
    if (template === "You are cordially invited")
      resolved = MARATHI_TEXTS.subtitle;
    if (template.includes("ashirwad")) resolved = MARATHI_TEXTS.footer;
  }
  if (language === "hindi") {
    if (template.includes("Shri Ganeshaya")) resolved = HINDI_TEXTS.header;
    if (template === "Satyanarayan Puja") resolved = HINDI_TEXTS.title;
    if (template === "You are cordially invited")
      resolved = HINDI_TEXTS.subtitle;
    if (template.includes("ashirwad")) resolved = HINDI_TEXTS.footer;
  }

  return resolved;
}
