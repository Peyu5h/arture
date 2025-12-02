use serde::{Deserialize, Serialize};
use wasm_bindgen::prelude::*;

#[derive(Clone, Copy, Debug, PartialEq, Eq, Serialize, Deserialize)]
pub enum FilterType {
    Grayscale,
    Sepia,
    Invert,
    Brightness,
    Contrast,
    Saturation,
    Blur,
    Sharpen,
    Vignette,
    Vintage,
    Warm,
    Cool,
    Posterize,
    Emboss,
    EdgeDetect,
    Noise,
    Pixelate,
    ChromaticAberration,
}

impl FilterType {
    pub fn as_str(&self) -> &'static str {
        match self {
            FilterType::Grayscale => "grayscale",
            FilterType::Sepia => "sepia",
            FilterType::Invert => "invert",
            FilterType::Brightness => "brightness",
            FilterType::Contrast => "contrast",
            FilterType::Saturation => "saturation",
            FilterType::Blur => "blur",
            FilterType::Sharpen => "sharpen",
            FilterType::Vignette => "vignette",
            FilterType::Vintage => "vintage",
            FilterType::Warm => "warm",
            FilterType::Cool => "cool",
            FilterType::Posterize => "posterize",
            FilterType::Emboss => "emboss",
            FilterType::EdgeDetect => "edge_detect",
            FilterType::Noise => "noise",
            FilterType::Pixelate => "pixelate",
            FilterType::ChromaticAberration => "chromatic_aberration",
        }
    }

    pub fn from_string(s: &str) -> Option<FilterType> {
        match s {
            "grayscale" => Some(FilterType::Grayscale),
            "sepia" => Some(FilterType::Sepia),
            "invert" => Some(FilterType::Invert),
            "brightness" => Some(FilterType::Brightness),
            "contrast" => Some(FilterType::Contrast),
            "saturation" => Some(FilterType::Saturation),
            "blur" => Some(FilterType::Blur),
            "sharpen" => Some(FilterType::Sharpen),
            "vignette" => Some(FilterType::Vignette),
            "vintage" => Some(FilterType::Vintage),
            "warm" => Some(FilterType::Warm),
            "cool" => Some(FilterType::Cool),
            "posterize" => Some(FilterType::Posterize),
            "emboss" => Some(FilterType::Emboss),
            "edge_detect" => Some(FilterType::EdgeDetect),
            "noise" => Some(FilterType::Noise),
            "pixelate" => Some(FilterType::Pixelate),
            "chromatic_aberration" => Some(FilterType::ChromaticAberration),
            _ => None,
        }
    }
}

#[wasm_bindgen]
pub struct FilterMetadata {
    name: String,
    description: String,
    category: String,
    default_intensity: f32,
    min_intensity: f32,
    max_intensity: f32,
}

#[wasm_bindgen]
impl FilterMetadata {
    #[wasm_bindgen(constructor)]
    pub fn new(
        name: String,
        description: String,
        category: String,
        default_intensity: f32,
        min_intensity: f32,
        max_intensity: f32,
    ) -> Self {
        Self {
            name,
            description,
            category,
            default_intensity,
            min_intensity,
            max_intensity,
        }
    }

    #[wasm_bindgen(getter)]
    pub fn name(&self) -> String {
        self.name.clone()
    }

    #[wasm_bindgen(getter)]
    pub fn description(&self) -> String {
        self.description.clone()
    }

    #[wasm_bindgen(getter)]
    pub fn category(&self) -> String {
        self.category.clone()
    }

    #[wasm_bindgen(getter)]
    pub fn default_intensity(&self) -> f32 {
        self.default_intensity
    }

    #[wasm_bindgen(getter)]
    pub fn min_intensity(&self) -> f32 {
        self.min_intensity
    }

    #[wasm_bindgen(getter)]
    pub fn max_intensity(&self) -> f32 {
        self.max_intensity
    }
}

