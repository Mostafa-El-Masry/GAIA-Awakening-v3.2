/**
 * lib/supabase-client.ts
 *
 * Client-side Supabase client for browser-based authentication and queries.
 * Handles session management and JWT token refresh.
 */

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const isSupabaseClientConfigured = Boolean(
  supabaseUrl && supabaseAnonKey
);

let supabaseClient: SupabaseClient | null = null;

function getSupabaseBrowserClient(): SupabaseClient {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      "Missing Supabase environment variables: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY"
    );
  }

  if (!supabaseClient) {
    supabaseClient = createClient(supabaseUrl, supabaseAnonKey);
  }

  return supabaseClient;
}

if (isSupabaseClientConfigured) {
  supabaseClient = getSupabaseBrowserClient();
}

export { supabaseClient, getSupabaseBrowserClient };

/**
 * Get current authenticated user from session
 * @returns User object or null if not authenticated
 */
export async function getAuthenticatedUser() {
  const client = getSupabaseBrowserClient();
  const {
    data: { user },
  } = await client.auth.getUser();
  return user;
}

/**
 * Get current session
 * @returns Session object or null if not authenticated
 */
export async function getSession() {
  const client = getSupabaseBrowserClient();
  const {
    data: { session },
  } = await client.auth.getSession();
  return session;
}

/**
 * Sign in with email and password
 */
export async function signInWithPassword(email: string, password: string) {
  const client = getSupabaseBrowserClient();
  return await client.auth.signInWithPassword({
    email,
    password,
  });
}

/**
 * Sign up new user with email and password
 */
export async function signUpWithPassword(email: string, password: string) {
  const client = getSupabaseBrowserClient();
  return await client.auth.signUp({
    email,
    password,
  });
}

/**
 * Sign out current user
 */
export async function signOut() {
  const client = getSupabaseBrowserClient();
  return await client.auth.signOut();
}

/**
 * Make authenticated API call with JWT token
 * @param url - API endpoint
 * @param options - Fetch options
 * @returns Response
 */
export async function authenticatedFetch(
  url: string,
  options: RequestInit = {}
) {
  const client = getSupabaseBrowserClient();
  const session = await getSession();

  if (!session) {
    throw new Error("No active session. Please sign in first.");
  }

  const headers = {
    ...options.headers,
    Authorization: `Bearer ${session.access_token}`,
    "Content-Type": "application/json",
  };

  return fetch(url, {
    ...options,
    headers,
  });
}

/**
 * Fetch inventory locations (example usage)
 */
export async function fetchLocations() {
  try {
    const response = await authenticatedFetch("/api/inventory/locations");
    if (!response.ok) {
      throw new Error(`Failed to fetch locations: ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error("Error fetching locations:", error);
    throw error;
  }
}

/**
 * Fetch products (example usage)
 */
export async function fetchProducts(categoryFilter?: string) {
  try {
    const url = new URL("/api/inventory/products", window.location.origin);
    if (categoryFilter) {
      url.searchParams.set("category", categoryFilter);
    }

    const response = await authenticatedFetch(url.toString());
    if (!response.ok) {
      throw new Error(`Failed to fetch products: ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error("Error fetching products:", error);
    throw error;
  }
}

/**
 * Fetch stock entries (example usage)
 */
export async function fetchStock(locationId?: string, productId?: string) {
  try {
    const url = new URL("/api/inventory/stock", window.location.origin);
    if (locationId) {
      url.searchParams.set("location_id", locationId);
    }
    if (productId) {
      url.searchParams.set("product_id", productId);
    }

    const response = await authenticatedFetch(url.toString());
    if (!response.ok) {
      throw new Error(`Failed to fetch stock: ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error("Error fetching stock:", error);
    throw error;
  }
}

/**
 * Subscribe to authentication state changes
 */
export function onAuthStateChange(
  callback: (event: string, session: any) => void
) {
  const client = getSupabaseBrowserClient();
  const {
    data: { subscription },
  } = client.auth.onAuthStateChange(callback);

  return subscription;
}
