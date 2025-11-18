"use client";

import { readJSON, writeJSON } from "@/lib/user-storage";

interface ExchangeRateResponse {
  success: boolean;
  timestamp: number;
  source?: string;
  quotes: Record<string, number>;
}

interface StoredRate {
  rate: number;
  timestamp: number;
}

// Using local API route to avoid CORS issues
const BASE_URL = "/api/exchange-rate";

export async function fetchExchangeRate(): Promise<{
  rate: number;
  timestamp: number;
} | null> {
  try {
    console.log("Fetching exchange rate from proxy...");
    const response = await fetch(BASE_URL);

    if (!response.ok) {
      console.error("Response not OK:", response.status, response.statusText);
      throw new Error(
        `Failed to fetch exchange rate: ${response.status} ${response.statusText}`
      );
    }

    const data: ExchangeRateResponse = await response.json();
    console.log("API Response:", data);

    if (!data.success) {
      throw new Error("API request was not successful");
    }

    // Check if we have both rates
    if (!data.quotes?.USDEGP || !data.quotes?.USDKWD) {
      console.error("Missing required exchange rates:", data.quotes);
      throw new Error("Missing required exchange rates");
    }

    // Calculate EGP/KWD rate
    const egpPerKwd = data.quotes.USDEGP / data.quotes.USDKWD;

    if (isNaN(egpPerKwd) || egpPerKwd <= 0) {
      throw new Error("Invalid exchange rate calculation");
    }

    return {
      rate: egpPerKwd,
      timestamp: data.timestamp * 1000, // Convert to milliseconds
    };
  } catch (error) {
    console.error("Error fetching exchange rate:", error);
    return null;
  }
}

const STORAGE_KEY = "exchangeRateEGP_KWD";
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

function getStoredRate(): StoredRate | null {
  return readJSON<StoredRate | null>(STORAGE_KEY, null);
}

function storeRate(rate: number, timestamp: number) {
  try {
    writeJSON(STORAGE_KEY, { rate, timestamp });
  } catch (error) {
    console.warn("Failed to store exchange rate:", error);
  }
}

export async function getExchangeRate(): Promise<{
  rate: number;
  timestamp: number;
  isCached: boolean;
}> {
  const now = Date.now();
  const stored = getStoredRate();

  // If we have a stored rate and it's less than 24 hours old, use it
  if (stored && now - stored.timestamp < CACHE_DURATION) {
    return {
      rate: stored.rate,
      timestamp: stored.timestamp,
      isCached: true,
    };
  }

  // Otherwise fetch a new rate
  const result = await fetchExchangeRate();
  if (result) {
    storeRate(result.rate, result.timestamp);
    return { ...result, isCached: false };
  }

  // If fetch failed and we have a stored rate, return it as cached
  if (stored) {
    return {
      rate: stored.rate,
      timestamp: stored.timestamp,
      isCached: true,
    };
  }

  // Last resort - return 0 if we have no data at all
  return {
    rate: 0,
    timestamp: now,
    isCached: false,
  };
}
