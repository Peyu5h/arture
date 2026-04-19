type CanvasJsonValue =
  | string
  | number
  | boolean
  | null
  | undefined
  | CanvasJsonValue[]
  | { [key: string]: CanvasJsonValue };

const isRecord = (
  value: unknown,
): value is { [key: string]: CanvasJsonValue } =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const isPlainObject = (
  value: unknown,
): value is { [key: string]: CanvasJsonValue } => {
  if (!isRecord(value)) return false;
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
};

const isFabricPattern = (value: unknown) =>
  isRecord(value) &&
  (value.type === "pattern" ||
    "patternTransform" in value ||
    ("repeat" in value && "source" in value));

const getPatternSource = (source: unknown): string | null => {
  if (typeof source === "string" && source.trim()) return source;
  if (isRecord(source) && typeof source.src === "string" && source.src.trim()) {
    return source.src;
  }
  return null;
};

const fallbackFill = (parent?: { [key: string]: CanvasJsonValue }) =>
  parent?.name === "clip" ? "white" : "rgba(0,0,0,0)";

const sanitizeValue = (
  value: unknown,
  key?: string,
  parent?: { [key: string]: CanvasJsonValue },
  seen = new WeakSet<object>(),
): CanvasJsonValue => {
  if (Array.isArray(value)) {
    if (seen.has(value)) return [];
    seen.add(value);
    return value.map((item) => sanitizeValue(item, undefined, undefined, seen));
  }

  if (!isRecord(value)) {
    return value as CanvasJsonValue;
  }

  if (isFabricPattern(value)) {
    const source = getPatternSource(value.source);
    if (!source) {
      return key === "stroke" ? "rgba(0,0,0,0)" : fallbackFill(parent);
    }

    return {
      ...value,
      source,
    };
  }

  if (!isPlainObject(value)) {
    return null;
  }

  if (seen.has(value)) {
    return null;
  }
  seen.add(value);

  return Object.fromEntries(
    Object.entries(value).map(([childKey, childValue]) => [
      childKey,
      sanitizeValue(childValue, childKey, value, seen),
    ]),
  );
};

export const sanitizeCanvasJson = <T extends CanvasJsonValue>(value: T): T =>
  sanitizeValue(value) as T;

const isCanvasPatternSource = (source: unknown) => {
  if (!source || typeof source !== "object") return false;

  return (
    (typeof HTMLCanvasElement !== "undefined" &&
      source instanceof HTMLCanvasElement) ||
    (typeof HTMLImageElement !== "undefined" &&
      source instanceof HTMLImageElement) ||
    (typeof HTMLVideoElement !== "undefined" &&
      source instanceof HTMLVideoElement) ||
    (typeof ImageBitmap !== "undefined" && source instanceof ImageBitmap) ||
    (typeof OffscreenCanvas !== "undefined" &&
      source instanceof OffscreenCanvas) ||
    (typeof SVGImageElement !== "undefined" &&
      source instanceof SVGImageElement) ||
    (typeof VideoFrame !== "undefined" && source instanceof VideoFrame)
  );
};

const sanitizeFabricFill = (fill: unknown, fallback: string): unknown => {
  if (!fill || typeof fill !== "object" || !("toLive" in fill)) {
    return fill;
  }

  if (!("source" in fill) && !("repeat" in fill)) {
    return fill;
  }

  const source = (fill as { source?: unknown }).source;
  if (isCanvasPatternSource(source)) {
    return fill;
  }

  return fallback;
};

type FabricObjectLike = {
  name?: string;
  fill?: unknown;
  stroke?: unknown;
  set?: (props: Record<string, unknown>) => void;
  getObjects?: () => FabricObjectLike[];
};

export const sanitizeFabricObjectPatterns = (object: FabricObjectLike) => {
  const fillFallback = object.name === "clip" ? "white" : "rgba(0,0,0,0)";
  const fill = sanitizeFabricFill(object.fill, fillFallback);
  const stroke = sanitizeFabricFill(object.stroke, "rgba(0,0,0,0)");

  object.set?.({ fill, stroke });
  object.getObjects?.().forEach((child) => sanitizeFabricObjectPatterns(child));
};
