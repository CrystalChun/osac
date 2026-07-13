import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outPath = path.join(repoRoot, 'mock/openapi/v3/public.yaml');
const specUrl =
  process.env.MOCK_OPENAPI_URL ??
  'https://osac-project.github.io/fulfillment-service/openapi/v3/public.yaml';

const response = await fetch(specUrl);
if (!response.ok) {
  console.error(`Failed to download OpenAPI spec: HTTP ${response.status}`);
  process.exit(1);
}

let specText = await response.text();

// Upstream spec omits the components/schemas prefix on a few update request bodies.
specText = specText.replace(
  /(\$ref: )(?=#\/components\/schemas\/)?((?:The (?:updated )?[^.\n]+|The [^.\n]+ with updated fields)\.)/g,
  "$1'#/components/schemas/$2'",
);

await mkdir(path.dirname(outPath), { recursive: true });
await writeFile(outPath, specText);
console.log(`Updated ${path.relative(repoRoot, outPath)}`);
