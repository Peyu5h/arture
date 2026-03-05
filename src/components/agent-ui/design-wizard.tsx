"use client";

import { memo, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users,
  Palette,
  Type,
  Sparkles,
  Image as ImageIcon,
  Check,
  ChevronLeft,
  ChevronRight,
  X,
  Heart,
  Cake,
  Gift,
  Calendar as CalendarIcon,
  MapPin,
  MessageSquare,
  Wand2,
  Star,
  Sun,
  Zap,
  Leaf,
  Circle,
  Clock,
  CalendarDays,
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "~/lib/utils";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Textarea } from "~/components/ui/textarea";
import { Calendar } from "~/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "~/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import type { BaseUIComponentProps } from "./types";

// color palettes
const COLOR_PALETTES = [
  {
    id: "auto",
    name: "Auto",
    colors: ["#gradient"],
    description: "AI will choose the best colors",
  },
  {
    id: "elegant",
    name: "Elegant Gold",
    colors: ["#1a1a2e", "#d4af37", "#f5f5f5"],
    description: "Dark with gold accents",
  },
  {
    id: "romantic",
    name: "Romantic Pink",
    colors: ["#ffe5ec", "#ff6b9d", "#c9184a"],
    description: "Soft pink tones",
  },
  {
    id: "modern",
    name: "Modern Blue",
    colors: ["#0a192f", "#64ffda", "#ccd6f6"],
    description: "Dark blue with teal",
  },
  {
    id: "vibrant",
    name: "Vibrant Party",
    colors: ["#ff006e", "#ffbe0b", "#8338ec"],
    description: "Bold and colorful",
  },
  {
    id: "minimal",
    name: "Minimal B&W",
    colors: ["#ffffff", "#333333", "#e0e0e0"],
    description: "Clean black and white",
  },
];

// font pairings
const FONT_PAIRINGS = [
  {
    id: "auto",
    name: "Auto",
    heading: "AI Selected",
    body: "AI Selected",
    description: "AI will choose the best fonts",
  },
  {
    id: "elegant",
    name: "Classic Elegant",
    heading: "Playfair Display",
    body: "Lato",
    description: "Timeless serif + modern sans",
  },
  {
    id: "modern",
    name: "Modern Clean",
    heading: "Montserrat",
    body: "Open Sans",
    description: "Professional and clean",
  },
  {
    id: "playful",
    name: "Fun & Playful",
    heading: "Fredoka One",
    body: "Quicksand",
    description: "Bold and friendly",
  },
  {
    id: "romantic",
    name: "Romantic Script",
    heading: "Great Vibes",
    body: "Quicksand",
    description: "Elegant script + soft sans",
  },
];

// design styles with unique icons
const DESIGN_STYLES = [
  { id: "auto", name: "Auto", icon: Wand2, description: "AI will choose" },
  {
    id: "classic",
    name: "Classic",
    icon: Star,
    description: "Timeless design",
  },
  { id: "modern", name: "Modern", icon: Zap, description: "Contemporary look" },
  {
    id: "romantic",
    name: "Romantic",
    icon: Heart,
    description: "Soft and lovely",
  },
  { id: "rustic", name: "Rustic", icon: Leaf, description: "Natural vibe" },
  {
    id: "minimalist",
    name: "Minimalist",
    icon: Circle,
    description: "Clean & simple",
  },
  { id: "bohemian", name: "Bohemian", icon: Sun, description: "Free-spirited" },
];

// dynamic field types that AI can request
export type DynamicFieldType =
  | "name"
  | "age"
  | "couple_names"
  | "date"
  | "time"
  | "venue"
  | "theme"
  | "rsvp_details"
  | "event_name"
  | "tagline"
  | "details"
  | "gym_name"
  | "offer"
  | "schedule"
  | "contact"
  | "restaurant_name"
  | "cuisine"
  | "hours"
  | "address"
  | "artist"
  | "ticket_info"
  | "headline"
  | "subheadline"
  | "call_to_action";

