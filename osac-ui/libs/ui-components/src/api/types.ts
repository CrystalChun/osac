import { UseQueryOptions } from '@tanstack/react-query';

import type { FulfillmentDecodeSchema } from './fulfillment-decode';

/**
 * All known API base routes. Adding a new resource hook requires adding its
 * route here first — unknown strings are rejected at compile time everywhere
 * a query key is constructed or used for cache operations.
 */
export type ApiRoute =
  | 'v1/compute_instances'
  | 'v1/compute_instance_templates'
  | 'v1/compute_instance_catalog_items'
  | 'v1/cluster_catalog_items'
  | 'v1/cluster_templates'
  | 'v1/host_types'
  | 'v1/instance_types'
  | 'v1/clusters'
  | 'v1/organizations'
  | 'v1/users'
  | 'v1/capabilities'
  | 'v1/network_classes'
  | 'v1/virtual_networks'
  | 'v1/subnets'
  | 'v1/security_groups';

/**
 * Strict 3-part tuple that encodes an API address.
 * The QueryClient in the app constructs the URL as:
 *   /<baseUrl>/<pathParams[0]>/<pathParams[1]>?<queryParams>
 */
export type ApiQueryKey = [
  baseUrl: ApiRoute,
  pathParams?: (string | number)[] | null,
  queryParams?: Record<string, string | number | boolean | null | undefined>,
];

export type ApiQueryMeta = {
  decode?: FulfillmentDecodeSchema;
};

export type UseApiQueryOptions<TQueryFnData, TError, TData> = Omit<
  UseQueryOptions<TQueryFnData, TError, TData, ApiQueryKey>,
  'queryKey' | 'meta' | 'queryFn'
> & {
  queryKey: ApiQueryKey;
  meta?: ApiQueryMeta;
};

/**
 * Type-safe factory for query keys used in cache operations
 * (invalidateQueries, refetchQueries, setQueryData, etc.).
 *
 * @example
 * qc.invalidateQueries({ queryKey: apiQueryKey('v1/compute_instances') });
 */
export const apiQueryKey = (
  baseUrl: ApiRoute,
  pathParams?: (string | number)[] | null,
  queryParams?: ApiQueryKey[2],
): ApiQueryKey => [baseUrl, pathParams, queryParams];

export type ApiQueryParams = Record<string, string | number | boolean | null | undefined>;

/**
 * Options shared by reads (queryFn) and writes (mutationFn).
 * The app's ApiProvider constructs the final URL and handles credentials /
 * error handling — callers only supply the route and what varies per call.
 */
export type ApiFetchOptions = {
  /** Dynamic path segments appended after the route, e.g. ['abc-123'] → /v1/compute_instances/abc-123 */
  pathParams?: (string | number)[] | null;
  /** Query-string parameters (GET requests / filtering). */
  queryParams?: ApiQueryParams;
  /** HTTP method — defaults to 'GET'. */
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  /** Request body — serialised to JSON by the provider. */
  body?: unknown;
  /** Parse the response with protobuf `fromJson` using the given message schema. */
  decode?: FulfillmentDecodeSchema;
};

/**
 * Typed fetch function provided by ApiProvider.
 * The first argument must be a known ApiRoute; the provider prepends the
 * app-level base URL so callers never hard-code it.
 */
export type ApiFetch = <T = unknown>(route: ApiRoute, options?: ApiFetchOptions) => Promise<T>;
