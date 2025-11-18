"use client";

/**
 * app/apollo/labs/inventory/page.tsx
 *
 * Main inventory dashboard
 * Shows: 8 locations, 8 POS terminals status, key metrics
 */

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  authenticatedFetch,
  getAuthenticatedUser,
} from "@/lib/supabase-client";
import { useAuth } from "@/app/context/AuthContext";

interface Location {
  id: string;
  name: string;
  code: string;
  location_type: string;
}

interface POSTerminal {
  id: string;
  terminal_num: number;
  terminal_name: string | null;
  location_id: string;
  is_active: number;
  last_online: number | null;
}

interface DashboardStats {
  totalLocations: number;
  totalPOSTerminals: number;
  activeTerminals: number;
  lowStockItems: number;
  todaySales: number;
  todayProfit: number;
}

export default function InventoryDashboard() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [locations, setLocations] = useState<Location[]>([]);
  const [terminals, setTerminals] = useState<POSTerminal[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    totalLocations: 0,
    totalPOSTerminals: 0,
    activeTerminals: 0,
    lowStockItems: 0,
    todaySales: 0,
    todayProfit: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      router.push("/auth/login");
      return;
    }

    fetchDashboardData();
  }, [user, authLoading, router]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch locations
      const locRes = await authenticatedFetch("/api/inventory/locations");
      if (!locRes.ok) throw new Error("Failed to fetch locations");
      const locData = await locRes.json();
      setLocations(locData.data || []);

      // Fetch terminals
      const termRes = await authenticatedFetch("/api/inventory/pos/terminals");
      if (!termRes.ok) throw new Error("Failed to fetch terminals");
      const termData = await termRes.json();
      setTerminals(termData.data || []);

      // Calculate stats
      const activeCount = (termData.data || []).filter(
        (t: POSTerminal) => t.is_active
      ).length;

      const locationCount = (locData.data || []).length;
      const terminalCount = (termData.data || []).length;

      // Simple lab-mode metrics so the dashboard never feels &quot;dead&quot;.
      // These are illustrative, not real accounting numbers.
      const estimatedLowStock = Math.max(locationCount * 2, activeCount); // e.g. a couple of items per location
      const estimatedSalesToday = activeCount * 150; // pretend each active terminal did ~150 KD in sales
      const estimatedProfitToday = Math.round(estimatedSalesToday * 0.3); // 30% margin

      setStats({
        totalLocations: locationCount,
        totalPOSTerminals: terminalCount,
        activeTerminals: activeCount,
        lowStockItems: estimatedLowStock,
        todaySales: estimatedSalesToday,
        todayProfit: estimatedProfitToday,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load dashboard");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Inventory Management
        </h1>
        <p className="text-gray-600">
          Manage products, locations, stock levels, and POS terminals
        </p>
        <p className="mt-2 inline-flex items-center rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">
          ⚗️ Labs build · metrics are illustrative and for experimentation only.
        </p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-800">
          <p className="font-medium">{error}</p>
          <p className="text-sm mt-2">
            💡 <strong>Development Mode:</strong> To use the full inventory
            system with persistent storage, deploy to Cloudflare Pages with D1
            database binding.
          </p>
        </div>
      )}

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow">
          <p className="text-gray-600 text-sm font-medium">Locations</p>
          <p className="text-3xl font-bold text-blue-600 mt-2">
            {stats.totalLocations}
          </p>
          <p className="text-xs text-gray-500 mt-1">/ 8 Available</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <p className="text-gray-600 text-sm font-medium">POS Terminals</p>
          <p className="text-3xl font-bold text-green-600 mt-2">
            {stats.activeTerminals}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            Active / {stats.totalPOSTerminals} Total
          </p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <p className="text-gray-600 text-sm font-medium">Today's Sales</p>
          <p className="text-3xl font-bold text-purple-600 mt-2">
            ${stats.todaySales.toFixed(2)}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            Profit: ${stats.todayProfit.toFixed(2)}
          </p>
        </div>
      </div>

      {/* Navigation Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Link
          href="/apollo/labs/inventory/locations"
          className="p-4 bg-white rounded-lg shadow hover:shadow-md transition border-l-4 border-blue-500"
        >
          <h3 className="font-semibold text-gray-900 mb-1">Locations</h3>
          <p className="text-sm text-gray-600">
            Manage {stats.totalLocations} locations
          </p>
        </Link>

        <Link
          href="/apollo/labs/inventory/products"
          className="p-4 bg-white rounded-lg shadow hover:shadow-md transition border-l-4 border-green-500"
        >
          <h3 className="font-semibold text-gray-900 mb-1">Products</h3>
          <p className="text-sm text-gray-600">Catalog and pricing</p>
        </Link>

        <Link
          href="/apollo/labs/inventory/stock"
          className="p-4 bg-white rounded-lg shadow hover:shadow-md transition border-l-4 border-yellow-500"
        >
          <h3 className="font-semibold text-gray-900 mb-1">Stock Levels</h3>
          <p className="text-sm text-gray-600">By location tracking</p>
        </Link>

        <Link
          href="/apollo/labs/inventory/pos"
          className="p-4 bg-white rounded-lg shadow hover:shadow-md transition border-l-4 border-purple-500"
        >
          <h3 className="font-semibold text-gray-900 mb-1">POS Terminals</h3>
          <p className="text-sm text-gray-600">
            {stats.activeTerminals} active terminals
          </p>
        </Link>

        <Link
          href="/apollo/labs/inventory/accounting"
          className="p-4 bg-white rounded-lg shadow hover:shadow-md transition border-l-4 border-red-500"
        >
          <h3 className="font-semibold text-gray-900 mb-1">Cost Accounting</h3>
          <p className="text-sm text-gray-600">Profit & loss tracking</p>
        </Link>

        <Link
          href="/apollo/labs/inventory/sales"
          className="p-4 bg-white rounded-lg shadow hover:shadow-md transition border-l-4 border-indigo-500"
        >
          <h3 className="font-semibold text-gray-900 mb-1">Sales Reports</h3>
          <p className="text-sm text-gray-600">Transaction history</p>
        </Link>

        <div className="p-4 bg-gray-100 rounded-lg border-2 border-dashed border-gray-300">
          <h3 className="font-semibold text-gray-500 mb-1">More Features</h3>
          <p className="text-sm text-gray-500">Coming soon</p>
        </div>

        <div className="p-4 bg-gray-100 rounded-lg border-2 border-dashed border-gray-300">
          <h3 className="font-semibold text-gray-500 mb-1">More Features</h3>
          <p className="text-sm text-gray-500">Coming soon</p>
        </div>
      </div>

      {/* Recently Active Terminals */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          POS Terminal Status
        </h2>

        {terminals.length === 0 ? (
          <p className="text-gray-600 text-sm">No terminals configured yet</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            {terminals.map((terminal) => (
              <div
                key={terminal.id}
                className={`p-3 rounded border ${
                  terminal.is_active
                    ? "bg-green-50 border-green-200"
                    : "bg-red-50 border-red-200"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold text-sm">
                    {terminal.terminal_name ||
                      `Terminal ${terminal.terminal_num}`}
                  </span>
                  <span
                    className={`inline-block w-2 h-2 rounded-full ${
                      terminal.is_active ? "bg-green-500" : "bg-red-500"
                    }`}
                  ></span>
                </div>
                <p className="text-xs text-gray-600">
                  {terminal.last_online
                    ? `Last active: ${new Date(
                        terminal.last_online
                      ).toLocaleString()}`
                    : "Never active"}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
