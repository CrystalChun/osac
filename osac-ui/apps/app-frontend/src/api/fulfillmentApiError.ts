/** Turn fulfillmentFetch `Error("API 403: …")` into user-facing wizard copy. */
export const formatFulfillmentApiError = (error: unknown): string => {
  if (!(error instanceof Error)) {
    return 'Provisioning failed. Please try again.';
  }

  const match = /^API (\d+):([\s\S]*)$/.exec(error.message);
  if (!match) {
    return error.message || 'Provisioning failed. Please try again.';
  }

  const status = match[1];
  const body = match[2]?.trim() ?? '';

  if (status === '403') {
    return 'Permission denied. You may not have access to provision this resource.';
  }

  if (body) {
    try {
      const parsed = JSON.parse(body) as { message?: string; code?: unknown };
      if (typeof parsed.message === 'string' && parsed.message.trim()) {
        return parsed.message.trim();
      }
    } catch {
      if (body.length <= 240) {
        return body;
      }
    }
  }

  return error.message || 'Provisioning failed. Please try again.';
};
