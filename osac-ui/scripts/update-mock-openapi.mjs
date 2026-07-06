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
  console.error(`Failed to download OpenAPI spec: HTTP ${response.status} for ${specUrl}`);
  process.exit(1);
}

await mkdir(path.dirname(outPath), { recursive: true });
await writeFile(outPath, await response.text());
console.log(`Updated ${path.relative(repoRoot, outPath)} from ${specUrl}`);
