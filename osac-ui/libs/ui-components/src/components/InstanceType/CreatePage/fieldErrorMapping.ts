const FIELD_ERROR_PATTERN = /^field '([\w.]+)'/;

const snakeToCamel = (segment: string): string =>
  segment.replace(/_([a-z0-9])/g, (_match, char: string) => char.toUpperCase());

/** Maps the backend's `field '<snake.path>' ...` validation errors to a Formik field path. */
export const mapCreateErrorToField = (
  message: string,
): { field: string; message: string } | undefined => {
  const match = FIELD_ERROR_PATTERN.exec(message);
  if (!match) {
    return undefined;
  }
  const field = match[1].split('.').map(snakeToCamel).join('.');
  return { field, message };
};
