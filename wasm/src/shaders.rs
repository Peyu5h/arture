pub const GRAYSCALE_SHADER: &str = r#"
@group(0) @binding(0) var input_tex: texture_2d<f32>;
@group(0) @binding(1) var output_tex: texture_storage_2d<rgba8unorm, write>;
@group(0) @binding(2) var tex_sampler: sampler;
@group(0) @binding(3) var<uniform> params: vec4<f32>;

@compute @workgroup_size(8, 8)
fn main(@builtin(global_invocation_id) global_id: vec3<u32>) {
    let dims = textureDimensions(input_tex);
    if (global_id.x >= dims.x || global_id.y >= dims.y) {
        return;
    }

    let coord = vec2<i32>(global_id.xy);
    let color = textureLoad(input_tex, coord, 0);
    let intensity = params.x;

    let luminance = dot(color.rgb, vec3<f32>(0.2126, 0.7152, 0.0722));
    let gray = vec3<f32>(luminance);
    let result = mix(color.rgb, gray, intensity);

    textureStore(output_tex, coord, vec4<f32>(result, color.a));
}
"#;

pub const SEPIA_SHADER: &str = r#"
@group(0) @binding(0) var input_tex: texture_2d<f32>;
@group(0) @binding(1) var output_tex: texture_storage_2d<rgba8unorm, write>;
@group(0) @binding(2) var tex_sampler: sampler;
@group(0) @binding(3) var<uniform> params: vec4<f32>;

@compute @workgroup_size(8, 8)
fn main(@builtin(global_invocation_id) global_id: vec3<u32>) {
    let dims = textureDimensions(input_tex);
    if (global_id.x >= dims.x || global_id.y >= dims.y) {
        return;
    }

    let coord = vec2<i32>(global_id.xy);
    let color = textureLoad(input_tex, coord, 0);
    let intensity = params.x;

    let sepia = vec3<f32>(
        dot(color.rgb, vec3<f32>(0.393, 0.769, 0.189)),
        dot(color.rgb, vec3<f32>(0.349, 0.686, 0.168)),
        dot(color.rgb, vec3<f32>(0.272, 0.534, 0.131))
    );
    let result = mix(color.rgb, sepia, intensity);

    textureStore(output_tex, coord, vec4<f32>(result, color.a));
}
"#;

pub const INVERT_SHADER: &str = r#"
@group(0) @binding(0) var input_tex: texture_2d<f32>;
@group(0) @binding(1) var output_tex: texture_storage_2d<rgba8unorm, write>;
@group(0) @binding(2) var tex_sampler: sampler;
@group(0) @binding(3) var<uniform> params: vec4<f32>;

@compute @workgroup_size(8, 8)
fn main(@builtin(global_invocation_id) global_id: vec3<u32>) {
    let dims = textureDimensions(input_tex);
    if (global_id.x >= dims.x || global_id.y >= dims.y) {
        return;
    }

    let coord = vec2<i32>(global_id.xy);
    let color = textureLoad(input_tex, coord, 0);
    let intensity = params.x;

    let inverted = vec3<f32>(1.0) - color.rgb;
    let result = mix(color.rgb, inverted, intensity);

    textureStore(output_tex, coord, vec4<f32>(result, color.a));
}
"#;

pub const BRIGHTNESS_SHADER: &str = r#"
@group(0) @binding(0) var input_tex: texture_2d<f32>;
@group(0) @binding(1) var output_tex: texture_storage_2d<rgba8unorm, write>;
@group(0) @binding(2) var tex_sampler: sampler;
@group(0) @binding(3) var<uniform> params: vec4<f32>;

@compute @workgroup_size(8, 8)
fn main(@builtin(global_invocation_id) global_id: vec3<u32>) {
    let dims = textureDimensions(input_tex);
    if (global_id.x >= dims.x || global_id.y >= dims.y) {
        return;
    }

    let coord = vec2<i32>(global_id.xy);
    let color = textureLoad(input_tex, coord, 0);
    let brightness = params.x;

    let result = clamp(color.rgb + vec3<f32>(brightness - 0.5) * 2.0, vec3<f32>(0.0), vec3<f32>(1.0));

    textureStore(output_tex, coord, vec4<f32>(result, color.a));
}
"#;

pub const CONTRAST_SHADER: &str = r#"
@group(0) @binding(0) var input_tex: texture_2d<f32>;
@group(0) @binding(1) var output_tex: texture_storage_2d<rgba8unorm, write>;
@group(0) @binding(2) var tex_sampler: sampler;
@group(0) @binding(3) var<uniform> params: vec4<f32>;

