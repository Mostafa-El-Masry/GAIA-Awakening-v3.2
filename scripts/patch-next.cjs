const fs = require('fs');
const path = require('path');

const entriesPath = path.join(__dirname, '..', 'node_modules', 'next', 'dist', 'build', 'entries.js');
const marker = '[_entryconstants.UNDERSCORE_GLOBAL_ERROR_ROUTE_ENTRY]';

if (!fs.existsSync(entriesPath)) {
  console.warn('[patch-next] entries.js not found, skipping');
  process.exit(0);
}

let source = fs.readFileSync(entriesPath, 'utf8');

const assignPattern = "            if (pageKey === _entryconstants.UNDERSCORE_GLOBAL_ERROR_ROUTE) {\n                pageKey = _entryconstants.UNDERSCORE_GLOBAL_ERROR_ROUTE_ENTRY;\n            }\n";
const assignReplacement = "            if (pageKey === _entryconstants.UNDERSCORE_GLOBAL_ERROR_ROUTE) {\n                return;\n            }\n";
if (source.includes(assignPattern)) {
  source = source.replace(assignPattern, assignReplacement);
}

const entryPattern = "                    },\n                    ...hasAppGlobalError && {\n                        [_entryconstants.UNDERSCORE_GLOBAL_ERROR_ROUTE_ENTRY]: require.resolve('next/dist/client/components/builtin/app-error')\n                    },\n                    ...pages\n";
const entryReplacement = "                    },\n                    ...pages\n";
if (source.includes(entryPattern)) {
  source = source.replace(entryPattern, entryReplacement);
}

if (!source.includes(marker)) {
  fs.writeFileSync(entriesPath, source, 'utf8');
  console.log('[patch-next] Patched entries.js to skip global error route.');
} else {
  console.log('[patch-next] entries.js already patched.');
}