// field config for dynamic rendering
interface FieldConfig {
  key: string;
  label: string;
  placeholder: string;
  icon: React.ComponentType<{ className?: string }>;
  required?: boolean;
  multiline?: boolean;
  inputType?: "text" | "date" | "time";
  optional?: boolean;
}

// mapping of field types to their configs
const FIELD_CONFIGS: Record<DynamicFieldType, FieldConfig> = {
  name: {
    key: "primaryText",
    label: "Name",
    placeholder: "Enter name",
    icon: Users,
    required: true,
  },
  age: {
    key: "secondaryText",
    label: "Age/Message",
    placeholder: "Turning 30!",
    icon: Cake,
    optional: true,
  },
  couple_names: {
    key: "primaryText",
    label: "Couple's Names",
    placeholder: "John & Jane",
    icon: Heart,
    required: true,
  },
  date: {
    key: "date",
    label: "Date",
    placeholder: "Select date",
    icon: CalendarDays,
    inputType: "date",
  },
  time: {
    key: "time",
    label: "Time",
    placeholder: "7:00 PM",
    icon: Clock,
    inputType: "time",
  },
  venue: {
    key: "venue",
    label: "Venue/Location",
    placeholder: "Enter location",
    icon: MapPin,
    optional: true,
  },
  theme: {
    key: "additionalInfo",
    label: "Theme/Style",
    placeholder: "Garden party, Formal, etc.",
    icon: Sparkles,
    optional: true,
  },
  rsvp_details: {
    key: "additionalInfo",
    label: "RSVP Details",
    placeholder: "RSVP by date, contact info",
    icon: MessageSquare,
    optional: true,
  },
  event_name: {
    key: "primaryText",
    label: "Event Name",
    placeholder: "Annual Gala 2024",
    icon: Star,
    required: true,
  },
  tagline: {
    key: "secondaryText",
    label: "Tagline",
    placeholder: "An evening to remember",
    icon: MessageSquare,
    optional: true,
  },
  details: {
    key: "additionalInfo",
    label: "Additional Details",
    placeholder: "Dress code, etc.",
    icon: MessageSquare,
    multiline: true,
    optional: true,
  },
  gym_name: {
    key: "primaryText",
    label: "Gym Name",
    placeholder: "FitZone Gym",
    icon: Zap,
    required: true,
  },
  offer: {
    key: "secondaryText",
    label: "Offer/Promo",
    placeholder: "50% OFF First Month!",
    icon: Star,
    optional: true,
  },
  schedule: {
    key: "additionalInfo",
    label: "Schedule/Hours",
    placeholder: "Mon-Fri 6AM-10PM",
    icon: Clock,
    optional: true,
  },
  contact: {
    key: "venue",
    label: "Contact/Address",
    placeholder: "123 Main St, (555) 123-4567",
    icon: MapPin,
    optional: true,
  },
  restaurant_name: {
    key: "primaryText",
    label: "Restaurant Name",
    placeholder: "The Golden Fork",
    icon: Star,
    required: true,
  },
  cuisine: {
    key: "secondaryText",
    label: "Cuisine Type",
    placeholder: "Italian, Mexican, etc.",
    icon: Leaf,
    optional: true,
  },
  hours: {
    key: "additionalInfo",
    label: "Hours",
    placeholder: "Open 11AM-10PM",
    icon: Clock,
    optional: true,
  },
  address: {
    key: "venue",
    label: "Address",
    placeholder: "123 Food Street",
    icon: MapPin,
    optional: true,
  },
  artist: {
    key: "primaryText",
    label: "Artist/Band Name",
    placeholder: "The Rockers",
    icon: Star,
    required: true,
  },
  ticket_info: {
    key: "additionalInfo",
    label: "Ticket Info",
    placeholder: "$25 at door, $20 online",
    icon: Star,
    optional: true,
  },
  headline: {
    key: "primaryText",
    label: "Headline",
    placeholder: "Grand Opening!",
    icon: Star,
    required: true,
  },
  subheadline: {
    key: "secondaryText",
    label: "Subheadline",
    placeholder: "Join us for the celebration",
    icon: MessageSquare,
    optional: true,
  },
  call_to_action: {
    key: "additionalInfo",
    label: "Call to Action",
    placeholder: "Visit us today!",
    icon: Zap,
    optional: true,
  },
};