#[wasm_bindgen]
pub fn get_filter_metadata(filter_type: &str) -> Option<FilterMetadata> {
    match filter_type {
        "grayscale" => Some(FilterMetadata::new(
            "Grayscale".into(),
            "Convert image to black and white".into(),
            "color".into(),
            1.0,
            0.0,
            1.0,
        )),
        "sepia" => Some(FilterMetadata::new(
            "Sepia".into(),
            "Apply warm brownish tone".into(),
            "color".into(),
            1.0,
            0.0,
            1.0,
        )),
        "invert" => Some(FilterMetadata::new(
            "Invert".into(),
            "Invert all colors".into(),
            "color".into(),
            1.0,
            0.0,
            1.0,
        )),
        "brightness" => Some(FilterMetadata::new(
            "Brightness".into(),
            "Adjust image brightness".into(),
            "adjustment".into(),
            0.5,
            0.0,
            1.0,
        )),
        "contrast" => Some(FilterMetadata::new(
            "Contrast".into(),
            "Adjust image contrast".into(),
            "adjustment".into(),
            0.5,
            0.0,
            1.0,
        )),
        "saturation" => Some(FilterMetadata::new(
            "Saturation".into(),
            "Adjust color saturation".into(),
            "adjustment".into(),
            0.5,
            0.0,
            1.0,
        )),
        "blur" => Some(FilterMetadata::new(
            "Blur".into(),
            "Apply gaussian blur".into(),
            "effect".into(),
            0.3,
            0.0,
            1.0,
        )),
        "sharpen" => Some(FilterMetadata::new(
            "Sharpen".into(),
            "Enhance edge details".into(),
            "effect".into(),
            0.5,
            0.0,
            1.0,
        )),
        "vignette" => Some(FilterMetadata::new(
            "Vignette".into(),
            "Darken image edges".into(),
            "effect".into(),
            0.5,
            0.0,
            1.0,
        )),
        "vintage" => Some(FilterMetadata::new(
            "Vintage".into(),
            "Apply retro film look".into(),
            "preset".into(),
            1.0,
            0.0,
            1.0,
        )),
        "warm" => Some(FilterMetadata::new(
            "Warm".into(),
            "Add warm orange tones".into(),
            "color".into(),
            0.5,
            0.0,
            1.0,
        )),
        "cool" => Some(FilterMetadata::new(
            "Cool".into(),
            "Add cool blue tones".into(),
            "color".into(),
            0.5,
            0.0,
            1.0,
        )),
        "posterize" => Some(FilterMetadata::new(
            "Posterize".into(),
            "Reduce color levels".into(),
            "artistic".into(),
            0.5,
            0.0,
            1.0,
        )),
        "emboss" => Some(FilterMetadata::new(
            "Emboss".into(),
            "Create raised surface effect".into(),
            "artistic".into(),
            0.5,
            0.0,
            1.0,
        )),
        "edge_detect" => Some(FilterMetadata::new(
            "Edge Detect".into(),
            "Highlight edges in image".into(),
            "artistic".into(),
            0.5,
            0.0,
            1.0,
        )),
        "noise" => Some(FilterMetadata::new(
            "Noise".into(),
            "Add film grain effect".into(),
            "effect".into(),
            0.3,
            0.0,
            1.0,
        )),
        "pixelate" => Some(FilterMetadata::new(
            "Pixelate".into(),
            "Create pixel art effect".into(),
            "artistic".into(),
            0.3,
            0.0,
            1.0,
        )),
        "chromatic_aberration" => Some(FilterMetadata::new(
            "Chromatic Aberration".into(),
            "Add color fringing effect".into(),
            "effect".into(),
            0.3,
            0.0,
            1.0,
        )),
        _ => None,
    }
}

#[wasm_bindgen]
pub fn get_all_filter_types() -> Vec<JsValue> {
    vec![
        JsValue::from_str("grayscale"),
        JsValue::from_str("sepia"),
        JsValue::from_str("invert"),
        JsValue::from_str("brightness"),
        JsValue::from_str("contrast"),
        JsValue::from_str("saturation"),
        JsValue::from_str("blur"),
        JsValue::from_str("sharpen"),
        JsValue::from_str("vignette"),
        JsValue::from_str("vintage"),
        JsValue::from_str("warm"),
        JsValue::from_str("cool"),
        JsValue::from_str("posterize"),
        JsValue::from_str("emboss"),
        JsValue::from_str("edge_detect"),
        JsValue::from_str("noise"),
        JsValue::from_str("pixelate"),
        JsValue::from_str("chromatic_aberration"),
    ]
}

#[wasm_bindgen]
pub fn get_filters_by_category(category: &str) -> Vec<JsValue> {
    let all_filters = [
        ("grayscale", "color"),
        ("sepia", "color"),
        ("invert", "color"),
        ("warm", "color"),
        ("cool", "color"),
        ("brightness", "adjustment"),
        ("contrast", "adjustment"),
        ("saturation", "adjustment"),
        ("blur", "effect"),
        ("sharpen", "effect"),
        ("vignette", "effect"),
        ("noise", "effect"),
        ("chromatic_aberration", "effect"),
        ("vintage", "preset"),
        ("posterize", "artistic"),
        ("emboss", "artistic"),
        ("edge_detect", "artistic"),
        ("pixelate", "artistic"),
    ];

    all_filters
        .iter()
        .filter(|(_, cat)| *cat == category)
        .map(|(name, _)| JsValue::from_str(name))
        .collect()
}

#[wasm_bindgen]
pub fn get_filter_categories() -> Vec<JsValue> {
    vec![
        JsValue::from_str("color"),
        JsValue::from_str("adjustment"),
        JsValue::from_str("effect"),
        JsValue::from_str("artistic"),
        JsValue::from_str("preset"),
    ]
}
