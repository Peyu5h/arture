// component registry for agent ui components

import type { UIComponentType, ComponentRegistryEntry, UIComponentProps } from "./types";
import { AgentDatePicker } from "./date-picker";
import { AgentVenueSelector } from "./venue-selector";
import { AgentStyleCarousel } from "./style-carousel";
import { AgentWizardForm } from "./wizard-form";
import { AgentChoiceSelector } from "./choice-selector";

// registry of all available agent ui components
export const componentRegistry: Record<UIComponentType, ComponentRegistryEntry> = {
  date_picker: {
    type: "date_picker",
    displayName: "Date Picker",
    description: "Select a date and optionally time",
    icon: "calendar",
    component: AgentDatePicker as React.ComponentType<UIComponentProps>,
  },
  venue_selector: {
    type: "venue_selector",
    displayName: "Venue Selector",
    description: "Search and select a location or venue",
    icon: "map-pin",
    component: AgentVenueSelector as React.ComponentType<UIComponentProps>,
  },
  style_carousel: {
    type: "style_carousel",
    displayName: "Style Carousel",
    description: "Browse and select visual themes or palettes",
    icon: "palette",
    component: AgentStyleCarousel as React.ComponentType<UIComponentProps>,
  },
  wizard_form: {
    type: "wizard_form",
    displayName: "Wizard Form",
    description: "Multi-step form for complex data entry",
    icon: "clipboard-list",
    component: AgentWizardForm as React.ComponentType<UIComponentProps>,
  },
  choice_selector: {
    type: "choice_selector",
    displayName: "Choice Selector",
    description: "Select one or multiple options from a list",
    icon: "list",
    component: AgentChoiceSelector as React.ComponentType<UIComponentProps>,
  },
  color_picker: {
    type: "color_picker",
    displayName: "Color Picker",
    description: "Select a color with presets",
    icon: "pipette",
    component: AgentChoiceSelector as React.ComponentType<UIComponentProps>,
  },
  time_picker: {
    type: "time_picker",
    displayName: "Time Picker",
    description: "Select a time",
    icon: "clock",
    component: AgentDatePicker as React.ComponentType<UIComponentProps>,
  },
  number_input: {
    type: "number_input",
    displayName: "Number Input",
    description: "Enter a numeric value",
    icon: "hash",
    component: AgentChoiceSelector as React.ComponentType<UIComponentProps>,
  },
  text_input: {
    type: "text_input",
    displayName: "Text Input",
    description: "Enter text or multiline content",
    icon: "text",
    component: AgentChoiceSelector as React.ComponentType<UIComponentProps>,
  },
  image_selector: {
    type: "image_selector",
    displayName: "Image Selector",
    description: "Select from a gallery of images",
    icon: "image",
    component: AgentChoiceSelector as React.ComponentType<UIComponentProps>,
  },
};

// gets component from registry
export function getComponent(type: UIComponentType): ComponentRegistryEntry | undefined {
  return componentRegistry[type];
}

// checks if component type is valid
export function isValidComponentType(type: string): type is UIComponentType {
  return type in componentRegistry;
}

// gets all available component types
export function getAvailableComponentTypes(): UIComponentType[] {
  return Object.keys(componentRegistry) as UIComponentType[];
}

// generates schema description for ai prompts
export function generateUIComponentSchema(): string {
  const components = getAvailableComponentTypes().map((type) => {
    const entry = componentRegistry[type];
    return `- ${type}: ${entry.description}`;
  });

  return `
UI Components Available:
${components.join("\n")}

To request a UI component, include in your response:
{
  "ui_component_request": {
    "componentType": "component_type",
    "props": { ... component specific props ... },
    "context": "Why you're asking for this input",
    "followUpPrompt": "What to do after user responds"
  }
}

Example - asking for a date:
{
  "message": "I'd be happy to help plan your event!",
  "ui_component_request": {
    "componentType": "date_picker",
    "props": {
      "title": "When is the event?",
      "description": "Select the date for your party",
      "showTime": true,
      "required": true
    },
    "context": "Need event date to create invitation",
    "followUpPrompt": "Great! Now setting the date to {value}..."
  }
}

Example - asking for style selection:
{
  "message": "Let me help you choose a visual style.",
  "ui_component_request": {
    "componentType": "style_carousel",
    "props": {
      "title": "Choose a theme",
      "options": [
        { "id": "modern", "name": "Modern", "colors": ["#1a1a2e", "#16213e", "#0f3460", "#e94560"] },
        { "id": "minimal", "name": "Minimal", "colors": ["#ffffff", "#f5f5f5", "#333333", "#000000"] },
        { "id": "vibrant", "name": "Vibrant", "colors": ["#ff6b6b", "#feca57", "#48dbfb", "#ff9ff3"] }
      ],
      "required": true
    }
  }
}
`.trim();
}
