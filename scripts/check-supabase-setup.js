#!/usr/bin/env node

/**
 * Diagnostic script to verify Supabase configuration
 * Run with: node scripts/check-supabase-setup.js
 */

const fs = require("fs");
const path = require("path");

console.log("\n=== SUPABASE SETUP DIAGNOSTIC ===\n");

// Check 1: .env.local exists
const envLocalPath = path.join(__dirname, "..", ".env.local");
console.log("✓ Checking for .env.local file...");
if (fs.existsSync(envLocalPath)) {
  console.log("  ✅ .env.local found");
} else {
  console.log("  ❌ .env.local NOT found");
  console.log(
    "  📝 Copy .env.example to .env.local and fill in your credentials"
  );
}

// Check 2: .env.example exists
const envExamplePath = path.join(__dirname, "..", ".env.example");
console.log("\n✓ Checking for .env.example...");
if (fs.existsSync(envExamplePath)) {
  console.log("  ✅ .env.example found");
} else {
  console.log("  ⚠️  .env.example not found (should exist for reference)");
}

// Check 3: Environment variables loaded
console.log("\n✓ Checking environment variables...");
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (supabaseUrl) {
  console.log(
    "  ✅ NEXT_PUBLIC_SUPABASE_URL:",
    supabaseUrl.substring(0, 20) + "..."
  );
} else {
  console.log("  ❌ NEXT_PUBLIC_SUPABASE_URL is missing");
}

if (supabaseKey) {
  console.log(
    "  ✅ NEXT_PUBLIC_SUPABASE_ANON_KEY:",
    supabaseKey.substring(0, 20) + "..."
  );
} else {
  console.log("  ❌ NEXT_PUBLIC_SUPABASE_ANON_KEY is missing");
}

if (serviceRoleKey) {
  console.log(
    "  ✅ SUPABASE_SERVICE_ROLE_KEY:",
    serviceRoleKey.substring(0, 20) + "..."
  );
} else {
  console.log(
    "  ⚠️  SUPABASE_SERVICE_ROLE_KEY is missing (needed for server-side operations)"
  );
}

// Check 4: Required files exist
console.log("\n✓ Checking required files...");
const requiredFiles = [
  "lib/supabase-client.ts",
  "lib/supabase-server.ts",
  "app/context/AuthContext.tsx",
  "app/auth/login/page.tsx",
  "app/apollo/labs/inventory/page.tsx",
];

requiredFiles.forEach((file) => {
  const filePath = path.join(__dirname, "..", file);
  if (fs.existsSync(filePath)) {
    console.log(`  ✅ ${file}`);
  } else {
    console.log(`  ❌ ${file} NOT FOUND`);
  }
});

// Summary
console.log("\n=== SUMMARY ===\n");
if (supabaseUrl && supabaseKey) {
  console.log("✅ Supabase is configured!");
  console.log("\nNext steps:");
  console.log("1. Start dev server: npm run dev");
  console.log("2. Go to: http://localhost:3000/auth/login");
  console.log("3. Sign in with your credentials");
  console.log("4. Navigate to: http://localhost:3000/labs/inventory");
} else {
  console.log("❌ Supabase is NOT fully configured");
  console.log("\nTo fix:");
  console.log("1. Copy .env.example to .env.local");
  console.log(
    "2. Get credentials from: https://supabase.com → Dashboard → Settings → API"
  );
  console.log(
    "3. Fill in NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY"
  );
  console.log("4. Run: npm run dev");
  console.log("\nFor detailed help: see docs/SETUP-SUPABASE.md");
}

console.log("\n");