export interface DesignWizardProps extends Omit<
  BaseUIComponentProps,
  "componentType"
> {
  componentType: "design_wizard";
  designType:
    | "wedding"
    | "birthday"
    | "event"
    | "poster"
    | "card"
    | "gym"
    | "restaurant"
    | "music"
    | "tech"
    | "sports"
    | "generic";
  prefilledData?: Partial<DesignRequirements>;
  fields?: DynamicFieldType[];
}

export interface DesignRequirements {
  // basic info
  primaryText?: string;
  secondaryText?: string;
  date?: string;
  time?: string;
  venue?: string;
  additionalInfo?: string;

  // style
  colorPalette?: (typeof COLOR_PALETTES)[0];
  fontPairing?: (typeof FONT_PAIRINGS)[0];
  designStyle?: (typeof DESIGN_STYLES)[0] | string;

  // elements
  includeImages?: boolean;
  imageKeywords?: string[];
  includeDecorations?: boolean;

  // background
  backgroundStyle?: "solid" | "gradient" | "image";
}

type WizardStep = "info" | "colors" | "typography" | "style" | "extras";

const STEP_ORDER: WizardStep[] = [
  "info",
  "colors",
  "typography",
  "style",
  "extras",
];

const STEP_CONFIG: Record<
  WizardStep,
  { icon: React.ComponentType<{ className?: string }> }
> = {
  info: { icon: Users },
  colors: { icon: Palette },
  typography: { icon: Type },
  style: { icon: Sparkles },
  extras: { icon: ImageIcon },
};

// get default fields for a design type when AI doesn't specify
function getDefaultFieldsForType(type: string): DynamicFieldType[] {
  switch (type) {
    case "wedding":
      return ["couple_names", "date", "time", "venue", "rsvp_details"];
    case "birthday":
      return ["name", "age", "date", "time", "venue", "theme"];
    case "event":
      return ["event_name", "tagline", "date", "time", "venue", "details"];
    case "gym":
      return ["gym_name", "offer", "schedule", "contact"];
    case "restaurant":
      return ["restaurant_name", "cuisine", "offer", "hours", "address"];
    case "music":
      return ["artist", "event_name", "date", "venue", "ticket_info"];
    case "poster":
      return ["headline", "subheadline", "details", "call_to_action"];
    default:
      return ["headline", "subheadline", "date", "venue", "details"];
  }
}

