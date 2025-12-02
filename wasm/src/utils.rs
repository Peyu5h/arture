use wasm_bindgen::prelude::*;

#[wasm_bindgen]
extern "C" {
    #[wasm_bindgen(js_namespace = console)]
    pub fn log(s: &str);

    #[wasm_bindgen(js_namespace = console)]
    pub fn warn(s: &str);

    #[wasm_bindgen(js_namespace = console)]
    pub fn error(s: &str);
}

#[macro_export]
macro_rules! console_log {
    ($($t:tt)*) => (crate::utils::log(&format_args!($($t)*).to_string()))
}

#[macro_export]
macro_rules! console_warn {
    ($($t:tt)*) => (crate::utils::warn(&format_args!($($t)*).to_string()))
}

#[macro_export]
macro_rules! console_error {
    ($($t:tt)*) => (crate::utils::error(&format_args!($($t)*).to_string()))
}

pub fn set_panic_hook() {
    #[cfg(feature = "console_error_panic_hook")]
    console_error_panic_hook::set_once();
}

// clamps value between min and max
pub fn clamp<T: PartialOrd>(value: T, min: T, max: T) -> T {
    if value < min {
        min
    } else if value > max {
        max
    } else {
        value
    }
}

// linear interpolation
pub fn lerp(a: f32, b: f32, t: f32) -> f32 {
    a + (b - a) * t
}

// smoothstep interpolation
pub fn smoothstep(edge0: f32, edge1: f32, x: f32) -> f32 {
    let t = clamp((x - edge0) / (edge1 - edge0), 0.0, 1.0);
    t * t * (3.0 - 2.0 * t)
}

// converts rgba bytes to f32 array
pub fn bytes_to_f32(data: &[u8]) -> Vec<f32> {
    data.iter().map(|&b| b as f32 / 255.0).collect()
}

// converts f32 array to rgba bytes
pub fn f32_to_bytes(data: &[f32]) -> Vec<u8> {
    data.iter()
        .map(|&f| (clamp(f, 0.0, 1.0) * 255.0).round() as u8)
        .collect()
}

// calculates the distance between two points
pub fn distance(x1: f32, y1: f32, x2: f32, y2: f32) -> f32 {
    let dx = x2 - x1;
    let dy = y2 - y1;
    (dx * dx + dy * dy).sqrt()
}

// normalizes a 2d vector
pub fn normalize(x: f32, y: f32) -> (f32, f32) {
    let len = (x * x + y * y).sqrt();
    if len > 0.0 {
        (x / len, y / len)
    } else {
        (0.0, 0.0)
    }
}

// dot product of two 3d vectors
pub fn dot3(a: [f32; 3], b: [f32; 3]) -> f32 {
    a[0] * b[0] + a[1] * b[1] + a[2] * b[2]
}

// calculates relative luminance
pub fn luminance(r: f32, g: f32, b: f32) -> f32 {
    0.2126 * r + 0.7152 * g + 0.0722 * b
}

// converts degrees to radians
pub fn deg_to_rad(degrees: f32) -> f32 {
    degrees * std::f32::consts::PI / 180.0
}

// converts radians to degrees
pub fn rad_to_deg(radians: f32) -> f32 {
    radians * 180.0 / std::f32::consts::PI
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_clamp() {
        assert_eq!(clamp(5, 0, 10), 5);
        assert_eq!(clamp(-5, 0, 10), 0);
        assert_eq!(clamp(15, 0, 10), 10);
    }

    #[test]
    fn test_lerp() {
        assert_eq!(lerp(0.0, 10.0, 0.5), 5.0);
        assert_eq!(lerp(0.0, 10.0, 0.0), 0.0);
        assert_eq!(lerp(0.0, 10.0, 1.0), 10.0);
    }

    #[test]
    fn test_luminance() {
        assert!((luminance(1.0, 1.0, 1.0) - 1.0).abs() < 0.001);
        assert!((luminance(0.0, 0.0, 0.0) - 0.0).abs() < 0.001);
    }
}
