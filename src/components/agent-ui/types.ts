// ui component types for agent generative components

export type UIComponentType =
  | "date_picker"
  | "venue_selector"
  | "style_carousel"
  | "wizard_form"
  | "choice_selector"
  | "color_picker"
  | "time_picker"
  | "number_input"
  | "text_input"
  | "image_selector";

// base props for all ui components
export interface BaseUIComponentProps {
  id: string;
  componentType: UIComponentType;
  title?: string;
  description?: string;
  required?: boolean;
  defaultValue?: unknown;
  onSubmit: (value: unknown) => void;
  onCancel?: () => void;
}

// date picker props
export interface DatePickerProps extends BaseUIComponentProps {
  componentType: "date_picker";
  minDate?: string;
  maxDate?: string;
  defaultValue?: string;
  showTime?: boolean;
  placeholder?: string;
}

// venue selector props
export interface VenueSelectorProps extends BaseUIComponentProps {
  componentType: "venue_selector";
  defaultValue?: VenueValue;
  suggestions?: VenueSuggestion[];
  allowCustom?: boolean;
  placeholder?: string;
  region?: string;
}

export interface VenueValue {
  name: string;
  address: string;
  placeId?: string;
  coordinates?: { lat: number; lng: number };
}

export interface VenueSuggestion {
  id: string;
  name: string;
  address: string;
  type?: string;
  rating?: number;
  photo?: string;
}

// style carousel props
export interface StyleCarouselProps extends BaseUIComponentProps {
  componentType: "style_carousel";
  options: StyleOption[];
  defaultValue?: string;
  columns?: number;
}

export interface StyleOption {
  id: string;
  name: string;
  preview: string;
  colors?: string[];
  description?: string;
  tags?: string[];
}

// wizard form props
export interface WizardFormProps extends BaseUIComponentProps {
  componentType: "wizard_form";
  steps: WizardStep[];
  defaultValues?: Record<string, unknown>;
}

export interface WizardStep {
  id: string;
  title: string;
  description?: string;
  fields: WizardField[];
}

export interface WizardField {
  id: string;
  type: "text" | "number" | "select" | "date" | "color" | "toggle" | "textarea";
  label: string;
  placeholder?: string;
  required?: boolean;
  defaultValue?: unknown;
  options?: Array<{ value: string; label: string }>;
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
    message?: string;
  };
}

// choice selector props
export interface ChoiceSelectorProps extends BaseUIComponentProps {
  componentType: "choice_selector";
  options: ChoiceOption[];
  multiple?: boolean;
  defaultValue?: string | string[];
  columns?: number;
}

export interface ChoiceOption {
  id: string;
  label: string;
  description?: string;
  icon?: string;
  image?: string;
  disabled?: boolean;
}

// color picker props
export interface ColorPickerProps extends BaseUIComponentProps {
  componentType: "color_picker";
  defaultValue?: string;
  presets?: string[];
  showInput?: boolean;
  showPresets?: boolean;
}

// time picker props
export interface TimePickerProps extends BaseUIComponentProps {
  componentType: "time_picker";
  defaultValue?: string;
  minTime?: string;
  maxTime?: string;
  step?: number;
  format?: "12h" | "24h";
}

// number input props
export interface NumberInputProps extends BaseUIComponentProps {
  componentType: "number_input";
  defaultValue?: number;
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
  placeholder?: string;
}

// text input props
export interface TextInputProps extends BaseUIComponentProps {
  componentType: "text_input";
  defaultValue?: string;
  placeholder?: string;
  multiline?: boolean;
  maxLength?: number;
  minLength?: number;
}

// image selector props
export interface ImageSelectorProps extends BaseUIComponentProps {
  componentType: "image_selector";
  options: ImageOption[];
  multiple?: boolean;
  defaultValue?: string | string[];
  columns?: number;
}

export interface ImageOption {
  id: string;
  url: string;
  thumbnail?: string;
  alt?: string;
  caption?: string;
}

// union type for all component props
export type UIComponentProps =
  | DatePickerProps
  | VenueSelectorProps
  | StyleCarouselProps
  | WizardFormProps
  | ChoiceSelectorProps
  | ColorPickerProps
  | TimePickerProps
  | NumberInputProps
  | TextInputProps
  | ImageSelectorProps;

// ui component request from ai
export interface UIComponentRequest {
  id: string;
  componentType: UIComponentType;
  props: Omit<UIComponentProps, "id" | "componentType" | "onSubmit" | "onCancel">;
  context?: string;
  followUpPrompt?: string;
}

// ui component response from user
export interface UIComponentResponse {
  requestId: string;
  componentType: UIComponentType;
  value: unknown;
  timestamp: number;
}

// registry entry
export interface ComponentRegistryEntry {
  type: UIComponentType;
  displayName: string;
  description: string;
  icon: string;
  component: React.ComponentType<UIComponentProps>;
}

// ai response with ui component
export interface AIResponseWithUI {
  message?: string;
  actions?: Array<{
    id: string;
    type: string;
    payload: Record<string, unknown>;
  }>;
  ui_component_request?: UIComponentRequest;
}
