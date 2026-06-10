/**
 * API client — routes through /api on the same origin (Go chi proxy).
 * Vite dev server proxies /api → proxy:8080.
 */
import type {
  ClusterTemplate,
  ComputeInstance,
  FulfillmentCapabilities,
  Organization,
  PageOfT,
  User,
} from '@osac/api-contracts/types';
import type {
  ComputeInstancePowerAction,
  SerializeComputeInstanceForCreateOptions,
} from '@osac/api-contracts/computeInstanceNormalize';
import {
  normalizeComputeInstance,
  normalizeComputeInstancePage,
  serializeComputeInstanceForCreate,
  serializeComputeInstancePowerPatch,
} from '@osac/api-contracts/computeInstanceNormalize';
import {
  normalizeComputeInstanceTemplate,
  normalizeComputeInstanceTemplatePage,
} from '@osac/api-contracts/computeInstanceTemplateNormalize';
import { normalizeOrganizationPage } from '@osac/api-contracts/organizationNormalize';
import { normalizeUserPage } from '@osac/api-contracts/userNormalize';

const BASE = '/api/fulfillment/v1';

const parseJson = async (res: Response): Promise<unknown> => {
  return res.json();
};

/** POST/PATCH fulfillment returns `{ object }` for some resources; GET returns the resource directly. */
const unwrapFulfillmentObject = (data: unknown): unknown => {
  if (data && typeof data === 'object' && data !== null && 'object' in data) {
    const o = (data as { object?: unknown }).object;
    if (o !== undefined) {
      return o;
    }
  }
  return data;
};

const buildQueryString = (params: { filter?: string; limit?: number; offset?: number }): string => {
  const q = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value != null) {
      q.set(key, String(value));
    }
  }
  const qs = q.toString();
  return qs ? `?${qs}` : '';
};

const fulfillmentFetch = async (path: string, init?: RequestInit): Promise<Response> => {
  const res = await fetch(`${BASE}${path}`, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...init?.headers },
    ...init,
  });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`API ${res.status}: ${body || res.statusText}`);
  }
  return res;
};

const fulfillmentJson = async (path: string, init?: RequestInit): Promise<unknown> => {
  return parseJson(await fulfillmentFetch(path, init));
};

export const getFulfillmentCapabilities = (): Promise<FulfillmentCapabilities> => {
  return fulfillmentJson('/capabilities') as Promise<FulfillmentCapabilities>;
};

// ---------------------------------------------------------------------------
// Compute instances (normalized wire → ComputeInstance)
// ---------------------------------------------------------------------------

export interface ListComputeInstancesParams {
  filter?: string;
  limit?: number;
  offset?: number;
}

export const listComputeInstances = async (
  params: ListComputeInstancesParams = {},
): Promise<PageOfT<ComputeInstance>> => {
  const path = `/compute_instances${buildQueryString(params)}`;
  return normalizeComputeInstancePage(await fulfillmentJson(path));
};

export const getComputeInstance = async (id: string): Promise<ComputeInstance> => {
  return normalizeComputeInstance(
    await fulfillmentJson(`/compute_instances/${encodeURIComponent(id)}`),
  );
};

export const createComputeInstance = async (
  vm: Partial<ComputeInstance>,
  opts?: SerializeComputeInstanceForCreateOptions,
): Promise<ComputeInstance> => {
  const raw = unwrapFulfillmentObject(
    await fulfillmentJson('/compute_instances', {
      method: 'POST',
      /** Fulfillment HTTP unmarshals **ComputeInstance** at root (not `{ "object": … }`). */
      body: JSON.stringify(serializeComputeInstanceForCreate(vm, opts)),
    }),
  );
  if (raw == null || typeof raw !== 'object') {
    throw new Error('API: missing object in create response');
  }
  return normalizeComputeInstance(raw);
};

export const patchComputeInstance = async (
  id: string,
  patch: Partial<ComputeInstance>,
): Promise<ComputeInstance> => {
  const raw = unwrapFulfillmentObject(
    await fulfillmentJson(`/compute_instances/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: JSON.stringify(patch),
    }),
  );
  if (raw == null || typeof raw !== 'object') {
    throw new Error('API: missing object in patch response');
  }
  return normalizeComputeInstance(raw);
};

export const patchComputeInstancePower = async (
  id: string,
  action: ComputeInstancePowerAction,
): Promise<ComputeInstance> => {
  const raw = unwrapFulfillmentObject(
    await fulfillmentJson(`/compute_instances/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: JSON.stringify(serializeComputeInstancePowerPatch(action)),
    }),
  );
  if (raw == null || typeof raw !== 'object') {
    throw new Error('API: missing object in patch response');
  }
  return normalizeComputeInstance(raw);
};

export const deleteComputeInstance = async (id: string): Promise<void> => {
  await fulfillmentFetch(`/compute_instances/${encodeURIComponent(id)}`, { method: 'DELETE' });
};

// ---------------------------------------------------------------------------
// Compute instance templates (VM catalog + wizard; template-catalog-wizard-api-alignment)
// ---------------------------------------------------------------------------

export interface ListComputeInstanceTemplatesParams {
  filter?: string;
  limit?: number;
  offset?: number;
}

export const listComputeInstanceTemplates = async (
  params: ListComputeInstanceTemplatesParams = {},
): Promise<PageOfT<ClusterTemplate>> => {
  const path = `/compute_instance_templates${buildQueryString(params)}`;
  return normalizeComputeInstanceTemplatePage(await fulfillmentJson(path));
};

export const getComputeInstanceTemplate = async (id: string): Promise<ClusterTemplate> => {
  return normalizeComputeInstanceTemplate(
    await fulfillmentJson(`/compute_instance_templates/${encodeURIComponent(id)}`),
  );
};

// ---------------------------------------------------------------------------
// Organizations
// ---------------------------------------------------------------------------

export interface ListOrganizationsParams {
  filter?: string;
  limit?: number;
  offset?: number;
}

export const listOrganizations = async (
  params: ListOrganizationsParams = {},
): Promise<PageOfT<Organization>> => {
  const path = `/organizations${buildQueryString(params)}`;
  return normalizeOrganizationPage(await fulfillmentJson(path));
};

// ---------------------------------------------------------------------------
// Users
// ---------------------------------------------------------------------------

export interface ListUsersParams {
  filter?: string;
  limit?: number;
  offset?: number;
}

export const listUsers = async (params: ListUsersParams = {}): Promise<PageOfT<User>> => {
  const path = `/users${buildQueryString(params)}`;
  return normalizeUserPage(await fulfillmentJson(path));
};