@compute @workgroup_size(8, 8)
fn main(@builtin(global_invocation_id) global_id: vec3<u32>) {
    let dims = textureDimensions(input_tex);
    if (global_id.x >= dims.x || global_id.y >= dims.y) {
        return;
    }

    let coord = vec2<i32>(global_id.xy);
    let color = textureLoad(input_tex, coord, 0);
    let contrast = params.x * 2.0;

    let result = clamp((color.rgb - 0.5) * contrast + 0.5, vec3<f32>(0.0), vec3<f32>(1.0));

    textureStore(output_tex, coord, vec4<f32>(result, color.a));
}
"#;

pub const SATURATION_SHADER: &str = r#"
@group(0) @binding(0) var input_tex: texture_2d<f32>;
@group(0) @binding(1) var output_tex: texture_storage_2d<rgba8unorm, write>;
@group(0) @binding(2) var tex_sampler: sampler;
@group(0) @binding(3) var<uniform> params: vec4<f32>;

@compute @workgroup_size(8, 8)
fn main(@builtin(global_invocation_id) global_id: vec3<u32>) {
    let dims = textureDimensions(input_tex);
    if (global_id.x >= dims.x || global_id.y >= dims.y) {
        return;
    }

    let coord = vec2<i32>(global_id.xy);
    let color = textureLoad(input_tex, coord, 0);
    let saturation = params.x * 2.0;

    let luminance = dot(color.rgb, vec3<f32>(0.2126, 0.7152, 0.0722));
    let gray = vec3<f32>(luminance);
    let result = mix(gray, color.rgb, saturation);

    textureStore(output_tex, coord, vec4<f32>(clamp(result, vec3<f32>(0.0), vec3<f32>(1.0)), color.a));
}
"#;

pub const BLUR_SHADER: &str = r#"
@group(0) @binding(0) var input_tex: texture_2d<f32>;
@group(0) @binding(1) var output_tex: texture_storage_2d<rgba8unorm, write>;
@group(0) @binding(2) var tex_sampler: sampler;
@group(0) @binding(3) var<uniform> params: vec4<f32>;

@compute @workgroup_size(8, 8)
fn main(@builtin(global_invocation_id) global_id: vec3<u32>) {
    let dims = textureDimensions(input_tex);
    if (global_id.x >= dims.x || global_id.y >= dims.y) {
        return;
    }

    let coord = vec2<i32>(global_id.xy);
    let radius = i32(params.x * 10.0) + 1;

    var sum = vec4<f32>(0.0);
    var count = 0.0;

    for (var y = -radius; y <= radius; y = y + 1) {
        for (var x = -radius; x <= radius; x = x + 1) {
            let sample_coord = coord + vec2<i32>(x, y);
            if (sample_coord.x >= 0 && sample_coord.x < i32(dims.x) &&
                sample_coord.y >= 0 && sample_coord.y < i32(dims.y)) {
                sum = sum + textureLoad(input_tex, sample_coord, 0);
                count = count + 1.0;
            }
        }
    }

    let result = sum / count;
    textureStore(output_tex, coord, result);
}
"#;

pub const SHARPEN_SHADER: &str = r#"
@group(0) @binding(0) var input_tex: texture_2d<f32>;
@group(0) @binding(1) var output_tex: texture_storage_2d<rgba8unorm, write>;
@group(0) @binding(2) var tex_sampler: sampler;
@group(0) @binding(3) var<uniform> params: vec4<f32>;

@compute @workgroup_size(8, 8)
fn main(@builtin(global_invocation_id) global_id: vec3<u32>) {
    let dims = textureDimensions(input_tex);
    if (global_id.x >= dims.x || global_id.y >= dims.y) {
        return;
    }

    let coord = vec2<i32>(global_id.xy);
    let intensity = params.x * 2.0;

    let center = textureLoad(input_tex, coord, 0);
    let top = textureLoad(input_tex, coord + vec2<i32>(0, -1), 0);
    let bottom = textureLoad(input_tex, coord + vec2<i32>(0, 1), 0);
    let left = textureLoad(input_tex, coord + vec2<i32>(-1, 0), 0);
    let right = textureLoad(input_tex, coord + vec2<i32>(1, 0), 0);

    let sharpened = center * (1.0 + 4.0 * intensity) - (top + bottom + left + right) * intensity;
    let result = clamp(sharpened, vec4<f32>(0.0), vec4<f32>(1.0));

    textureStore(output_tex, coord, vec4<f32>(result.rgb, center.a));
}
"#;

