import { Hono } from "hono";

const proxyRoutes = new Hono();

// proxy svg fetching to bypass cors
proxyRoutes.get("/svg", async (c) => {
  try {
    const url = c.req.query("url");
    
    if (!url) {
      return c.json({ error: "URL parameter required" }, 400);
    }

    // validate url is from our r2 bucket or trusted sources
    const allowedDomains = [
      "pub-843dd4085f8c4cc1a42a96f3ebd54a31.r2.dev",
      "res.cloudinary.com",
    ];
    
    const urlObj = new URL(url);
    const isAllowed = allowedDomains.some(domain => urlObj.hostname.includes(domain));
    
    if (!isAllowed) {
      return c.json({ error: "Domain not allowed" }, 403);
    }

    const response = await fetch(url);
    
    if (!response.ok) {
      return c.json({ error: `Failed to fetch: ${response.status}` }, response.status as any);
    }

    const svgText = await response.text();
    
    return c.text(svgText, 200, {
      "Content-Type": "image/svg+xml",
      "Cache-Control": "public, max-age=31536000",
    });
  } catch (error: any) {
    console.error("Proxy SVG error:", error);
    return c.json({ error: error.message || "Failed to proxy SVG" }, 500);
  }
});

export default proxyRoutes;
