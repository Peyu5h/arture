use wasm_bindgen::prelude::*;

mod filters;
mod shaders;
mod utils;

pub use filters::*;

#[wasm_bindgen(start)]
pub fn init_panic_hook() {
    #[cfg(feature = "console_error_panic_hook")]
    console_error_panic_hook::set_once();
}

#[wasm_bindgen]
extern "C" {
    #[wasm_bindgen(js_namespace = console)]
    fn log(s: &str);
}

#[wasm_bindgen]
pub struct ImageProcessor {
    initialized: bool,
}

#[wasm_bindgen]
impl ImageProcessor {
    #[wasm_bindgen(constructor)]
    pub fn new() -> Result<ImageProcessor, JsValue> {
        Ok(ImageProcessor { initialized: true })
    }

    #[wasm_bindgen]
    pub fn is_supported() -> js_sys::Promise {
        wasm_bindgen_futures::future_to_promise(async move {
            let window = match web_sys::window() {
                Some(w) => w,
                None => return Ok(JsValue::FALSE),
            };

            let navigator = window.navigator();
            let gpu = js_sys::Reflect::get(&navigator, &JsValue::from_str("gpu"));

            match gpu {
                Ok(g) => Ok(JsValue::from(!g.is_undefined() && !g.is_null())),
                Err(_) => Ok(JsValue::FALSE),
            }
        })
    }