// dynamic labels based on design type
function getLabelsForType(type: string) {
  switch (type) {
    case "wedding":
      return {
        primaryText: "Couple's Names",
        primaryPlaceholder: "John & Jane",
        secondaryText: "Wedding Tagline",
        secondaryPlaceholder: "Together Forever",
        dateLabel: "Wedding Date",
        venueLabel: "Venue",
        additionalLabel: "RSVP / Additional Details",
        decorativeKeywords:
          "wedding, flowers, rings, hearts, elegant, romantic",
      };
    case "birthday":
      return {
        primaryText: "Name",
        primaryPlaceholder: "Happy Birthday Sarah!",
        secondaryText: "Age / Message",
        secondaryPlaceholder: "Turning 30!",
        dateLabel: "Party Date",
        venueLabel: "Location",
        additionalLabel: "Additional Info",
        decorativeKeywords:
          "birthday, balloons, cake, confetti, party, celebration",
      };
    case "event":
      return {
        primaryText: "Event Name",
        primaryPlaceholder: "Annual Gala 2024",
        secondaryText: "Tagline",
        secondaryPlaceholder: "An evening to remember",
        dateLabel: "Event Date",
        venueLabel: "Venue",
        additionalLabel: "Additional Details",
        decorativeKeywords: "event, celebration, party, decorative, elegant",
      };
    case "gym":
      return {
        primaryText: "Gym Name",
        primaryPlaceholder: "FitZone Gym",
        secondaryText: "Offer/Promo",
        secondaryPlaceholder: "50% OFF First Month!",
        dateLabel: "Schedule",
        venueLabel: "Contact/Address",
        additionalLabel: "Additional Info",
        decorativeKeywords: "gym, fitness, workout, strong, energy, motivation",
      };
    case "restaurant":
      return {
        primaryText: "Restaurant Name",
        primaryPlaceholder: "The Golden Fork",
        secondaryText: "Cuisine/Offer",
        secondaryPlaceholder: "Authentic Italian",
        dateLabel: "Hours",
        venueLabel: "Address",
        additionalLabel: "Special Offers",
        decorativeKeywords: "food, restaurant, delicious, cuisine, dining",
      };
    case "music":
      return {
        primaryText: "Artist/Band",
        primaryPlaceholder: "The Rockers",
        secondaryText: "Event Name",
        secondaryPlaceholder: "Live in Concert",
        dateLabel: "Date & Time",
        venueLabel: "Venue",
        additionalLabel: "Ticket Info",
        decorativeKeywords: "music, concert, band, dj, stage, lights",
      };
    case "poster":
      return {
        primaryText: "Main Heading",
        primaryPlaceholder: "Grand Opening!",
        secondaryText: "Subtitle",
        secondaryPlaceholder: "Join us for the celebration",
        dateLabel: "Date",
        venueLabel: "Location",
        additionalLabel: "Additional Info",
        decorativeKeywords: "decorative, shapes, modern, graphic",
      };
    default:
      return {
        primaryText: "Main Text",
        primaryPlaceholder: "Your main heading",
        secondaryText: "Subtitle",
        secondaryPlaceholder: "Your subtitle",
        dateLabel: "Date",
        venueLabel: "Location",
        additionalLabel: "Additional Info",
        decorativeKeywords: "decorative, shapes, abstract",
      };
  }
}

