import { Hono } from "hono";

const pixabayRoute = new Hono();

// types
interface PixabayImage {
  id: number;
  pageURL: string;
  type: string;
  tags: string;
  previewURL: string;
  webformatURL: string;
  largeImageURL: string;
  imageWidth: number;
  imageHeight: number;
  user: string;
}

interface PixabayResponse {
  total: number;
  totalHits: number;
  hits: PixabayImage[];
}

// rate limit tracking
let rateLimitResetTime: number | null = null;
let isRateLimited = false;

// check if we're rate limited
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

// handle rate limit from response
function handleRateLimitResponse(response: Response): void {
  if (response.status === 429) {
    isRateLimited = true;
    const retryAfter = response.headers.get("Retry-After");
    rateLimitResetTime =
      Date.now() + (retryAfter ? parseInt(retryAfter) * 1000 : 60000);
  }
}

// search pixabay images
pixabayRoute.get("/search", async (c) => {
  try {
    const query = c.req.query("q") || "";
    const page = parseInt(c.req.query("page") || "1");
    const perPage = parseInt(c.req.query("per_page") || "20");
    const imageType = c.req.query("image_type") || "all";

    if (!query) {
      return c.json({ success: false, error: "Query is required" }, 400);
    }

    // check rate limit
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
      process.env.PIXABAY_API_KEY ||
      process.env.PIXABAY_KEY ||
      process.env.NEXT_PUBLIC_PIXABAY_API_KEY;
    if (!apiKey) {
      return c.json({
        success: true,
        data: {
          images: [],
          total: 0,
          page,
          perPage,
          noApiKey: true,
          message: "Pixabay API key not configured.",
        },
      });
    }

    const params = new URLSearchParams({
      key: apiKey,
      q: query,
      page: String(page),
      per_page: String(Math.min(perPage, 200)),
      image_type: imageType,
      safesearch: "true",
    });

    const response = await fetch(
      `https://pixabay.com/api/?${params.toString()}`,
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
      throw new Error(`Pixabay API error: ${response.status}`);
    }

    const data: PixabayResponse = await response.json();

    const images = data.hits.map((hit) => ({
      id: String(hit.id),
      url: hit.largeImageURL,
      thumbnail: hit.webformatURL,
      preview: hit.previewURL,
      tags: hit.tags.split(", "),
      type: hit.type,
      width: hit.imageWidth,
      height: hit.imageHeight,
      user: hit.user,
      source: "pixabay",
    }));

    return c.json({
      success: true,
      data: {
        images,
        total: data.totalHits,
        page,
        perPage,
      },
    });
  } catch (error) {
    console.error("Pixabay search error:", error);
    return c.json({ success: false, error: "Failed to search images" }, 500);
  }
});

// get popular/trending images
pixabayRoute.get("/popular", async (c) => {
  try {
    const page = parseInt(c.req.query("page") || "1");
    const category = c.req.query("category") || "";

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
      process.env.PIXABAY_API_KEY ||
      process.env.PIXABAY_KEY ||
      process.env.NEXT_PUBLIC_PIXABAY_API_KEY;
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
      key: apiKey,
      page: String(page),
      per_page: "30",
      order: "popular",
      safesearch: "true",
      ...(category && { category }),
    });

    const response = await fetch(
      `https://pixabay.com/api/?${params.toString()}`,
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
      throw new Error(`Pixabay API error: ${response.status}`);
    }

    const data: PixabayResponse = await response.json();

    const images = data.hits.map((hit) => ({
      id: String(hit.id),
      url: hit.largeImageURL,
      thumbnail: hit.webformatURL,
      preview: hit.previewURL,
      tags: hit.tags.split(", "),
      type: hit.type,
      width: hit.imageWidth,
      height: hit.imageHeight,
      user: hit.user,
      source: "pixabay",
    }));

    return c.json({
      success: true,
      data: {
        images,
        total: data.totalHits,
        page,
      },
    });
  } catch (error) {
    console.error("Pixabay popular error:", error);
    return c.json(
      { success: false, error: "Failed to get popular images" },
      500,
    );
  }
});

// get illustrations specifically
pixabayRoute.get("/illustrations", async (c) => {
  try {
    const query = c.req.query("q") || "";
    const page = parseInt(c.req.query("page") || "1");

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
      process.env.PIXABAY_API_KEY ||
      process.env.PIXABAY_KEY ||
      process.env.NEXT_PUBLIC_PIXABAY_API_KEY;
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
      key: apiKey,
      q: query || "design",
      page: String(page),
      per_page: "30",
      image_type: "vector",
      safesearch: "true",
    });

    const response = await fetch(
      `https://pixabay.com/api/?${params.toString()}`,
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
      throw new Error(`Pixabay API error: ${response.status}`);
    }

    const data: PixabayResponse = await response.json();

    const images = data.hits.map((hit) => ({
      id: String(hit.id),
      url: hit.largeImageURL,
      thumbnail: hit.webformatURL,
      preview: hit.previewURL,
      tags: hit.tags.split(", "),
      type: hit.type,
      width: hit.imageWidth,
      height: hit.imageHeight,
      user: hit.user,
      source: "pixabay",
    }));

    return c.json({
      success: true,
      data: {
        images,
        total: data.totalHits,
        page,
      },
    });
  } catch (error) {
    console.error("Pixabay illustrations error:", error);
    return c.json(
      { success: false, error: "Failed to get illustrations" },
      500,
    );
  }
});

// status endpoint to check rate limit
pixabayRoute.get("/status", async (c) => {
  return c.json({
    success: true,
    data: {
      rateLimited: checkRateLimit(),
      hasApiKey: !!(
        process.env.PIXABAY_API_KEY ||
        process.env.PIXABAY_KEY ||
        process.env.NEXT_PUBLIC_PIXABAY_API_KEY
      ),
    },
  });
});

export default pixabayRoute;