    #[wasm_bindgen]
    pub fn apply_filter(
        &mut self,
        image_data: &[u8],
        width: u32,
        height: u32,
        filter_type: &str,
        intensity: f32,
    ) -> Result<Vec<u8>, JsValue> {
        if !self.initialized {
            return Err(JsValue::from_str("processor not initialized"));
        }

        let mut result = image_data.to_vec();
        let len = result.len();

        match filter_type {
            "grayscale" => {
                for i in (0..len).step_by(4) {
                    let r = result[i] as f32;
                    let g = result[i + 1] as f32;
                    let b = result[i + 2] as f32;
                    let gray = r * 0.2126 + g * 0.7152 + b * 0.0722;
                    result[i] = lerp(r, gray, intensity) as u8;
                    result[i + 1] = lerp(g, gray, intensity) as u8;
                    result[i + 2] = lerp(b, gray, intensity) as u8;
                }
            }
            "sepia" => {
                for i in (0..len).step_by(4) {
                    let r = result[i] as f32;
                    let g = result[i + 1] as f32;
                    let b = result[i + 2] as f32;
                    let sepia_r = r * 0.393 + g * 0.769 + b * 0.189;
                    let sepia_g = r * 0.349 + g * 0.686 + b * 0.168;
                    let sepia_b = r * 0.272 + g * 0.534 + b * 0.131;
                    result[i] = clamp(lerp(r, sepia_r, intensity)) as u8;
                    result[i + 1] = clamp(lerp(g, sepia_g, intensity)) as u8;
                    result[i + 2] = clamp(lerp(b, sepia_b, intensity)) as u8;
                }
            }
            "invert" => {
                for i in (0..len).step_by(4) {
                    result[i] = lerp(result[i] as f32, 255.0 - result[i] as f32, intensity) as u8;
                    result[i + 1] = lerp(
                        result[i + 1] as f32,
                        255.0 - result[i + 1] as f32,
                        intensity,
                    ) as u8;
                    result[i + 2] = lerp(
                        result[i + 2] as f32,
                        255.0 - result[i + 2] as f32,
                        intensity,
                    ) as u8;
                }
            }
            "brightness" => {
                let adj = (intensity - 0.5) * 2.0 * 255.0;
                for i in (0..len).step_by(4) {
                    result[i] = clamp(result[i] as f32 + adj) as u8;
                    result[i + 1] = clamp(result[i + 1] as f32 + adj) as u8;
                    result[i + 2] = clamp(result[i + 2] as f32 + adj) as u8;
                }
            }
            "contrast" => {
                let factor = intensity * 2.0;
                for i in (0..len).step_by(4) {
                    result[i] = clamp((result[i] as f32 - 128.0) * factor + 128.0) as u8;
                    result[i + 1] = clamp((result[i + 1] as f32 - 128.0) * factor + 128.0) as u8;
                    result[i + 2] = clamp((result[i + 2] as f32 - 128.0) * factor + 128.0) as u8;
                }
            }
            "saturation" => {
                let sat = intensity * 2.0;
                for i in (0..len).step_by(4) {
                    let r = result[i] as f32;
                    let g = result[i + 1] as f32;
                    let b = result[i + 2] as f32;
                    let gray = r * 0.2126 + g * 0.7152 + b * 0.0722;
                    result[i] = clamp(gray + (r - gray) * sat) as u8;
                    result[i + 1] = clamp(gray + (g - gray) * sat) as u8;
                    result[i + 2] = clamp(gray + (b - gray) * sat) as u8;
                }
            }
            "blur" => {
                let radius = (intensity * 10.0) as i32 + 1;
                result = box_blur(&result, width, height, radius);
            }
            "sharpen" => {
                result = sharpen_image(&result, width, height, intensity);
            }
            "vignette" => {
                let cx = width as f32 / 2.0;
                let cy = height as f32 / 2.0;
                let max_dist = (cx * cx + cy * cy).sqrt();
                for y in 0..height {
                    for x in 0..width {
                        let dx = x as f32 - cx;
                        let dy = y as f32 - cy;
                        let dist = (dx * dx + dy * dy).sqrt() / max_dist;
                        let vignette = 1.0 - (dist * intensity * 1.5).min(1.0);
                        let idx = ((y * width + x) * 4) as usize;
                        result[idx] = (result[idx] as f32 * vignette) as u8;
                        result[idx + 1] = (result[idx + 1] as f32 * vignette) as u8;
                        result[idx + 2] = (result[idx + 2] as f32 * vignette) as u8;
                    }
                }
            }
            "vintage" => {
                for i in (0..len).step_by(4) {
                    let r = result[i] as f32;
                    let g = result[i + 1] as f32;
                    let b = result[i + 2] as f32;
                    let sepia_r = r * 0.393 + g * 0.769 + b * 0.189;
                    let sepia_g = r * 0.349 + g * 0.686 + b * 0.168;
                    let sepia_b = r * 0.272 + g * 0.534 + b * 0.131;
                    let contrast_r = (sepia_r - 128.0) * 0.9 + 128.0;
                    let contrast_g = (sepia_g - 128.0) * 0.9 + 128.0;
                    let contrast_b = (sepia_b - 128.0) * 0.9 + 128.0;
                    result[i] = clamp(lerp(r, contrast_r, intensity)) as u8;
                    result[i + 1] = clamp(lerp(g, contrast_g, intensity)) as u8;
                    result[i + 2] = clamp(lerp(b, contrast_b, intensity)) as u8;
                }
            }
            "warm" => {
                for i in (0..len).step_by(4) {
                    result[i] = clamp(result[i] as f32 + 25.0 * intensity) as u8;
                    result[i + 2] = clamp(result[i + 2] as f32 - 25.0 * intensity) as u8;
                }
            }
            "cool" => {
                for i in (0..len).step_by(4) {
                    result[i] = clamp(result[i] as f32 - 25.0 * intensity) as u8;
                    result[i + 2] = clamp(result[i + 2] as f32 + 25.0 * intensity) as u8;
                }
            }
            "posterize" => {
                let levels = (intensity * 10.0 + 2.0).max(2.0);
                let step = 255.0 / (levels - 1.0);
                for i in (0..len).step_by(4) {
                    result[i] = ((result[i] as f32 / step).round() * step) as u8;
                    result[i + 1] = ((result[i + 1] as f32 / step).round() * step) as u8;
                    result[i + 2] = ((result[i + 2] as f32 / step).round() * step) as u8;
                }
            }
            "emboss" => {
                result = emboss_image(&result, width, height, intensity);
            }
            "edge_detect" => {
                result = edge_detect_image(&result, width, height, intensity);
            }
            "noise" => {
                let noise_intensity = intensity * 50.0;
                for i in (0..len).step_by(4) {
                    let noise = (pseudo_random(i as u32) - 0.5) * noise_intensity;
                    result[i] = clamp(result[i] as f32 + noise) as u8;
                    result[i + 1] = clamp(result[i + 1] as f32 + noise) as u8;
                    result[i + 2] = clamp(result[i + 2] as f32 + noise) as u8;
                }
            }
            "pixelate" => {
                let block_size = (intensity * 20.0) as u32 + 1;
                result = pixelate_image(&result, width, height, block_size);
            }
            "chromatic_aberration" => {
                let offset = (intensity * 10.0) as i32;
                result = chromatic_aberration(&result, width, height, offset);
            }
            _ => {}
        }

        Ok(result)
    }

