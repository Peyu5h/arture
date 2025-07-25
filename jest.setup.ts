import "@testing-library/jest-dom";

global.fetch = jest.fn();

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