pub const VIGNETTE_SHADER: &str = r#"
@group(0) @binding(0) var input_tex: texture_2d<f32>;
@group(0) @binding(1) var output_tex: texture_storage_2d<rgba8unorm, write>;
@group(0) @binding(2) var tex_sampler: sampler;
@group(0) @binding(3) var<uniform> params: vec4<f32>;

@compute @workgroup_size(8, 8)
fn main(@builtin(global_invocation_id) global_id: vec3<u32>) {
    let dims = textureDimensions(input_tex);
    if (global_id.x >= dims.x || global_id.y >= dims.y) {
        return;
    }

    let coord = vec2<i32>(global_id.xy);
    let color = textureLoad(input_tex, coord, 0);
    let intensity = params.x;

    let uv = vec2<f32>(global_id.xy) / vec2<f32>(dims);
    let center = vec2<f32>(0.5);
    let dist = distance(uv, center);
    let vignette = 1.0 - smoothstep(0.3, 0.7, dist * intensity * 2.0);

    let result = color.rgb * vignette;

    textureStore(output_tex, coord, vec4<f32>(result, color.a));
}
"#;

pub const VINTAGE_SHADER: &str = r#"
@group(0) @binding(0) var input_tex: texture_2d<f32>;
@group(0) @binding(1) var output_tex: texture_storage_2d<rgba8unorm, write>;
@group(0) @binding(2) var tex_sampler: sampler;
@group(0) @binding(3) var<uniform> params: vec4<f32>;

@compute @workgroup_size(8, 8)
fn main(@builtin(global_invocation_id) global_id: vec3<u32>) {
    let dims = textureDimensions(input_tex);
    if (global_id.x >= dims.x || global_id.y >= dims.y) {
        return;
    }

    let coord = vec2<i32>(global_id.xy);
    let color = textureLoad(input_tex, coord, 0);
    let intensity = params.x;

    let sepia = vec3<f32>(
        dot(color.rgb, vec3<f32>(0.393, 0.769, 0.189)),
        dot(color.rgb, vec3<f32>(0.349, 0.686, 0.168)),
        dot(color.rgb, vec3<f32>(0.272, 0.534, 0.131))
    );

    let uv = vec2<f32>(global_id.xy) / vec2<f32>(dims);
    let dist = distance(uv, vec2<f32>(0.5));
    let vignette = 1.0 - smoothstep(0.4, 0.8, dist);

    let contrast = (sepia - 0.5) * 0.9 + 0.5;
    let vintage = contrast * vignette;
    let result = mix(color.rgb, vintage, intensity);

    textureStore(output_tex, coord, vec4<f32>(result, color.a));
}
"#;

pub const WARM_SHADER: &str = r#"
@group(0) @binding(0) var input_tex: texture_2d<f32>;
@group(0) @binding(1) var output_tex: texture_storage_2d<rgba8unorm, write>;
@group(0) @binding(2) var tex_sampler: sampler;
@group(0) @binding(3) var<uniform> params: vec4<f32>;

@compute @workgroup_size(8, 8)
fn main(@builtin(global_invocation_id) global_id: vec3<u32>) {
    let dims = textureDimensions(input_tex);
    if (global_id.x >= dims.x || global_id.y >= dims.y) {
        return;
    }

    let coord = vec2<i32>(global_id.xy);
    let color = textureLoad(input_tex, coord, 0);
    let intensity = params.x;

    let warm = vec3<f32>(
        min(color.r + 0.1 * intensity, 1.0),
        color.g,
        max(color.b - 0.1 * intensity, 0.0)
    );

    textureStore(output_tex, coord, vec4<f32>(warm, color.a));
}
"#;

pub const COOL_SHADER: &str = r#"
@group(0) @binding(0) var input_tex: texture_2d<f32>;
@group(0) @binding(1) var output_tex: texture_storage_2d<rgba8unorm, write>;
@group(0) @binding(2) var tex_sampler: sampler;
@group(0) @binding(3) var<uniform> params: vec4<f32>;

@compute @workgroup_size(8, 8)
fn main(@builtin(global_invocation_id) global_id: vec3<u32>) {
    let dims = textureDimensions(input_tex);
    if (global_id.x >= dims.x || global_id.y >= dims.y) {
        return;
    }

    let coord = vec2<i32>(global_id.xy);
    let color = textureLoad(input_tex, coord, 0);
    let intensity = params.x;

    let cool = vec3<f32>(
        max(color.r - 0.1 * intensity, 0.0),
        color.g,
        min(color.b + 0.1 * intensity, 1.0)
    );

    textureStore(output_tex, coord, vec4<f32>(cool, color.a));
}
"#;