    #[wasm_bindgen]
    pub fn crop(
        &self,
        image_data: &[u8],
        width: u32,
        _height: u32,
        x: u32,
        y: u32,
        crop_width: u32,
        crop_height: u32,
    ) -> Result<Vec<u8>, JsValue> {
        let mut result = Vec::with_capacity((crop_width * crop_height * 4) as usize);

        for row in y..(y + crop_height) {
            let start = ((row * width + x) * 4) as usize;
            let end = start + (crop_width * 4) as usize;
            if end <= image_data.len() {
                result.extend_from_slice(&image_data[start..end]);
            }
        }

        Ok(result)
    }

    #[wasm_bindgen]
    pub fn resize(
        &self,
        image_data: &[u8],
        src_width: u32,
        src_height: u32,
        dst_width: u32,
        dst_height: u32,
    ) -> Result<Vec<u8>, JsValue> {
        let mut result = vec![0u8; (dst_width * dst_height * 4) as usize];

        let x_ratio = src_width as f32 / dst_width as f32;
        let y_ratio = src_height as f32 / dst_height as f32;

        for y in 0..dst_height {
            for x in 0..dst_width {
                let src_x = x as f32 * x_ratio;
                let src_y = y as f32 * y_ratio;

                let x0 = src_x.floor() as u32;
                let y0 = src_y.floor() as u32;
                let x1 = (x0 + 1).min(src_width - 1);
                let y1 = (y0 + 1).min(src_height - 1);

                let x_diff = src_x - x0 as f32;
                let y_diff = src_y - y0 as f32;

                for c in 0..4 {
                    let p00 = image_data[((y0 * src_width + x0) * 4 + c) as usize] as f32;
                    let p10 = image_data[((y0 * src_width + x1) * 4 + c) as usize] as f32;
                    let p01 = image_data[((y1 * src_width + x0) * 4 + c) as usize] as f32;
                    let p11 = image_data[((y1 * src_width + x1) * 4 + c) as usize] as f32;

                    let value = p00 * (1.0 - x_diff) * (1.0 - y_diff)
                        + p10 * x_diff * (1.0 - y_diff)
                        + p01 * (1.0 - x_diff) * y_diff
                        + p11 * x_diff * y_diff;

                    result[((y * dst_width + x) * 4 + c) as usize] = value.round() as u8;
                }
            }
        }

        Ok(result)
    }

    #[wasm_bindgen]
    pub fn rotate(
        &self,
        image_data: &[u8],
        width: u32,
        height: u32,
        degrees: f32,
    ) -> Result<RotateResult, JsValue> {
        let radians = degrees.to_radians();
        let cos_a = radians.cos();
        let sin_a = radians.sin();

        let new_width =
            ((width as f32 * cos_a.abs()) + (height as f32 * sin_a.abs())).ceil() as u32;
        let new_height =
            ((width as f32 * sin_a.abs()) + (height as f32 * cos_a.abs())).ceil() as u32;

        let mut result = vec![0u8; (new_width * new_height * 4) as usize];

        let cx = width as f32 / 2.0;
        let cy = height as f32 / 2.0;
        let new_cx = new_width as f32 / 2.0;
        let new_cy = new_height as f32 / 2.0;

        for y in 0..new_height {
            for x in 0..new_width {
                let dx = x as f32 - new_cx;
                let dy = y as f32 - new_cy;

                let src_x = (dx * cos_a + dy * sin_a + cx).round() as i32;
                let src_y = (-dx * sin_a + dy * cos_a + cy).round() as i32;

                if src_x >= 0 && src_x < width as i32 && src_y >= 0 && src_y < height as i32 {
                    let src_idx = ((src_y as u32 * width + src_x as u32) * 4) as usize;
                    let dst_idx = ((y * new_width + x) * 4) as usize;

                    result[dst_idx..dst_idx + 4].copy_from_slice(&image_data[src_idx..src_idx + 4]);
                }
            }
        }

        Ok(RotateResult {
            data: result,
            width: new_width,
            height: new_height,
        })
    }

