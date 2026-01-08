// component registry for agent ui components

import type {
  UIComponentType,
  ComponentRegistryEntry,
  UIComponentProps,
} from "./types";
import { AgentDatePicker } from "./date-picker";
import { AgentVenueSelector } from "./venue-selector";
import { AgentStyleCarousel } from "./style-carousel";
import { AgentWizardForm } from "./wizard-form";
import { AgentChoiceSelector } from "./choice-selector";
import { AgentTemplateGallery } from "./template-gallery";
import { AgentDesignWizard } from "./design-wizard";

// registry of all available agent ui components
export const componentRegistry: Record<
  UIComponentType,
  ComponentRegistryEntry
> = {
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
  template_gallery: {
    type: "template_gallery",
    displayName: "Template Gallery",
    description: "Browse and select from available templates",
    icon: "layout-template",
    component: AgentTemplateGallery as React.ComponentType<UIComponentProps>,
  },
  design_wizard: {
    type: "design_wizard",
    displayName: "Design Wizard",
    description: "Multi-step wizard for collecting design requirements",
    icon: "sparkles",
    component: AgentDesignWizard as React.ComponentType<UIComponentProps>,
  },
};

// gets component from registry
export function getComponent(
  type: UIComponentType,
): ComponentRegistryEntry | undefined {
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

Example - Template Gallery (for showing templates or starting from scratch):
{
  "message": "I found some wedding invitation templates for you!",
  "ui_component_request": {
    "componentType": "template_gallery",
    "props": {
      "title": "Choose a Template",
      "templates": [{"id": "t1", "name": "Elegant Gold", "thumbnail": "..."}],
      "category": "invitations",
      "allowScratch": true
    },
    "followUpPrompt": "Using template {templateName}..."
  }
}

Example - Design Wizard (for collecting design requirements from scratch):
{
  "message": "Let's create your wedding invitation! I'll need a few details.",
  "ui_component_request": {
    "componentType": "design_wizard",
    "props": {
      "title": "Wedding Invitation Details",
      "designType": "wedding",
      "description": "Fill in the details for your invitation"
    },
    "followUpPrompt": "Creating your wedding invitation with these details..."
  }
}

Example - Date Picker:
{
  "message": "When is your event?",
  "ui_component_request": {
    "componentType": "date_picker",
    "props": {
      "title": "Event Date",
      "showTime": true,
      "required": true
    }
  }
}

Example - Style Carousel (for theme selection):
{
  "message": "Choose a visual style for your design.",
  "ui_component_request": {
    "componentType": "style_carousel",
    "props": {
      "title": "Choose a theme",
      "options": [
        { "id": "modern", "name": "Modern", "colors": ["#1a1a2e", "#e94560"], "preview": "" },
        { "id": "minimal", "name": "Minimal", "colors": ["#ffffff", "#333333"], "preview": "" }
      ],
      "required": true
    }
  }
}

IMPORTANT - Design Flow:
1. For design requests (invitations, posters, etc.), first use search_templates action
2. If templates found, show template_gallery UI component
3. If no templates or user chooses "Start from Scratch", show design_wizard
4. After wizard completion, execute canvas actions to build the design
`.trim();
}