pub const POSTERIZE_SHADER: &str = r#"
@group(0) @binding(0) var input_tex: texture_2d<f32>;
@group(0) @binding(1) var output_tex: texture_storage_2d<rgba8unorm, write>;
@group(0) @binding(2) var tex_sampler: sampler;
@group(0) @binding(3) var<uniform> params: vec4<f32>;

@compute @workgroup_size(8, 8)
fn main(@builtin(global_invocation_id) global_id: vec3<u32>) {
    let dims = textureDimensions(input_tex);
    if (global_id.x >= dims.x || global_id.y >= dims.y) {
        return;
    }

    let coord = vec2<i32>(global_id.xy);
    let color = textureLoad(input_tex, coord, 0);
    let levels = max(2.0, params.x * 10.0 + 2.0);

    let posterized = floor(color.rgb * levels) / (levels - 1.0);
    let result = clamp(posterized, vec3<f32>(0.0), vec3<f32>(1.0));

    textureStore(output_tex, coord, vec4<f32>(result, color.a));
}
"#;

pub const EMBOSS_SHADER: &str = r#"
@group(0) @binding(0) var input_tex: texture_2d<f32>;
@group(0) @binding(1) var output_tex: texture_storage_2d<rgba8unorm, write>;
@group(0) @binding(2) var tex_sampler: sampler;
@group(0) @binding(3) var<uniform> params: vec4<f32>;

@compute @workgroup_size(8, 8)
fn main(@builtin(global_invocation_id) global_id: vec3<u32>) {
    let dims = textureDimensions(input_tex);
    if (global_id.x >= dims.x || global_id.y >= dims.y) {
        return;
    }

    let coord = vec2<i32>(global_id.xy);
    let color = textureLoad(input_tex, coord, 0);
    let intensity = params.x;

    let tl = textureLoad(input_tex, coord + vec2<i32>(-1, -1), 0).rgb;
    let br = textureLoad(input_tex, coord + vec2<i32>(1, 1), 0).rgb;

    let emboss = (br - tl) * intensity + 0.5;
    let result = mix(color.rgb, emboss, intensity);

    textureStore(output_tex, coord, vec4<f32>(clamp(result, vec3<f32>(0.0), vec3<f32>(1.0)), color.a));
}
"#;

pub const EDGE_DETECT_SHADER: &str = r#"
@group(0) @binding(0) var input_tex: texture_2d<f32>;
@group(0) @binding(1) var output_tex: texture_storage_2d<rgba8unorm, write>;
@group(0) @binding(2) var tex_sampler: sampler;
@group(0) @binding(3) var<uniform> params: vec4<f32>;

@compute @workgroup_size(8, 8)
fn main(@builtin(global_invocation_id) global_id: vec3<u32>) {
    let dims = textureDimensions(input_tex);
    if (global_id.x >= dims.x || global_id.y >= dims.y) {
        return;
    }

    let coord = vec2<i32>(global_id.xy);
    let color = textureLoad(input_tex, coord, 0);
    let intensity = params.x;

    let tl = dot(textureLoad(input_tex, coord + vec2<i32>(-1, -1), 0).rgb, vec3<f32>(0.333));
    let t = dot(textureLoad(input_tex, coord + vec2<i32>(0, -1), 0).rgb, vec3<f32>(0.333));
    let tr = dot(textureLoad(input_tex, coord + vec2<i32>(1, -1), 0).rgb, vec3<f32>(0.333));
    let l = dot(textureLoad(input_tex, coord + vec2<i32>(-1, 0), 0).rgb, vec3<f32>(0.333));
    let r = dot(textureLoad(input_tex, coord + vec2<i32>(1, 0), 0).rgb, vec3<f32>(0.333));
    let bl = dot(textureLoad(input_tex, coord + vec2<i32>(-1, 1), 0).rgb, vec3<f32>(0.333));
    let b = dot(textureLoad(input_tex, coord + vec2<i32>(0, 1), 0).rgb, vec3<f32>(0.333));
    let br = dot(textureLoad(input_tex, coord + vec2<i32>(1, 1), 0).rgb, vec3<f32>(0.333));

    let gx = -tl - 2.0 * l - bl + tr + 2.0 * r + br;
    let gy = -tl - 2.0 * t - tr + bl + 2.0 * b + br;
    let edge = sqrt(gx * gx + gy * gy);

    let edge_color = vec3<f32>(edge);
    let result = mix(color.rgb, edge_color, intensity);

    textureStore(output_tex, coord, vec4<f32>(result, color.a));
}
"#;

