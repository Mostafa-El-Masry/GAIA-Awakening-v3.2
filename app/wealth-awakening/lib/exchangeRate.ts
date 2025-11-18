"use client";

import { readJSON, writeJSON } from "@/lib/user-storage";

type ProviderQuotes = Record<string, number>;

interface ProviderResponse {
  success?: boolean;
  timestamp?: number;
  source?: string;
  quotes?: ProviderQuotes;
  rates?: Record<string, number>;
}

interface StoredRate {
  rate: number;
  timestamp: number;
}

const STORAGE_KEY = "wealth_awakening_fx_egp_per_kwd";
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours in ms
const BASE_URL = "/api/exchange-rate";

async function fetchExchangeRate(): Promise<{ rate: number; timestamp: number } | null> {
  try {
    const response = await fetch(BASE_URL);
    if (!response.ok) {
      throw new Error(`Failed to fetch exchange rate: ${response.status}`);
    }

    const data: ProviderResponse = await response.json();

    // Case 1: Provider-style payload with quotes.USDEGP / quotes.USDKWD
    if (data.quotes && typeof data.quotes.USDEGP === "number" && typeof data.quotes.USDKWD === "number") {
      const egpPerKwd = data.quotes.USDEGP / data.quotes.USDKWD;
      if (!Number.isFinite(egpPerKwd) || egpPerKwd <= 0) {
        throw new Error("Invalid FX calculation from quotes");
      }
      const ts = (data.timestamp ?? Math.floor(Date.now() / 1000)) * 1000;
      return { rate: egpPerKwd, timestamp: ts };
    }

    // Case 2: Fallback payload from /api/exchange-rate with rates.EGP
    if (data.rates && typeof data.rates.EGP === "number") {
      const egpPerKwd = data.rates.EGP;
      if (!Number.isFinite(egpPerKwd) || egpPerKwd <= 0) {
        throw new Error("Invalid fallback FX rate");
      }
      const ts = Date.now();
      return { rate: egpPerKwd, timestamp: ts };
    }

    throw new Error("Exchange rate payload not recognised");
  } catch (error) {
    console.error("Wealth Awakening: FX fetch error:", error);
    return null;
  }
}

function getStoredRate(): StoredRate | null {
  return readJSON<StoredRate | null>(STORAGE_KEY, null);
}

function storeRate(rate: number, timestamp: number) {
  try {
    writeJSON<StoredRate>(STORAGE_KEY, { rate, timestamp });
  } catch (error) {
    console.warn("Wealth Awakening: failed to persist FX rate:", error);
  }
}

export async function getExchangeRate(): Promise<{
  rate: number;
  timestamp: number;
  isCached: boolean;
}> {
  const now = Date.now();
  const stored = getStoredRate();

  // Use stored rate if it is fresher than 24h
  if (stored && now - stored.timestamp < CACHE_DURATION && Number.isFinite(stored.rate) && stored.rate > 0) {
    return {
      rate: stored.rate,
      timestamp: stored.timestamp,
      isCached: true,
    };
  }

  // Otherwise fetch a new one
  const fresh = await fetchExchangeRate();
  if (fresh && Number.isFinite(fresh.rate) && fresh.rate > 0) {
    storeRate(fresh.rate, fresh.timestamp);
    return { ...fresh, isCached: false };
  }

  // If fetch failed but we still have a stored rate, fall back to it
  if (stored && Number.isFinite(stored.rate) && stored.rate > 0) {
    return {
      rate: stored.rate,
      timestamp: stored.timestamp,
      isCached: true,
    };
  }

  // Last resort – return a neutral 0 value
  return {
    rate: 0,
    timestamp: now,
    isCached: false,
  };
}
