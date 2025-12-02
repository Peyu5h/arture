use wasm_bindgen::prelude::*;
use web_sys::{
    Gpu, GpuAdapter, GpuDevice, GpuQueue, GpuShaderModule, GpuComputePipeline,
    GpuBuffer, GpuTexture, GpuBindGroup, GpuCommandEncoder, GpuTextureFormat,
    GpuBufferUsage, GpuTextureUsage, GpuShaderModuleDescriptor,
    GpuComputePipelineDescriptor, GpuProgrammableStage, GpuBindGroupDescriptor,
    GpuBindGroupEntry, GpuBufferDescriptor, GpuTextureDescriptor, GpuExtent3dDict,
    GpuCommandEncoderDescriptor, GpuComputePassDescriptor, GpuImageCopyTexture,
    GpuImageDataLayout, GpuOrigin3dDict, GpuMapMode,
};
use js_sys::{Object, Reflect, Uint8Array, Promise};
use wasm_bindgen_futures::JsFuture;

#[wasm_bindgen]
pub struct GpuProcessor {
    device: GpuDevice,
    queue: GpuQueue,
}

#[wasm_bindgen]
impl GpuProcessor {
    #[wasm_bindgen(constructor)]
    pub async fn new() -> Result<GpuProcessor, JsValue> {
        let window = web_sys::window().ok_or("no window")?;
        let navigator = window.navigator();

        let gpu: Gpu = Reflect::get(&navigator, &JsValue::from_str("gpu"))?
            .dyn_into()
            .map_err(|_| "WebGPU not supported")?;

        let adapter_promise = gpu.request_adapter();
        let adapter: GpuAdapter = JsFuture::from(adapter_promise)
            .await?
            .dyn_into()
            .map_err(|_| "failed to get adapter")?;

        let device_promise = adapter.request_device();
        let device: GpuDevice = JsFuture::from(device_promise)
            .await?
            .dyn_into()
            .map_err(|_| "failed to get device")?;

        let queue = device.queue();

        Ok(GpuProcessor { device, queue })
    }

    pub fn is_available(&self) -> bool {
        true
    }

    pub fn create_buffer(&self, size: u32, usage: u32) -> Result<GpuBuffer, JsValue> {
        let desc = GpuBufferDescriptor::new(size as f64, usage);
        Ok(self.device.create_buffer(&desc))
    }

    pub fn create_texture(&self, width: u32, height: u32) -> Result<GpuTexture, JsValue> {
        let size = GpuExtent3dDict::new(width);
        size.set_height(height);
        size.set_depth_or_array_layers(1);

        let desc = GpuTextureDescriptor::new(
            GpuTextureFormat::Rgba8unorm,
            &size,
            GpuTextureUsage::TEXTURE_BINDING |
            GpuTextureUsage::COPY_DST |
            GpuTextureUsage::COPY_SRC |
            GpuTextureUsage::STORAGE_BINDING,
        );

        Ok(self.device.create_texture(&desc))
    }

    pub fn write_texture(&self, texture: &GpuTexture, data: &[u8], width: u32, height: u32) -> Result<(), JsValue> {
        let dest = GpuImageCopyTexture::new(texture);
        let origin = GpuOrigin3dDict::new();
        origin.set_x(0);
        origin.set_y(0);
        origin.set_z(0);
        dest.set_origin(&origin);

        let layout = GpuImageDataLayout::new();
        layout.set_offset(0.0);
        layout.set_bytes_per_row(width * 4);
        layout.set_rows_per_image(height);

        let size = GpuExtent3dDict::new(width);
        size.set_height(height);
        size.set_depth_or_array_layers(1);

        let data_array = Uint8Array::from(data);
        self.queue.write_texture_with_u8_array_and_gpu_extent_3d_dict(
            &dest,
            &data_array,
            &layout,
            &size,
        );

        Ok(())
    }

    pub fn create_shader(&self, code: &str) -> Result<GpuShaderModule, JsValue> {
        let desc = GpuShaderModuleDescriptor::new(code);
        Ok(self.device.create_shader_module(&desc))
    }

    pub fn device(&self) -> &GpuDevice {
        &self.device
    }

    pub fn queue(&self) -> &GpuQueue {
        &self.queue
    }
}

// compute pipeline helper
pub fn create_compute_pipeline(
    device: &GpuDevice,
    shader: &GpuShaderModule,
    entry_point: &str,
) -> Result<GpuComputePipeline, JsValue> {
    let compute_stage = GpuProgrammableStage::new(entry_point, shader);
    let desc = GpuComputePipelineDescriptor::new(&JsValue::from_str("auto"), &compute_stage);
    Ok(device.create_compute_pipeline(&desc))
}
