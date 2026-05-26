// ---------------------------------------------------------------------------
// Shared domain types aligned to backend-fulfillment.yaml
// ---------------------------------------------------------------------------

export interface Metadata {
  name: string
  version?: number
  labels?: Record<string, string>
  /** RFC3339 — mapped from wire `creation_timestamp`. */
  createdAt?: string
  /** Wire: creators[] */
  creators?: string[]
  /** Tenancy scope from upstream */
  tenants?: string[]
}

export interface PageOfT<T> {
  size: number
  total: number
  items: T[]
}

export interface ListQuery {
  offset?: number
  limit?: number
  filter?: string
  order?: string
}

// ---------------------------------------------------------------------------
// Compute instances (VMs)
// ---------------------------------------------------------------------------

export type VmPowerState =
  | 'running'
  | 'stopped'
  | 'paused'
  | 'starting'
  | 'stopping'
  | 'restarting'
  | 'deleting'
  | 'error'
  /** Client-only: wizard POST submitted, VM not yet in list (My VMs placeholder). */
  | 'creating'
  /** Client-only: list still missing VM after long wait (My VMs placeholder). */
  | 'still_provisioning'

export interface ComputeInstanceSpec {
  template?: string
  /** Template param values (ProtoJSON Any map). The create-from-template wizard does not populate this; use top-level `spec` fields instead. */
  templateParameters?: Record<string, unknown>
  cores?: number
  memoryGib?: number
  image?: Record<string, unknown>
  bootDisk?: Record<string, unknown>
  additionalDisks?: Record<string, unknown>[]
  /** Fulfillment `run_strategy`: `Always` | `Halted` on REST wire; legacy `RUN_STRATEGY_*` strings are normalized on read. */
  runStrategy?: string
  sshKey?: string
  userData?: string
  subnet?: string
  securityGroups?: string[]
  restartRequestedAt?: string
}

export interface ComputeInstanceCondition {
  type: string
  /** Wire may carry CONDITION_STATUS_*; UI formats via formatConditionStatusForDisplay */
  status: string
  reason?: string
  message?: string
  /** Mapped from wire last_transition_time */
  lastTransitionTime?: string
}

export interface ComputeInstanceStatus {
  state: VmPowerState
  conditions?: ComputeInstanceCondition[]
  ipAddress?: string
  lastRestartedAt?: string
}

export interface ComputeInstance {
  id: string
  metadata: Metadata
  spec: ComputeInstanceSpec
  status: ComputeInstanceStatus
  /** UI-level fields not in proto but useful for demo */
  description?: string
  os?: OsType
  createdAtMs?: number
}

// ---------------------------------------------------------------------------
// Templates
// ---------------------------------------------------------------------------

export interface ClusterTemplateSummary {
  id: string
  title: string
  description?: string
}

export type TemplateWorkloadProfile =
  | 'high-performance'
  | 'analytics'
  | 'machine-learning'
  | 'data-processing'

export interface ClusterTemplate extends ClusterTemplateSummary {
  metadata: Metadata
  spec?: Record<string, unknown>
  status?: Record<string, unknown>
  /** UI extras */
  workload?: string
  /** Wizard: filter chip and card footer label (maps to display string in app). */
  workloadProfile?: TemplateWorkloadProfile
  /** Demo defaults for card summary and BFF template finalize spec.cores / memoryGib. */
  defaultCores?: number
  defaultMemoryGib?: number
  /** From fulfillment **defaults** / **spec_defaults**.boot_disk.size_gib (GiB) for cards and wizard boot disk default. */
  defaultBootDiskSizeGib?: number
  tags?: string[]
  /** OS family for icon + filter: rhel | windows | linux */
  icon?: string
}

// ---------------------------------------------------------------------------
// Events
// ---------------------------------------------------------------------------

export interface OsacEvent {
  id: string
  type: string
  timestamp: string
  relatedObjectRefs?: { kind: string; id: string; name?: string }[]
  message?: string
  severity?: 'info' | 'warning' | 'danger' | 'success'
}

// ---------------------------------------------------------------------------
// Organizations
// ---------------------------------------------------------------------------

export interface Organization {
  id: string
  metadata: Metadata
  displayName: string
  description?: string
  status?: string
  vmCount?: number
}

// ---------------------------------------------------------------------------
// Console access
// ---------------------------------------------------------------------------

export interface ConsoleAccess {
  available: boolean
  reason?: string
  supportedTypes?: string[]
}

// ---------------------------------------------------------------------------
// Capabilities
// ---------------------------------------------------------------------------

export interface TrustedTokenIssuer {
  issuerUrl: string
}

export interface FulfillmentCapabilities {
  authn: {
    trustedTokenIssuers: TrustedTokenIssuer[]
  }
}

// ---------------------------------------------------------------------------
// RBAC / Session types
// ---------------------------------------------------------------------------

export type DemoTenantId = 'vertexa' | 'northstar' | 'evergreen'
export type DemoShellRole = 'providerAdmin' | 'tenantAdmin' | 'tenantUser'
export type OsType = 'rhel' | 'windows' | 'linux'

// ---------------------------------------------------------------------------
// Network topology (UI-level)
// ---------------------------------------------------------------------------

export interface VirtualNetwork {
  id: string
  name: string
  cidr?: string
  subnets?: Subnet[]
}

export interface Subnet {
  id: string
  name: string
  cidr?: string
}
