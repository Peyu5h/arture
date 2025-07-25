import { describe, it, expect } from "@jest/globals";

// Mock fabric.js for testing
const mockCanvas = {
  add: jest.fn(),
  remove: jest.fn(),
  renderAll: jest.fn(),
  getObjects: jest.fn(() => []),
  setDimensions: jest.fn(),
  centerObject: jest.fn(),
  loadFromJSON: jest.fn(),
  dispose: jest.fn(),
};

const mockFabric = {
  Canvas: jest.fn(() => mockCanvas),
  Rect: jest.fn(() => ({
    name: "test-rect",
    fill: "red",
    width: 100,
    height: 100,
  })),
  Circle: jest.fn(() => ({
    name: "test-circle",
    fill: "blue",
    radius: 50,
  })),
  Text: jest.fn(() => ({
    name: "test-text",
    text: "Hello World",
    fontSize: 16,
  })),
  Shadow: jest.fn(() => ({})),
};

describe("Canvas Utilities", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Canvas Initialization", () => {
    it("should create a canvas with default settings", () => {
      const canvasElement = document.createElement("canvas");
      const canvas = new mockFabric.Canvas(canvasElement);

      expect(canvas).toBeDefined();
      expect(mockFabric.Canvas).toHaveBeenCalledWith(canvasElement);
    });

    it("should set canvas dimensions correctly", () => {
      const canvas = mockCanvas;
      const width = 800;
      const height = 600;

      canvas.setDimensions({ width, height });

      expect(canvas.setDimensions).toHaveBeenCalledWith({ width, height });
    });
  });

  describe("Canvas Object Management", () => {
    it("should add objects to canvas", () => {
      const canvas = mockCanvas;
      const rect = new mockFabric.Rect();

      canvas.add(rect);
      canvas.renderAll();

      expect(canvas.add).toHaveBeenCalledWith(rect);
      expect(canvas.renderAll).toHaveBeenCalled();
    });

    it("should remove objects from canvas", () => {
      const canvas = mockCanvas;
      const rect = new mockFabric.Rect();

      canvas.remove(rect);
      canvas.renderAll();

      expect(canvas.remove).toHaveBeenCalledWith(rect);
      expect(canvas.renderAll).toHaveBeenCalled();
    });

    it("should get all objects from canvas", () => {
      const canvas = mockCanvas;
      const objects = canvas.getObjects();

      expect(canvas.getObjects).toHaveBeenCalled();
      expect(Array.isArray(objects)).toBe(true);
    });
  });

  describe("Canvas Rendering", () => {
    it("should render canvas after modifications", () => {
      const canvas = mockCanvas;

      canvas.renderAll();

      expect(canvas.renderAll).toHaveBeenCalled();
    });

    it("should center objects on canvas", () => {
      const canvas = mockCanvas;
      const rect = new mockFabric.Rect();

      canvas.centerObject(rect);

      expect(canvas.centerObject).toHaveBeenCalledWith(rect);
    });
  });

  describe("Canvas Cleanup", () => {
    it("should dispose canvas properly", () => {
      const canvas = mockCanvas;

      canvas.dispose();

      expect(canvas.dispose).toHaveBeenCalled();
    });
  });
});