    #[wasm_bindgen]
    pub fn flip(
        &self,
        image_data: &[u8],
        width: u32,
        height: u32,
        horizontal: bool,
    ) -> Result<Vec<u8>, JsValue> {
        let mut result = vec![0u8; image_data.len()];

        for y in 0..height {
            for x in 0..width {
                let src_x = if horizontal { width - 1 - x } else { x };
                let src_y = if horizontal { y } else { height - 1 - y };

                let src_idx = ((src_y * width + src_x) * 4) as usize;
                let dst_idx = ((y * width + x) * 4) as usize;

                result[dst_idx..dst_idx + 4].copy_from_slice(&image_data[src_idx..src_idx + 4]);
            }
        }

        Ok(result)
    }

    #[wasm_bindgen]
    pub fn adjust_hue(
        &self,
        image_data: &[u8],
        _width: u32,
        _height: u32,
        hue_shift: f32,
    ) -> Result<Vec<u8>, JsValue> {
        let mut result = image_data.to_vec();

        for i in (0..result.len()).step_by(4) {
            let r = result[i] as f32 / 255.0;
            let g = result[i + 1] as f32 / 255.0;
            let b = result[i + 2] as f32 / 255.0;

            let (h, s, l) = rgb_to_hsl(r, g, b);
            let mut new_h = h + hue_shift;
            if new_h < 0.0 {
                new_h += 360.0;
            }
            if new_h >= 360.0 {
                new_h -= 360.0;
            }
            let (nr, ng, nb) = hsl_to_rgb(new_h, s, l);

            result[i] = (nr * 255.0).round() as u8;
            result[i + 1] = (ng * 255.0).round() as u8;
            result[i + 2] = (nb * 255.0).round() as u8;
        }

        Ok(result)
    }

    #[wasm_bindgen]
    pub fn get_histogram(&self, image_data: &[u8]) -> Result<HistogramData, JsValue> {
        let mut red = vec![0u32; 256];
        let mut green = vec![0u32; 256];
        let mut blue = vec![0u32; 256];
        let mut luminance = vec![0u32; 256];

        for i in (0..image_data.len()).step_by(4) {
            let r = image_data[i] as usize;
            let g = image_data[i + 1] as usize;
            let b = image_data[i + 2] as usize;

            red[r] += 1;
            green[g] += 1;
            blue[b] += 1;

            let lum = (0.2126 * r as f32 + 0.7152 * g as f32 + 0.0722 * b as f32).round() as usize;
            luminance[lum.min(255)] += 1;
        }

        Ok(HistogramData {
            red,
            green,
            blue,
            luminance,
        })
    }
}

impl Default for ImageProcessor {
    fn default() -> Self {
        Self::new().unwrap()
    }
}

#[wasm_bindgen]
pub struct RotateResult {
    data: Vec<u8>,
    width: u32,
    height: u32,
}

#[wasm_bindgen]
impl RotateResult {
    #[wasm_bindgen(getter)]
    pub fn data(&self) -> Vec<u8> {
        self.data.clone()
    }

    #[wasm_bindgen(getter)]
    pub fn width(&self) -> u32 {
        self.width
    }

    #[wasm_bindgen(getter)]
    pub fn height(&self) -> u32 {
        self.height
    }
}

#[wasm_bindgen]
pub struct HistogramData {
    red: Vec<u32>,
    green: Vec<u32>,
    blue: Vec<u32>,
    luminance: Vec<u32>,
}

#[wasm_bindgen]
impl HistogramData {
    #[wasm_bindgen(getter)]
    pub fn red(&self) -> Vec<u32> {
        self.red.clone()
    }

    #[wasm_bindgen(getter)]
    pub fn green(&self) -> Vec<u32> {
        self.green.clone()
    }

    #[wasm_bindgen(getter)]
    pub fn blue(&self) -> Vec<u32> {
        self.blue.clone()
    }

    #[wasm_bindgen(getter)]
    pub fn luminance(&self) -> Vec<u32> {
        self.luminance.clone()
    }
}

fn clamp(value: f32) -> f32 {
    value.max(0.0).min(255.0)
}

fn lerp(a: f32, b: f32, t: f32) -> f32 {
    a + (b - a) * t
}

