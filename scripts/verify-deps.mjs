#!/usr/bin/env node

import fs from "fs";
import path from "path";

// Check for required dependencies
const requiredDeps = {
  "@tailwindcss/typography": "^0.5.0",
  tailwindcss: "^3.0.0",
};

try {
  const packageJson = JSON.parse(
    fs.readFileSync(path.resolve(process.cwd(), "package.json"), "utf8")
  );

  const missing = [];
  for (const [dep, version] of Object.entries(requiredDeps)) {
    if (
      !packageJson.dependencies?.[dep] &&
      !packageJson.devDependencies?.[dep]
    ) {
      missing.push(`${dep}@${version}`);
    }
  }

  if (missing.length > 0) {
    console.error(
      "Missing required dependencies. Installing:",
      missing.join(", ")
    );
    process.exit(1);
  }

  console.log("All required dependencies are installed.");
  process.exit(0);
} catch (error) {
  console.error("Error checking dependencies:", error);
  process.exit(1);
}
