import "@testing-library/jest-dom";

global.fetch = jest.fn();

// Mock canvas
const mockCanvas = {
  createCanvas: jest.fn(() => ({
    getContext: jest.fn(() => ({
      fillRect: jest.fn(),
      clearRect: jest.fn(),
      getImageData: jest.fn(() => ({ data: new Array(4) })),
      putImageData: jest.fn(),
      createImageData: jest.fn(() => []),
      setTransform: jest.fn(),
      drawImage: jest.fn(),
      save: jest.fn(),
      fillText: jest.fn(),
      restore: jest.fn(),
      beginPath: jest.fn(),
      moveTo: jest.fn(),
      lineTo: jest.fn(),
      closePath: jest.fn(),
      stroke: jest.fn(),
      translate: jest.fn(),
      scale: jest.fn(),
      rotate: jest.fn(),
      arc: jest.fn(),
      fill: jest.fn(),
      measureText: jest.fn(() => ({ width: 0 })),
      transform: jest.fn(),
      rect: jest.fn(),
      quadraticCurveTo: jest.fn(),
    })),
    toBuffer: jest.fn(() => Buffer.from([])),
    toDataURL: jest.fn(() => "data:image/png;base64,"),
  })),
  registerFont: jest.fn(),
  createSyncPNGStream: jest.fn(),
  createSyncJPEGStream: jest.fn(),
  createPNGStream: jest.fn(),
  createJPEGStream: jest.fn(),
  Image: jest.fn(() => ({
    src: "",
    onload: jest.fn(),
    onerror: jest.fn(),
  })),
};

// Mock fabric.js
(global as any).fabric = {
  Canvas: jest.fn(() => ({
    setDimensions: jest.fn(),
    renderAll: jest.fn(),
    loadFromJSON: jest.fn(),
    add: jest.fn(),
    centerObject: jest.fn(),
    dispose: jest.fn(),
    getObjects: jest.fn(() => []),
    enableDrawingMode: jest.fn(),
    disableDrawingMode: jest.fn(),
    getContext: jest.fn(() => ({
      fillRect: jest.fn(),
      clearRect: jest.fn(),
      getImageData: jest.fn(() => ({ data: new Array(4) })),
      putImageData: jest.fn(),
      createImageData: jest.fn(() => []),
      setTransform: jest.fn(),
      drawImage: jest.fn(),
      save: jest.fn(),
      fillText: jest.fn(),
      restore: jest.fn(),
      beginPath: jest.fn(),
      moveTo: jest.fn(),
      lineTo: jest.fn(),
      closePath: jest.fn(),
      stroke: jest.fn(),
      translate: jest.fn(),
      scale: jest.fn(),
      rotate: jest.fn(),
      arc: jest.fn(),
      fill: jest.fn(),
      measureText: jest.fn(() => ({ width: 0 })),
      transform: jest.fn(),
      rect: jest.fn(),
      quadraticCurveTo: jest.fn(),
    })),
  })),
  Rect: jest.fn(() => ({
    name: "clip",
    fill: "white",
    selectable: false,
    hasControls: false,
  })),
  Circle: jest.fn(() => ({
    name: "circle",
    fill: "blue",
    radius: 50,
  })),
  Text: jest.fn(() => ({
    name: "text",
    text: "Hello World",
    fontSize: 16,
  })),
  Shadow: jest.fn(() => ({
    reOffsetsAndBlur: jest.fn(),
  })),
};

// Mock canvas module
jest.mock("canvas", () => mockCanvas);

jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
    prefetch: jest.fn(),
  }),
  useParams: () => ({ projectId: "test-project-id" }),
  useSearchParams: () => new URLSearchParams(),
}));

Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: jest.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

global.IntersectionObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));