fn pseudo_random(seed: u32) -> f32 {
    let x = seed.wrapping_mul(1103515245).wrapping_add(12345);
    ((x >> 16) & 0x7fff) as f32 / 0x7fff as f32
}

fn rgb_to_hsl(r: f32, g: f32, b: f32) -> (f32, f32, f32) {
    let max = r.max(g).max(b);
    let min = r.min(g).min(b);
    let l = (max + min) / 2.0;

    if max == min {
        return (0.0, 0.0, l);
    }

    let d = max - min;
    let s = if l > 0.5 {
        d / (2.0 - max - min)
    } else {
        d / (max + min)
    };

    let h = if max == r {
        ((g - b) / d + if g < b { 6.0 } else { 0.0 }) * 60.0
    } else if max == g {
        ((b - r) / d + 2.0) * 60.0
    } else {
        ((r - g) / d + 4.0) * 60.0
    };

    (h, s, l)
}

fn hsl_to_rgb(h: f32, s: f32, l: f32) -> (f32, f32, f32) {
    if s == 0.0 {
        return (l, l, l);
    }

    let q = if l < 0.5 {
        l * (1.0 + s)
    } else {
        l + s - l * s
    };
    let p = 2.0 * l - q;

    let hue_to_rgb = |t: f32| -> f32 {
        let t = if t < 0.0 {
            t + 1.0
        } else if t > 1.0 {
            t - 1.0
        } else {
            t
        };

        if t < 1.0 / 6.0 {
            p + (q - p) * 6.0 * t
        } else if t < 1.0 / 2.0 {
            q
        } else if t < 2.0 / 3.0 {
            p + (q - p) * (2.0 / 3.0 - t) * 6.0
        } else {
            p
        }
    };

    let h = h / 360.0;
    (
        hue_to_rgb(h + 1.0 / 3.0),
        hue_to_rgb(h),
        hue_to_rgb(h - 1.0 / 3.0),
    )
}

fn box_blur(data: &[u8], width: u32, height: u32, radius: i32) -> Vec<u8> {
    let mut result = data.to_vec();

    for y in 0..height as i32 {
        for x in 0..width as i32 {
            let mut r_sum = 0.0f32;
            let mut g_sum = 0.0f32;
            let mut b_sum = 0.0f32;
            let mut count = 0.0f32;

            for dy in -radius..=radius {
                for dx in -radius..=radius {
                    let nx = x + dx;
                    let ny = y + dy;
                    if nx >= 0 && nx < width as i32 && ny >= 0 && ny < height as i32 {
                        let idx = ((ny as u32 * width + nx as u32) * 4) as usize;
                        r_sum += data[idx] as f32;
                        g_sum += data[idx + 1] as f32;
                        b_sum += data[idx + 2] as f32;
                        count += 1.0;
                    }
                }
            }

            let idx = ((y as u32 * width + x as u32) * 4) as usize;
            result[idx] = (r_sum / count) as u8;
            result[idx + 1] = (g_sum / count) as u8;
            result[idx + 2] = (b_sum / count) as u8;
        }
    }

    result
}

fn sharpen_image(data: &[u8], width: u32, height: u32, intensity: f32) -> Vec<u8> {
    let mut result = data.to_vec();
    let factor = intensity * 2.0;

    for y in 1..height - 1 {
        for x in 1..width - 1 {
            let idx = ((y * width + x) * 4) as usize;
            let idx_t = (((y - 1) * width + x) * 4) as usize;
            let idx_b = (((y + 1) * width + x) * 4) as usize;
            let idx_l = ((y * width + x - 1) * 4) as usize;
            let idx_r = ((y * width + x + 1) * 4) as usize;

            for c in 0..3 {
                let center = data[idx + c] as f32;
                let neighbors = data[idx_t + c] as f32
                    + data[idx_b + c] as f32
                    + data[idx_l + c] as f32
                    + data[idx_r + c] as f32;
                let sharpened = center * (1.0 + 4.0 * factor) - neighbors * factor;
                result[idx + c] = clamp(sharpened) as u8;
            }
        }
    }

    result
}

