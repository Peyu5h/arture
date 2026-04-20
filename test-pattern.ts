const source = { src: "http://example.com/image.jpg" };
function getPatternSource(source: any): string | null {
  if (typeof source === "string" && source.trim()) return source;
  if (typeof source === "object" && source !== null && !Array.isArray(source) && typeof source.src === "string" && source.src.trim()) {
    return source.src;
  }
  return null;
}
console.log(getPatternSource(source));
