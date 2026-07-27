const camelToSnakeCase = (str: string): string =>
  str.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);

const isRecursible = (value: unknown): value is Record<string, unknown> =>
  value !== null &&
  typeof value === 'object' &&
  !Array.isArray(value) &&
  !('$typeName' in (value as Record<string, unknown>));

export const buildUpdateMaskPaths = (body: Record<string, unknown>, prefix = ''): string[] => {
  const paths: string[] = [];
  for (const [key, value] of Object.entries(body)) {
    const snakeKey = camelToSnakeCase(key);
    const fullPath = prefix ? `${prefix}.${snakeKey}` : snakeKey;
    if (isRecursible(value)) {
      paths.push(...buildUpdateMaskPaths(value, fullPath));
    } else {
      paths.push(fullPath);
    }
  }
  return paths;
};
