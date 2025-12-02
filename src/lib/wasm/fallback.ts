// canvas2d fallback for browsers without webgpu support

export interface FallbackProcessor {
  applyFilter(
    imageData: ImageData,
    filterType: string,
    intensity: number
  ): ImageData;
  crop(
    imageData: ImageData,
    x: number,
    y: number,
    width: number,
    height: number
  ): ImageData;
  resize(
    imageData: ImageData,
    newWidth: number,
    newHeight: number
  ): ImageData;
  rotate(
    imageData: ImageData,
    degrees: number
  ): { data: ImageData; width: number; height: number };
  flip(imageData: ImageData, horizontal: boolean): ImageData;
  adjustHue(imageData: ImageData, hueShift: number): ImageData;
  getHistogram(imageData: ImageData): {
    red: Uint32Array;
    green: Uint32Array;
    blue: Uint32Array;
    luminance: Uint32Array;
  };
}

export function createFallbackProcessor(): FallbackProcessor {
  return {
    applyFilter(
      imageData: ImageData,
      filterType: string,
      intensity: number
    ): ImageData {
      const data = new Uint8ClampedArray(imageData.data);
      const len = data.length;

      switch (filterType) {
        case "grayscale":
          for (let i = 0; i < len; i += 4) {
            const gray =
              data[i] * 0.2126 + data[i + 1] * 0.7152 + data[i + 2] * 0.0722;
            const mixed = lerp(data[i], gray, intensity);
            const mixedG = lerp(data[i + 1], gray, intensity);
            const mixedB = lerp(data[i + 2], gray, intensity);
            data[i] = mixed;
            data[i + 1] = mixedG;
            data[i + 2] = mixedB;
          }
          break;

        case "sepia":
          for (let i = 0; i < len; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            const sepiaR = r * 0.393 + g * 0.769 + b * 0.189;
            const sepiaG = r * 0.349 + g * 0.686 + b * 0.168;
            const sepiaB = r * 0.272 + g * 0.534 + b * 0.131;
            data[i] = clamp(lerp(r, sepiaR, intensity));
            data[i + 1] = clamp(lerp(g, sepiaG, intensity));
            data[i + 2] = clamp(lerp(b, sepiaB, intensity));
          }
          break;

        case "invert":
          for (let i = 0; i < len; i += 4) {
            data[i] = lerp(data[i], 255 - data[i], intensity);
            data[i + 1] = lerp(data[i + 1], 255 - data[i + 1], intensity);
            data[i + 2] = lerp(data[i + 2], 255 - data[i + 2], intensity);
          }
          break;

        case "brightness":
          const brightnessAdj = (intensity - 0.5) * 2 * 255;
          for (let i = 0; i < len; i += 4) {
            data[i] = clamp(data[i] + brightnessAdj);
            data[i + 1] = clamp(data[i + 1] + brightnessAdj);
            data[i + 2] = clamp(data[i + 2] + brightnessAdj);
          }
          break;

        case "contrast":
          const factor = intensity * 2;
          for (let i = 0; i < len; i += 4) {
            data[i] = clamp((data[i] - 128) * factor + 128);
            data[i + 1] = clamp((data[i + 1] - 128) * factor + 128);
            data[i + 2] = clamp((data[i + 2] - 128) * factor + 128);
          }
          break;

        case "saturation":
          const sat = intensity * 2;
          for (let i = 0; i < len; i += 4) {
            const gray =
              data[i] * 0.2126 + data[i + 1] * 0.7152 + data[i + 2] * 0.0722;
            data[i] = clamp(gray + (data[i] - gray) * sat);
            data[i + 1] = clamp(gray + (data[i + 1] - gray) * sat);
            data[i + 2] = clamp(gray + (data[i + 2] - gray) * sat);
          }
          break;

        case "warm":
          for (let i = 0; i < len; i += 4) {
            data[i] = clamp(data[i] + 25 * intensity);
            data[i + 2] = clamp(data[i + 2] - 25 * intensity);
          }
          break;

        case "cool":
          for (let i = 0; i < len; i += 4) {
            data[i] = clamp(data[i] - 25 * intensity);
            data[i + 2] = clamp(data[i + 2] + 25 * intensity);
          }
          break;

        case "posterize":
          const levels = Math.max(2, Math.floor(intensity * 10) + 2);
          const step = 255 / (levels - 1);
          for (let i = 0; i < len; i += 4) {
            data[i] = Math.round(data[i] / step) * step;
            data[i + 1] = Math.round(data[i + 1] / step) * step;
            data[i + 2] = Math.round(data[i + 2] / step) * step;
          }
          break;

        case "noise":
          const noiseIntensity = intensity * 50;
          for (let i = 0; i < len; i += 4) {
            const noise = (Math.random() - 0.5) * noiseIntensity;
            data[i] = clamp(data[i] + noise);
            data[i + 1] = clamp(data[i + 1] + noise);
            data[i + 2] = clamp(data[i + 2] + noise);
          }
          break;

        default:
          break;
      }

      return new ImageData(data, imageData.width, imageData.height);
    },

    crop(
      imageData: ImageData,
      x: number,
      y: number,
      width: number,
      height: number
    ): ImageData {
      const canvas = document.createElement("canvas");
      canvas.width = imageData.width;
      canvas.height = imageData.height;
      const ctx = canvas.getContext("2d")!;
      ctx.putImageData(imageData, 0, 0);

      const croppedData = ctx.getImageData(x, y, width, height);
      return croppedData;
    },

    resize(
      imageData: ImageData,
      newWidth: number,
      newHeight: number
    ): ImageData {
      const canvas = document.createElement("canvas");
      canvas.width = imageData.width;
      canvas.height = imageData.height;
      const ctx = canvas.getContext("2d")!;
      ctx.putImageData(imageData, 0, 0);

      const resizeCanvas = document.createElement("canvas");
      resizeCanvas.width = newWidth;
      resizeCanvas.height = newHeight;
      const resizeCtx = resizeCanvas.getContext("2d")!;
      resizeCtx.imageSmoothingEnabled = true;
      resizeCtx.imageSmoothingQuality = "high";
      resizeCtx.drawImage(canvas, 0, 0, newWidth, newHeight);

      return resizeCtx.getImageData(0, 0, newWidth, newHeight);
    },

    rotate(
      imageData: ImageData,
      degrees: number
    ): { data: ImageData; width: number; height: number } {
      const radians = (degrees * Math.PI) / 180;
      const cos = Math.abs(Math.cos(radians));
      const sin = Math.abs(Math.sin(radians));

      const newWidth = Math.ceil(
        imageData.width * cos + imageData.height * sin
      );
      const newHeight = Math.ceil(
        imageData.width * sin + imageData.height * cos
      );

      const canvas = document.createElement("canvas");
      canvas.width = imageData.width;
      canvas.height = imageData.height;
      const ctx = canvas.getContext("2d")!;
      ctx.putImageData(imageData, 0, 0);

      const rotateCanvas = document.createElement("canvas");
      rotateCanvas.width = newWidth;
      rotateCanvas.height = newHeight;
      const rotateCtx = rotateCanvas.getContext("2d")!;

      rotateCtx.translate(newWidth / 2, newHeight / 2);
      rotateCtx.rotate(radians);
      rotateCtx.drawImage(canvas, -imageData.width / 2, -imageData.height / 2);

      return {
        data: rotateCtx.getImageData(0, 0, newWidth, newHeight),
        width: newWidth,
        height: newHeight,
      };
    },

    flip(imageData: ImageData, horizontal: boolean): ImageData {
      const canvas = document.createElement("canvas");
      canvas.width = imageData.width;
      canvas.height = imageData.height;
      const ctx = canvas.getContext("2d")!;
      ctx.putImageData(imageData, 0, 0);

      const flipCanvas = document.createElement("canvas");
      flipCanvas.width = imageData.width;
      flipCanvas.height = imageData.height;
      const flipCtx = flipCanvas.getContext("2d")!;

      if (horizontal) {
        flipCtx.translate(imageData.width, 0);
        flipCtx.scale(-1, 1);
      } else {
        flipCtx.translate(0, imageData.height);
        flipCtx.scale(1, -1);
      }

      flipCtx.drawImage(canvas, 0, 0);
      return flipCtx.getImageData(0, 0, imageData.width, imageData.height);
    },

    adjustHue(imageData: ImageData, hueShift: number): ImageData {
      const data = new Uint8ClampedArray(imageData.data);

      for (let i = 0; i < data.length; i += 4) {
        const [h, s, l] = rgbToHsl(data[i], data[i + 1], data[i + 2]);
        const newH = (h + hueShift) % 360;
        const [r, g, b] = hslToRgb(newH < 0 ? newH + 360 : newH, s, l);
        data[i] = r;
        data[i + 1] = g;
        data[i + 2] = b;
      }

      return new ImageData(data, imageData.width, imageData.height);
    },

    getHistogram(imageData: ImageData): {
      red: Uint32Array;
      green: Uint32Array;
      blue: Uint32Array;
      luminance: Uint32Array;
    } {
      const red = new Uint32Array(256);
      const green = new Uint32Array(256);
      const blue = new Uint32Array(256);
      const luminance = new Uint32Array(256);

      for (let i = 0; i < imageData.data.length; i += 4) {
        const r = imageData.data[i];
        const g = imageData.data[i + 1];
        const b = imageData.data[i + 2];

        red[r]++;
        green[g]++;
        blue[b]++;

        const lum = Math.round(r * 0.2126 + g * 0.7152 + b * 0.0722);
        luminance[Math.min(255, lum)]++;
      }

      return { red, green, blue, luminance };
    },
  };
}

function clamp(value: number, min: number = 0, max: number = 255): number {
  return Math.max(min, Math.min(max, value));
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  r /= 255;
  g /= 255;
  b /= 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;

  if (max === min) {
    return [0, 0, l];
  }

  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

  let h = 0;
  if (max === r) {
    h = ((g - b) / d + (g < b ? 6 : 0)) * 60;
  } else if (max === g) {
    h = ((b - r) / d + 2) * 60;
  } else {
    h = ((r - g) / d + 4) * 60;
  }

  return [h, s, l];
}

function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  if (s === 0) {
    const gray = Math.round(l * 255);
    return [gray, gray, gray];
  }

  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;

  const hueToRgb = (t: number): number => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };

  const hNorm = h / 360;
  return [
    Math.round(hueToRgb(hNorm + 1 / 3) * 255),
    Math.round(hueToRgb(hNorm) * 255),
    Math.round(hueToRgb(hNorm - 1 / 3) * 255),
  ];
}

let fallbackInstance: FallbackProcessor | null = null;

export function getFallbackProcessor(): FallbackProcessor {
  if (!fallbackInstance) {
    fallbackInstance = createFallbackProcessor();
  }
  return fallbackInstance;
}