pub const NOISE_SHADER: &str = r#"
@group(0) @binding(0) var input_tex: texture_2d<f32>;
@group(0) @binding(1) var output_tex: texture_storage_2d<rgba8unorm, write>;
@group(0) @binding(2) var tex_sampler: sampler;
@group(0) @binding(3) var<uniform> params: vec4<f32>;

fn hash(p: vec2<f32>) -> f32 {
    return fract(sin(dot(p, vec2<f32>(127.1, 311.7))) * 43758.5453123);
}

@compute @workgroup_size(8, 8)
fn main(@builtin(global_invocation_id) global_id: vec3<u32>) {
    let dims = textureDimensions(input_tex);
    if (global_id.x >= dims.x || global_id.y >= dims.y) {
        return;
    }

    let coord = vec2<i32>(global_id.xy);
    let color = textureLoad(input_tex, coord, 0);
    let intensity = params.x * 0.5;

    let uv = vec2<f32>(global_id.xy);
    let noise = hash(uv) * 2.0 - 1.0;

    let noisy = color.rgb + vec3<f32>(noise * intensity);
    let result = clamp(noisy, vec3<f32>(0.0), vec3<f32>(1.0));

    textureStore(output_tex, coord, vec4<f32>(result, color.a));
}
"#;

pub const PIXELATE_SHADER: &str = r#"
@group(0) @binding(0) var input_tex: texture_2d<f32>;
@group(0) @binding(1) var output_tex: texture_storage_2d<rgba8unorm, write>;
@group(0) @binding(2) var tex_sampler: sampler;
@group(0) @binding(3) var<uniform> params: vec4<f32>;

@compute @workgroup_size(8, 8)
fn main(@builtin(global_invocation_id) global_id: vec3<u32>) {
    let dims = textureDimensions(input_tex);
    if (global_id.x >= dims.x || global_id.y >= dims.y) {
        return;
    }

    let coord = vec2<i32>(global_id.xy);
    let pixel_size = max(1, i32(params.x * 20.0) + 1);

    let block_x = (coord.x / pixel_size) * pixel_size + pixel_size / 2;
    let block_y = (coord.y / pixel_size) * pixel_size + pixel_size / 2;
    let block_coord = vec2<i32>(
        min(block_x, i32(dims.x) - 1),
        min(block_y, i32(dims.y) - 1)
    );

    let color = textureLoad(input_tex, block_coord, 0);
    textureStore(output_tex, coord, color);
}
"#;

pub const CHROMATIC_ABERRATION_SHADER: &str = r#"
@group(0) @binding(0) var input_tex: texture_2d<f32>;
@group(0) @binding(1) var output_tex: texture_storage_2d<rgba8unorm, write>;
@group(0) @binding(2) var tex_sampler: sampler;
@group(0) @binding(3) var<uniform> params: vec4<f32>;

@compute @workgroup_size(8, 8)
fn main(@builtin(global_invocation_id) global_id: vec3<u32>) {
    let dims = textureDimensions(input_tex);
    if (global_id.x >= dims.x || global_id.y >= dims.y) {
        return;
    }

    let coord = vec2<i32>(global_id.xy);
    let offset = i32(params.x * 10.0);

    let uv = vec2<f32>(global_id.xy) / vec2<f32>(dims);
    let center = vec2<f32>(0.5);
    let dir = normalize(uv - center);
    let dist = distance(uv, center);

    let r_offset = vec2<i32>(dir * f32(offset) * dist);
    let b_offset = vec2<i32>(-dir * f32(offset) * dist);

    let r_coord = clamp(coord + r_offset, vec2<i32>(0), vec2<i32>(dims) - 1);
    let b_coord = clamp(coord + b_offset, vec2<i32>(0), vec2<i32>(dims) - 1);

    let r = textureLoad(input_tex, r_coord, 0).r;
    let g = textureLoad(input_tex, coord, 0).g;
    let b = textureLoad(input_tex, b_coord, 0).b;
    let a = textureLoad(input_tex, coord, 0).a;

    textureStore(output_tex, coord, vec4<f32>(r, g, b, a));
}
"#;