fn emboss_image(data: &[u8], width: u32, height: u32, intensity: f32) -> Vec<u8> {
    let mut result = data.to_vec();

    for y in 1..height - 1 {
        for x in 1..width - 1 {
            let idx = ((y * width + x) * 4) as usize;
            let idx_tl = (((y - 1) * width + x - 1) * 4) as usize;
            let idx_br = (((y + 1) * width + x + 1) * 4) as usize;

            for c in 0..3 {
                let tl = data[idx_tl + c] as f32;
                let br = data[idx_br + c] as f32;
                let emboss = (br - tl) * intensity + 128.0;
                let orig = data[idx + c] as f32;
                result[idx + c] = clamp(lerp(orig, emboss, intensity)) as u8;
            }
        }
    }

    result
}

fn edge_detect_image(data: &[u8], width: u32, height: u32, intensity: f32) -> Vec<u8> {
    let mut result = data.to_vec();

    for y in 1..height - 1 {
        for x in 1..width - 1 {
            let idx = ((y * width + x) * 4) as usize;

            let get_lum = |ox: i32, oy: i32| -> f32 {
                let nx = (x as i32 + ox) as u32;
                let ny = (y as i32 + oy) as u32;
                let i = ((ny * width + nx) * 4) as usize;
                (data[i] as f32 + data[i + 1] as f32 + data[i + 2] as f32) / 3.0
            };

            let gx = -get_lum(-1, -1) - 2.0 * get_lum(-1, 0) - get_lum(-1, 1)
                + get_lum(1, -1)
                + 2.0 * get_lum(1, 0)
                + get_lum(1, 1);
            let gy = -get_lum(-1, -1) - 2.0 * get_lum(0, -1) - get_lum(1, -1)
                + get_lum(-1, 1)
                + 2.0 * get_lum(0, 1)
                + get_lum(1, 1);
            let edge = (gx * gx + gy * gy).sqrt();

            for c in 0..3 {
                let orig = data[idx + c] as f32;
                result[idx + c] = clamp(lerp(orig, edge, intensity)) as u8;
            }
        }
    }

    result
}

fn pixelate_image(data: &[u8], width: u32, height: u32, block_size: u32) -> Vec<u8> {
    let mut result = data.to_vec();
    let block_size = block_size.max(1);

    for by in (0..height).step_by(block_size as usize) {
        for bx in (0..width).step_by(block_size as usize) {
            let mut r_sum = 0u32;
            let mut g_sum = 0u32;
            let mut b_sum = 0u32;
            let mut count = 0u32;

            for y in by..(by + block_size).min(height) {
                for x in bx..(bx + block_size).min(width) {
                    let idx = ((y * width + x) * 4) as usize;
                    r_sum += data[idx] as u32;
                    g_sum += data[idx + 1] as u32;
                    b_sum += data[idx + 2] as u32;
                    count += 1;
                }
            }

            let avg_r = (r_sum / count) as u8;
            let avg_g = (g_sum / count) as u8;
            let avg_b = (b_sum / count) as u8;

            for y in by..(by + block_size).min(height) {
                for x in bx..(bx + block_size).min(width) {
                    let idx = ((y * width + x) * 4) as usize;
                    result[idx] = avg_r;
                    result[idx + 1] = avg_g;
                    result[idx + 2] = avg_b;
                }
            }
        }
    }

    result
}

fn chromatic_aberration(data: &[u8], width: u32, height: u32, offset: i32) -> Vec<u8> {
    let mut result = data.to_vec();
    let cx = width as f32 / 2.0;
    let cy = height as f32 / 2.0;

    for y in 0..height {
        for x in 0..width {
            let dx = x as f32 - cx;
            let dy = y as f32 - cy;
            let dist = (dx * dx + dy * dy).sqrt();
            let max_dist = (cx * cx + cy * cy).sqrt();
            let factor = dist / max_dist;

            let r_offset = (factor * offset as f32) as i32;

            let r_x = ((x as i32 + r_offset).max(0) as u32).min(width - 1);
            let b_x = ((x as i32 - r_offset).max(0) as u32).min(width - 1);

            let idx = ((y * width + x) * 4) as usize;
            let r_idx = ((y * width + r_x) * 4) as usize;
            let b_idx = ((y * width + b_x) * 4) as usize;

            result[idx] = data[r_idx];
            result[idx + 2] = data[b_idx + 2];
        }
    }

    result
}
