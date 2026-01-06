import { Hono } from "hono";

const pexelsRoute = new Hono();

interface PexelsPhoto {
  id: number;
  width: number;
  height: number;
  url: string;
  photographer: string;
  photographer_url: string;
  photographer_id: number;
  avg_color: string;
  src: {
    original: string;
    large2x: string;
    large: string;
    medium: string;
    small: string;
    portrait: string;
    landscape: string;
    tiny: string;
  };
  liked: boolean;
  alt: string;
}

interface PexelsResponse {
  total_results: number;
  page: number;
  per_page: number;
  photos: PexelsPhoto[];
  next_page?: string;
}

// rate limit tracking
let rateLimitResetTime: number | null = null;
let isRateLimited = false;
let remainingRequests: number | null = null;

function checkRateLimit(): boolean {
  if (isRateLimited && rateLimitResetTime) {
    if (Date.now() < rateLimitResetTime) {
      return true;
    }
    isRateLimited = false;
    rateLimitResetTime = null;
  }
  return false;
}

function handleRateLimitResponse(response: Response): void {
  const remaining = response.headers.get("X-Ratelimit-Remaining");
  if (remaining) {
    remainingRequests = parseInt(remaining);
  }

  if (response.status === 429 || remainingRequests === 0) {
    isRateLimited = true;
    const resetTime = response.headers.get("X-Ratelimit-Reset");
    rateLimitResetTime = resetTime
      ? parseInt(resetTime) * 1000
      : Date.now() + 60000;
  }
}

// search pexels photos
pexelsRoute.get("/search", async (c) => {
  try {
    const query = c.req.query("q") || "background";
    const page = parseInt(c.req.query("page") || "1");
    const perPage = parseInt(c.req.query("per_page") || "20");
    const orientation = c.req.query("orientation") || "";

    if (checkRateLimit()) {
      return c.json({
        success: true,
        data: {
          images: [],
          total: 0,
          page,
          perPage,
          rateLimited: true,
          message: "Rate limit exceeded. Please try again later.",
        },
      });
    }

    const apiKey =
      process.env.PEXELS_API_KEY ||
      process.env.PEXELS_KEY ||
      process.env.NEXT_PUBLIC_PEXELS_API_KEY;
    if (!apiKey) {
      return c.json({
        success: true,
        data: {
          images: [],
          total: 0,
          page,
          perPage,
          noApiKey: true,
          message: "Pexels API key not configured.",
        },
      });
    }

    const params = new URLSearchParams({
      query,
      page: String(page),
      per_page: String(Math.min(perPage, 80)),
    });

    if (orientation) {
      params.set("orientation", orientation);
    }

    const response = await fetch(
      `https://api.pexels.com/v1/search?${params.toString()}`,
      {
        headers: {
          Authorization: apiKey,
        },
      },
    );

    handleRateLimitResponse(response);

    if (response.status === 429) {
      return c.json({
        success: true,
        data: {
          images: [],
          total: 0,
          page,
          perPage,
          rateLimited: true,
          message: "Rate limit exceeded. Please try again later.",
        },
      });
    }

    if (!response.ok) {
      throw new Error(`Pexels API error: ${response.status}`);
    }

    const data: PexelsResponse = await response.json();

    const images = data.photos.map((photo) => ({
      id: String(photo.id),
      url: photo.src.large2x || photo.src.original,
      thumbnail: photo.src.medium,
      preview: photo.src.small,
      width: photo.width,
      height: photo.height,
      photographer: photo.photographer,
      avgColor: photo.avg_color,
      alt: photo.alt || `Photo by ${photo.photographer}`,
      source: "pexels",
    }));

    return c.json({
      success: true,
      data: {
        images,
        total: data.total_results,
        page,
        perPage,
      },
    });
  } catch (error) {
    console.error("Pexels search error:", error);
    return c.json({ success: false, error: "Failed to search images" }, 500);
  }
});

// get curated photos
pexelsRoute.get("/curated", async (c) => {
  try {
    const page = parseInt(c.req.query("page") || "1");
    const perPage = parseInt(c.req.query("per_page") || "20");

    if (checkRateLimit()) {
      return c.json({
        success: true,
        data: {
          images: [],
          total: 0,
          page,
          rateLimited: true,
        },
      });
    }

    const apiKey =
      process.env.PEXELS_API_KEY ||
      process.env.PEXELS_KEY ||
      process.env.NEXT_PUBLIC_PEXELS_API_KEY;
    if (!apiKey) {
      return c.json({
        success: true,
        data: {
          images: [],
          total: 0,
          page,
          noApiKey: true,
        },
      });
    }

    const params = new URLSearchParams({
      page: String(page),
      per_page: String(Math.min(perPage, 80)),
    });

    const response = await fetch(
      `https://api.pexels.com/v1/curated?${params.toString()}`,
      {
        headers: {
          Authorization: apiKey,
        },
      },
    );

    handleRateLimitResponse(response);

    if (response.status === 429) {
      return c.json({
        success: true,
        data: {
          images: [],
          total: 0,
          page,
          rateLimited: true,
        },
      });
    }

    if (!response.ok) {
      throw new Error(`Pexels API error: ${response.status}`);
    }

    const data: PexelsResponse = await response.json();

    const images = data.photos.map((photo) => ({
      id: String(photo.id),
      url: photo.src.large2x || photo.src.original,
      thumbnail: photo.src.medium,
      preview: photo.src.small,
      width: photo.width,
      height: photo.height,
      photographer: photo.photographer,
      avgColor: photo.avg_color,
      alt: photo.alt || `Photo by ${photo.photographer}`,
      source: "pexels",
    }));

    return c.json({
      success: true,
      data: {
        images,
        total: data.total_results || 1000,
        page,
      },
    });
  } catch (error) {
    console.error("Pexels curated error:", error);
    return c.json(
      { success: false, error: "Failed to get curated images" },
      500,
    );
  }
});

// status endpoint
pexelsRoute.get("/status", async (c) => {
  return c.json({
    success: true,
    data: {
      rateLimited: checkRateLimit(),
      hasApiKey: !!(
        process.env.PEXELS_API_KEY ||
        process.env.PEXELS_KEY ||
        process.env.NEXT_PUBLIC_PEXELS_API_KEY
      ),
      remainingRequests,
    },
  });
});

export default pexelsRoute;
