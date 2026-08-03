import { toSnakeCase } from '../../utils/snakeCase';

const isRecursible = (value: unknown): value is Record<string, unknown> =>
  value !== null &&
  typeof value === 'object' &&
  !Array.isArray(value) &&
  !('$typeName' in (value as Record<string, unknown>));

const isOneofField = (value: unknown): value is { case: string; value: unknown } =>
  isRecursible(value) && typeof value.case === 'string' && 'value' in value;

export const buildUpdateMaskPaths = (body: Record<string, unknown>, prefix = ''): string[] => {
  const paths: string[] = [];
  for (const [key, value] of Object.entries(body)) {
    if (isOneofField(value)) {
      const oneofPath = prefix ? `${prefix}.${toSnakeCase(value.case)}` : toSnakeCase(value.case);
      if (isRecursible(value.value)) {
        paths.push(...buildUpdateMaskPaths(value.value, oneofPath));
      } else {
        paths.push(oneofPath);
      }
      continue;
    }
    const snakeKey = toSnakeCase(key);
    const fullPath = prefix ? `${prefix}.${snakeKey}` : snakeKey;
    if (isRecursible(value)) {
      paths.push(...buildUpdateMaskPaths(value, fullPath));
    } else {
      paths.push(fullPath);
    }
  }
  return paths;
};
