/**
 * BFF create-vm-wizard session API — docs/specs/backend-fulfillment.yaml (bff_demo_osac_extensions).
 */
import type { ComputeInstance } from '@osac/api-contracts'
import type { WizardState } from '../components/vm/createVmWizard/types'
import { buildAuthHeaders } from './authToken'

const BASE = '/api/osac/bff/v1/create-vm-wizard'

export class CreateVmWizardApiError extends Error {
  readonly status: number
  readonly fieldErrors?: Record<string, string>

  constructor(status: number, message: string, fieldErrors?: Record<string, string>) {
    super(message)
    this.name = 'CreateVmWizardApiError'
    this.status = status
    this.fieldErrors = fieldErrors
  }
}

export interface WizardSessionResponse {
  sessionId: string
  activeStepId: string
  activeIndex: number
  skipDeployment: boolean
  stepNav: { id: string; label: string; status: string }[]
  draft: WizardState
}

export interface StartWizardSessionBody {
  entry: 'dashboard' | 'catalog' | 'clone_drawer'
  deploymentMethod?: 'new' | 'template' | 'clone' | null
  presetTemplateId?: string | null
  presetCloneSourceVmId?: string | null
}

async function parseJson(res: Response): Promise<unknown> {
  const text = await res.text()
  if (!text) return {}
  try {
    return JSON.parse(text) as unknown
  } catch {
    return { error: text }
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: buildAuthHeaders({ 'Content-Type': 'application/json', ...(init?.headers ?? {}) }),
    ...init,
  })
  const body = (await parseJson(res)) as {
    error?: string
    fieldErrors?: Record<string, string>
    object?: unknown
  } & T
  if (!res.ok) {
    const msg = typeof body.error === 'string' ? body.error : res.statusText
    throw new CreateVmWizardApiError(res.status, msg, body.fieldErrors)
  }
  return body as T
}

export function startWizardSession(body: StartWizardSessionBody): Promise<WizardSessionResponse> {
  return request<WizardSessionResponse>('/sessions', {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

export function advanceWizardSession(
  sessionId: string,
  fromStepId: string,
  draft: WizardState,
): Promise<WizardSessionResponse> {
  return request<WizardSessionResponse>(`/sessions/${encodeURIComponent(sessionId)}/advance`, {
    method: 'POST',
    body: JSON.stringify({ fromStepId, draft }),
  })
}

export function backWizardSession(sessionId: string): Promise<WizardSessionResponse> {
  return request<WizardSessionResponse>(`/sessions/${encodeURIComponent(sessionId)}/back`, {
    method: 'POST',
    body: JSON.stringify({}),
  })
}

export interface FinalizeResponse {
  object: ComputeInstance
}

export function finalizeWizardSession(
  sessionId: string,
  draft: WizardState,
): Promise<FinalizeResponse> {
  return request<FinalizeResponse>(`/sessions/${encodeURIComponent(sessionId)}/finalize`, {
    method: 'POST',
    body: JSON.stringify({ draft }),
  })
}

export async function abandonWizardSession(sessionId: string): Promise<void> {
  const res = await fetch(`${BASE}/sessions/${encodeURIComponent(sessionId)}`, {
    method: 'DELETE',
    headers: buildAuthHeaders(),
  })
  if (!res.ok && res.status !== 404) {
    const text = await res.text().catch(() => '')
    throw new CreateVmWizardApiError(res.status, text || res.statusText)
  }
}
