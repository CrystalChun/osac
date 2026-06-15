/**
 * App-level fulfillment HTTP adapter — URL construction, credentials, errors, and
 * `{ object }` unwrap only. Responses are returned as parsed JSON without normalization.
 */
import type { ApiFetch, ApiFetchOptions, ApiRoute } from '@osac/ui-components/api/types';

export const FULFILLMENT_API_BASE = '/api/fulfillment';

/** POST/PATCH fulfillment returns `{ object }` for some resources; GET-by-id may too. */
export const unwrapFulfillmentObject = (data: unknown): unknown => {
  if (data && typeof data === 'object' && data !== null && 'object' in data) {
    const o = (data as { object?: unknown }).object;
    if (o !== undefined) {
      return o;
    }
  }
  return data;
};

const fulfillmentFetchImpl = async <T = unknown>(
  route: ApiRoute,
  options: ApiFetchOptions = {},
): Promise<T> => {
  const { pathParams, queryParams, method = 'GET', body } = options;

  let path: string = route;

  if (Array.isArray(pathParams)) {
    const segment = pathParams
      .filter((p) => p !== undefined && p !== null)
      .map((p) => encodeURIComponent(String(p)))
      .join('/');
    if (segment) {
      path = `${path}/${segment}`;
    }
  }

  if (queryParams) {
    const cleanParams = Object.fromEntries(
      Object.entries(queryParams).filter(([, v]) => v !== undefined && v !== null),
    );
    const queryString = new URLSearchParams(cleanParams as Record<string, string>).toString();
    if (queryString) {
      path = `${path}?${queryString}`;
    }
  }

  const res = await fetch(`${FULFILLMENT_API_BASE}/${path}`, {
    credentials: 'include',
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`API ${res.status}: ${text || res.statusText}`);
  }

  if (res.status === 204) {
    return undefined as T;
  }

  const text = await res.text();
  if (!text.trim()) {
    return undefined as T;
  }

  const data: unknown = JSON.parse(text);
  return unwrapFulfillmentObject(data) as T;
};

export const fulfillmentFetch: ApiFetch = fulfillmentFetchImpl;
