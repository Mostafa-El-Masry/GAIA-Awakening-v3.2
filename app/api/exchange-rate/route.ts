import { NextResponse } from "next/server";

const FALLBACK_RATES = {
  source: "fallback",
  rates: {
    // Default FX values used elsewhere in the app (EGP per KWD etc.)
    EGP: 23.5,
    KWD: 0.034,
  },
};

const CACHE_TTL_MS = 1000 * 60 * 10; // 10 minutes is enough for dashboards

type CachedResponse = {
  payload: unknown;
  expiresAt: number;
};

let cache: CachedResponse | null = null;

function hasValidCache() {
  return Boolean(cache) && (cache as CachedResponse).expiresAt > Date.now();
}

function respondFromCache(tag: string) {
  if (!hasValidCache()) return null;
  return NextResponse.json({
    ...(cache?.payload as Record<string, unknown>),
    cacheSource: tag,
  });
}

export async function GET() {
  const API_KEY = process.env.NEXT_PUBLIC_EXCHANGERATE_API_KEY;
  const BASE_URL = process.env.NEXT_PUBLIC_EXCHANGERATE_API_URL;
  // If API config is missing, return a sensible fallback so the dev server
  // doesn't crash and pages depending on exchange rate can still render.
  const missing =
    !BASE_URL ||
    !API_KEY ||
    String(BASE_URL).trim().toLowerCase() === "undefined" ||
    String(API_KEY).trim().toLowerCase() === "undefined";

  if (missing) {
    console.warn("Exchange rate API config missing; returning fallback rates");
    return NextResponse.json(FALLBACK_RATES, { status: 200 });
  }

  if (hasValidCache()) {
    return respondFromCache("memory")!;
  }

  const requestUrl = `${BASE_URL}/live?access_key=${API_KEY}&currencies=EGP,KWD&source=USD`;

  try {
    const response = await fetch(requestUrl, {
      headers: {
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      console.warn(
        `Exchange rate API responded with status ${response.status}; using cache/fallback`
      );
      const cached = respondFromCache("stale");
      if (cached) {
        return cached;
      }
      throw new Error(`API responded with status ${response.status}`);
    }

    const data = await response.json();

    if (data?.success === false) {
      const errorInfo =
        data?.error?.info || "Exchange rate API returned an error response";
      console.warn(errorInfo);
      const cached = respondFromCache("stale-error");
      if (cached) return cached;
      throw new Error(errorInfo);
    }

    cache = {
      payload: data,
      expiresAt: Date.now() + CACHE_TTL_MS,
    };

    return NextResponse.json(data);
  } catch (error) {
    console.error("Exchange rate fetch error:", error);
    // Return last known good cache if possible before falling back.
    const cached = respondFromCache("stale-catch");
    if (cached) {
      return cached;
    }
    // Return fallback on error so UI can continue to render in dev
    return NextResponse.json(FALLBACK_RATES, { status: 200 });
  }
}
