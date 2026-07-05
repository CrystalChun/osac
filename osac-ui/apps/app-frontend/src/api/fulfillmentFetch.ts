/**
 * App-level fulfillment HTTP adapter — URL construction, credentials, errors,
 * `{ object }` unwrap, and protobuf JSON decode for cluster responses.
 */
import { decodeFulfillmentResponse } from '@osac/ui-components/api/fulfillment-decode';
import type { ApiFetch, ApiFetchOptions, ApiRoute } from '@osac/ui-components/api/types';
import { formatHttpApiErrorMessage } from '@osac/ui-components/utils/error';
import { UnauthorizedError } from '@osac/ui-components/utils/unauthorizedError';

export const FULFILLMENT_API_BASE = '/api/fulfillment';

export const fulfillmentFetch: ApiFetch = async <T = unknown>(
  route: ApiRoute,
  options: ApiFetchOptions = {},
): Promise<T> => {
  const { pathParams, queryParams, method = 'GET', body, decode } = options;
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

  if (res.status === 401) {
    throw new UnauthorizedError();
  }

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(formatHttpApiErrorMessage(res.status, text, res.statusText));
  }

  if (res.status === 204) {
    return undefined as T;
  }

  const text = await res.text();
  if (!text.trim()) {
    return undefined as T;
  }

  const data: unknown = JSON.parse(text);
  return decodeFulfillmentResponse(decode, data) as T;
};