export const AgentDesignWizard = memo(function AgentDesignWizard({
  id,
  title,
  description,
  designType = "generic",
  prefilledData,
  fields,
  onSubmit,
  onCancel,
}: DesignWizardProps) {
  const [currentStep, setCurrentStep] = useState<WizardStep>("info");
  const [data, setData] = useState<DesignRequirements>({
    colorPalette: COLOR_PALETTES[0], // Auto
    fontPairing: FONT_PAIRINGS[0], // Auto
    designStyle: DESIGN_STYLES[0], // Auto
    includeDecorations: true, // Enable decorations by default
    includeImages: false,
    backgroundStyle: "gradient",
    ...prefilledData,
  });
  const [direction, setDirection] = useState(0);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // use AI-provided fields or fall back to defaults for design type
  // validate and filter fields to ensure they're valid DynamicFieldType
  const validFields = fields
    ? fields.filter((f) => typeof f === "string" && f in FIELD_CONFIGS)
    : [];
  const activeFields =
    validFields.length > 0 ? validFields : getDefaultFieldsForType(designType);

  const labels = getLabelsForType(designType);
  const currentStepIndex = STEP_ORDER.indexOf(currentStep);
  const isFirstStep = currentStepIndex === 0;
  const isLastStep = currentStepIndex === STEP_ORDER.length - 1;
  const progress = ((currentStepIndex + 1) / STEP_ORDER.length) * 100;

  // smart suggestions based on design type
  const getSuggestions = (field: string): string[] => {
    const suggestions: any = {
      wedding: {
        primaryText: ["John & Jane", "Emma & Michael", "Sarah & David"],
        secondaryText: [
          "Together Forever",
          "are getting married",
          "invite you to celebrate",
        ],
        venue: [
          "Grand Hotel Ballroom",
          "Sunset Beach Resort",
          "Garden Terrace",
        ],
      },
      birthday: {
        primaryText: ["Happy Birthday!", "Let's Celebrate!", "Join the Party!"],
        secondaryText: [
          "Turning 30!",
          "Another Year Older!",
          "It's Party Time!",
        ],
        venue: ["Home Sweet Home", "City Park", "Downtown Restaurant"],
      },
      event: {
        primaryText: ["Annual Gala 2024", "Grand Opening", "Join Us"],
        secondaryText: [
          "An Evening to Remember",
          "Celebrating Success",
          "A Special Night",
        ],
        venue: ["Convention Center", "Grand Ballroom", "Downtown Venue"],
      },
      poster: {
        primaryText: ["GRAND OPENING", "BIG SALE", "JOIN US TODAY"],
        secondaryText: [
          "Don't Miss Out!",
          "Limited Time Only",
          "Be Part of It",
        ],
        venue: ["123 Main Street", "City Center", "Downtown"],
      },
    };

    const typeKey = designType in suggestions ? designType : "event";
    return suggestions[typeKey]?.[field] || [];
  };

  const updateData = useCallback((updates: Partial<DesignRequirements>) => {
    setData((prev) => ({ ...prev, ...updates }));
  }, []);

  const handleNext = useCallback(() => {
    if (isLastStep) {
      onSubmit(data);
    } else {
      setDirection(1);
      setCurrentStep(STEP_ORDER[currentStepIndex + 1]);
    }
  }, [isLastStep, currentStepIndex, data, onSubmit]);

  const handlePrev = useCallback(() => {
    if (!isFirstStep) {
      setDirection(-1);
      setCurrentStep(STEP_ORDER[currentStepIndex - 1]);
    }
  }, [isFirstStep, currentStepIndex]);

  const slideVariants = {
    enter: (direction: number) => ({ x: direction > 0 ? 20 : -20, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (direction: number) => ({ x: direction < 0 ? 20 : -20, opacity: 0 }),
  };

  // date picker state
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(
    data.date ? new Date(data.date) : undefined,
  );

  // time options
  const timeOptions = [
    "9:00 AM",
    "10:00 AM",
    "11:00 AM",
    "12:00 PM",
    "1:00 PM",
    "2:00 PM",
    "3:00 PM",
    "4:00 PM",
    "5:00 PM",
    "6:00 PM",
    "7:00 PM",
    "8:00 PM",
    "9:00 PM",
    "10:00 PM",
  ];

  // render info step
  // render a single dynamic field
  const renderDynamicField = (fieldType: DynamicFieldType, index: number) => {
    const config = FIELD_CONFIGS[fieldType];
    if (!config) return null;

    const IconComponent = config.icon;
    const value = (data as any)[config.key] || "";

    // render date picker
    if (config.inputType === "date") {
      return (
        <div key={fieldType} className="space-y-2">
          <Label
            htmlFor={fieldType}
            className="flex items-center gap-1.5 text-xs"
          >
            <IconComponent className="text-primary h-3 w-3" />
            {config.label}
            {config.optional && (
              <span className="text-muted-foreground ml-1 text-[10px]">
                (optional)
              </span>
            )}
          </Label>
          <Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "h-9 w-full justify-start text-left text-xs font-normal",
                  !selectedDate && "text-muted-foreground",
                )}
              >
                <CalendarDays className="mr-2 h-3 w-3" />
                {selectedDate
                  ? format(selectedDate, "PPP")
                  : config.placeholder}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(date) => {
                  setSelectedDate(date);
                  if (date) {
                    updateData({ [config.key]: format(date, "PPP") });
                  }
                  setDatePickerOpen(false);
                }}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>
      );
    }

    // render time picker
    if (config.inputType === "time") {
      return (
        <div key={fieldType} className="space-y-2">
          <Label
            htmlFor={fieldType}
            className="flex items-center gap-1.5 text-xs"
          >
            <IconComponent className="text-primary h-3 w-3" />
            {config.label}
            {config.optional && (
              <span className="text-muted-foreground ml-1 text-[10px]">
                (optional)
              </span>
            )}
          </Label>
          <Select
            value={value}
            onValueChange={(val) => updateData({ [config.key]: val })}
          >
            <SelectTrigger className="h-9 text-xs">
              <SelectValue placeholder={config.placeholder} />
            </SelectTrigger>
            <SelectContent>
              {timeOptions.map((time) => (
                <SelectItem key={time} value={time} className="text-xs">
                  {time}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      );
    }

    return (
      <div key={fieldType} className="space-y-2">
        <Label
          htmlFor={fieldType}
          className="flex items-center gap-1.5 text-xs"
        >
          <IconComponent className="text-primary h-3 w-3" />
          {config.label}
          {config.required && <span className="text-destructive">*</span>}
          {config.optional && (
            <span className="text-muted-foreground ml-1 text-[10px]">
              (optional)
            </span>
          )}
        </Label>
        {config.multiline ? (
          <Textarea
            id={fieldType}
            placeholder={config.placeholder}
            value={value}
            onChange={(e) => updateData({ [config.key]: e.target.value })}
            className="min-h-[60px] text-xs"
          />
        ) : (
          <Input
            id={fieldType}
            placeholder={config.placeholder}
            value={value}
            onChange={(e) => updateData({ [config.key]: e.target.value })}
            className="text-xs"
            required={config.required}
          />
        )}
      </div>
    );
  };

  const renderInfoStep = () => (
    <div className="space-y-3">
      {activeFields.map((fieldType, index) =>
        renderDynamicField(fieldType, index),
      )}
    </div>
  );

  // render colors step
  const renderColorsStep = () => (
    <div className="space-y-3">
      <p className="text-muted-foreground text-xs">
        Choose colors or skip for AI selection
      </p>
      <div className="grid grid-cols-2 gap-2">
        {COLOR_PALETTES.map((palette) => (
          <button
            key={palette.id}
            onClick={() => updateData({ colorPalette: palette })}
            className={cn(
              "border-border hover:border-primary/50 relative overflow-hidden rounded-lg border p-3 text-left transition-all",
              data.colorPalette?.id === palette.id &&
                "border-primary ring-primary/20 ring-2",
            )}
          >
            {palette.id === "auto" ? (
              <div className="from-primary/20 to-primary/5 flex h-8 items-center justify-center rounded bg-gradient-to-r">
                <Wand2 className="text-primary h-4 w-4" />
              </div>
            ) : (
              <div className="flex gap-1">
                {palette.colors.map((color, idx) => (
                  <div
                    key={idx}
                    className="h-8 flex-1 rounded"
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            )}
            <p className="text-foreground mt-2 text-xs font-medium">
              {palette.name}
            </p>
            <p className="text-muted-foreground text-[10px]">
              {palette.description}
            </p>
            {data.colorPalette?.id === palette.id && (
              <div className="bg-primary absolute top-1 right-1 flex h-5 w-5 items-center justify-center rounded-full">
                <Check className="h-3 w-3 text-white" />
              </div>
            )}
          </button>
        ))}
      </div>

      <div className="space-y-2">
        <Label className="text-xs">Background Style</Label>
        <div className="grid grid-cols-3 gap-2">
          {(["solid", "gradient", "image"] as const).map((style) => (
            <button
              key={style}
              onClick={() => updateData({ backgroundStyle: style })}
              className={cn(
                "border-border hover:border-primary/50 rounded-lg border p-2 text-xs capitalize transition-all",
                data.backgroundStyle === style &&
                  "border-primary bg-primary/5 ring-primary/20 ring-1",
              )}
            >
              {style}
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  // render typography step
  const renderTypographyStep = () => (
    <div className="space-y-3">
      <p className="text-muted-foreground text-xs">
        Choose fonts or skip for AI selection
      </p>
      <div className="space-y-2">
        {FONT_PAIRINGS.map((pairing) => (
          <button
            key={pairing.id}
            onClick={() => updateData({ fontPairing: pairing })}
            className={cn(
              "border-border hover:border-primary/50 relative w-full rounded-lg border p-3 text-left transition-all",
              data.fontPairing?.id === pairing.id &&
                "border-primary ring-primary/20 ring-2",
            )}
          >
            {pairing.id === "auto" ? (
              <div className="flex items-center gap-2">
                <Wand2 className="text-primary h-4 w-4" />
                <div>
                  <p className="text-foreground text-sm font-medium">
                    {pairing.name}
                  </p>
                  <p className="text-muted-foreground text-xs">
                    {pairing.description}
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-foreground text-sm font-medium">
                    {pairing.name}
                  </p>
                  <p className="text-muted-foreground text-xs">
                    {pairing.description}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-foreground text-xs">{pairing.heading}</p>
                  <p className="text-muted-foreground text-[10px]">
                    + {pairing.body}
                  </p>
                </div>
              </div>
            )}
            {data.fontPairing?.id === pairing.id && (
              <div className="bg-primary absolute top-2 right-2 flex h-5 w-5 items-center justify-center rounded-full">
                <Check className="h-3 w-3 text-white" />
              </div>
            )}
          </button>
        ))}
      </div>
    </div>
  );

  // render style step
  const renderStyleStep = () => (
    <div className="space-y-3">
      <p className="text-muted-foreground text-xs">
        Choose style or skip for AI selection
      </p>
      <div className="grid grid-cols-3 gap-2">
        {DESIGN_STYLES.map((style) => {
          const IconComponent = style.icon;
          return (
            <button
              key={style.id}
              onClick={() => updateData({ designStyle: style })}
              className={cn(
                "border-border hover:border-primary/50 flex flex-col items-center gap-2 rounded-lg border p-3 transition-all",
                typeof data.designStyle === "object" &&
                  (data.designStyle as any)?.id === style.id &&
                  "border-primary bg-primary/5 ring-primary/20 ring-2",
              )}
            >
              <IconComponent
                className={cn(
                  "h-6 w-6",
                  style.id === "auto" ? "text-primary" : "text-foreground",
                )}
              />
              <div className="text-center">
                <span className="text-foreground text-xs font-medium">
                  {style.name}
                </span>
                <p className="text-muted-foreground text-[10px]">
                  {style.description}
                </p>
              </div>
              {typeof data.designStyle === "object" &&
                (data.designStyle as any)?.id === style.id && (
                  <div className="bg-primary absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full">
                    <Check className="h-2.5 w-2.5 text-white" />
                  </div>
                )}
            </button>
          );
        })}
      </div>
    </div>
  );

  // render extras step
  const renderExtrasStep = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <Label className="text-xs">Include decorative elements?</Label>
          <p className="text-muted-foreground text-[10px]">
            AI will add relevant stickers/vectors
          </p>
        </div>
        <button
          onClick={() =>
            updateData({ includeDecorations: !data.includeDecorations })
          }
          className={cn(
            "relative h-6 w-11 shrink-0 rounded-full transition-colors",
            data.includeDecorations ? "bg-primary" : "bg-muted",
          )}
        >
          <span
            className={cn(
              "absolute top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-white shadow-sm transition-transform",
              data.includeDecorations ? "left-[22px]" : "left-0.5",
            )}
          >
            {data.includeDecorations && (
              <Check className="text-primary h-3 w-3" />
            )}
          </span>
        </button>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <Label className="text-xs">Include images?</Label>
          <p className="text-muted-foreground text-[10px]">
            AI will add relevant photos
          </p>
        </div>
        <button
          onClick={() => updateData({ includeImages: !data.includeImages })}
          className={cn(
            "relative h-6 w-11 shrink-0 rounded-full transition-colors",
            data.includeImages ? "bg-primary" : "bg-muted",
          )}
        >
          <span
            className={cn(
              "absolute top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-white shadow-sm transition-transform",
              data.includeImages ? "left-[22px]" : "left-0.5",
            )}
          >
            {data.includeImages && <Check className="text-primary h-3 w-3" />}
          </span>
        </button>
      </div>

      {/* summary */}
      <div className="bg-muted/30 rounded-lg p-3">
        <p className="text-foreground mb-2 text-xs font-medium">
          Ready to Create
        </p>
        <p className="text-muted-foreground text-[10px]">
          AI will create a {designType} design with{" "}
          {data.includeDecorations ? "decorations" : "no decorations"} and{" "}
          {data.includeImages ? "images" : "no images"}.
          {data.colorPalette?.id === "auto" && " Colors will be auto-selected."}
          {data.fontPairing?.id === "auto" && " Fonts will be auto-selected."}
          {typeof data.designStyle === "object" &&
            (data.designStyle as any)?.id === "auto" &&
            " Style will be auto-selected."}
        </p>
      </div>
    </div>
  );

  const renderCurrentStep = () => {
    switch (currentStep) {
      case "info":
        return renderInfoStep();
      case "colors":
        return renderColorsStep();
      case "typography":
        return renderTypographyStep();
      case "style":
        return renderStyleStep();
      case "extras":
        return renderExtrasStep();
      default:
        return null;
    }
  };

  const wizardTitle =
    title ||
    `Create ${designType.charAt(0).toUpperCase() + designType.slice(1)} Design`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="border-border/40 from-muted/40 to-muted/20 w-full space-y-3 rounded-xl border bg-gradient-to-b p-4 shadow-sm"
    >
      {/* header */}
      <div className="space-y-1 pb-2">
        <h4 className="text-foreground flex items-center gap-2 text-sm font-semibold">
          <div className="bg-primary/10 flex h-6 w-6 shrink-0 items-center justify-center rounded-md">
            <Sparkles className="text-primary h-3.5 w-3.5" />
          </div>
          <span className="truncate">{wizardTitle}</span>
        </h4>
        {description && (
          <p className="text-muted-foreground truncate pl-8 text-xs">
            {description}
          </p>
        )}
      </div>

      {/* progress */}
      <div className="space-y-2">
        <div className="bg-muted h-1 overflow-hidden rounded-full">
          <motion.div
            className="from-primary to-primary/80 h-full rounded-full bg-gradient-to-r"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
        <div className="flex justify-between px-1">
          {STEP_ORDER.map((step, idx) => {
            const IconComponent = STEP_CONFIG[step].icon;
            return (
              <button
                key={step}
                onClick={() => {
                  setDirection(idx > currentStepIndex ? 1 : -1);
                  setCurrentStep(step);
                }}
                className={cn(
                  "flex h-7 w-7 items-center justify-center rounded-full transition-all",
                  idx <= currentStepIndex
                    ? "bg-primary text-white"
                    : "bg-muted text-muted-foreground hover:bg-muted/80",
                  idx === currentStepIndex && "ring-primary/30 ring-2",
                )}
              >
                <IconComponent className="h-3.5 w-3.5" />
              </button>
            );
          })}
        </div>
      </div>

      {/* step content */}
      <AnimatePresence mode="wait" custom={direction}>
        <motion.div
          key={currentStep}
          custom={direction}
          variants={slideVariants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ duration: 0.2 }}
          className="min-h-[240px]"
        >
          {renderCurrentStep()}
        </motion.div>
      </AnimatePresence>

      {/* navigation */}
      <div className="border-border/30 flex gap-2 border-t pt-3">
        {!isFirstStep && (
          <Button
            variant="outline"
            size="sm"
            onClick={handlePrev}
            className="bg-background/50"
          >
            <ChevronLeft className="mr-1 h-4 w-4" />
            Back
          </Button>
        )}

        <Button
          size="sm"
          onClick={handleNext}
          className="bg-primary hover:bg-primary/90 flex-1"
        >
          {isLastStep ? (
            <>
              <Check className="mr-1 h-4 w-4" />
              Create Design
            </>
          ) : (
            <>
              Next
              <ChevronRight className="ml-1 h-4 w-4" />
            </>
          )}
        </Button>

        {onCancel && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onCancel}
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      <p className="text-muted-foreground/70 text-center text-[10px]">
        Step {currentStepIndex + 1} of {STEP_ORDER.length}
      </p>
    </motion.div>
  );
});

export default AgentDesignWizard;
