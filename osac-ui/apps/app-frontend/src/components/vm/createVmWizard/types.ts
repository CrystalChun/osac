import type { ClusterTemplate, ComputeInstanceCatalogItem } from '@osac/api-contracts/types';

export interface CreateVmWizardHandle {
  open: () => void;
  openFromCatalogItem: (catalogItemId: string) => void;
  openFromClone: (sourceVmId: string) => void;
}

export type DeploymentMode = 'new' | 'template' | 'clone';

export interface WizardState {
  mode: DeploymentMode;
  osFamilyNew: string;
  osTypeNew: string;
  bootSource: 'volume' | 'none' | null;
  cpuNew: string;
  memoryNew: string;
  /** Optional cloud-init / user-data for new path; BFF may map to spec.userData when non-empty. */
  cloudInitUserDataNew: string;
  selectedCatalogItemId: string | null;
  /** Catalog path: boot disk size (GiB), integer string; maps to `spec.boot_disk.size_gib`. */
  templateBootDiskSizeGib: string;
  /** vCPU count; maps to `spec.cores` (int32). Seeded from underlying template defaults in the UI. */
  templateCores: string;
  /** Memory in GiB; maps to `spec.memory_gib`. Seeded from underlying template defaults. */
  templateMemoryGib: string;
  /** Fulfillment REST `run_strategy`: `Always` or `Halted`. */
  templateRunStrategy: string;
  /** Optional subnet fulfillment id; maps to `spec.subnet`. */
  templateSubnetId: string;
  /** Comma-separated security group fulfillment ids; maps to `spec.security_groups`. */
  templateSecurityGroupsRaw: string;
  /** SSH public key; maps to `spec.ssh_key`. */
  templateSshPublicKey: string;
  /** Cloud-init / ignition-style payload; maps to `spec.user_data`. */
  templateUserData: string;
  /** Optional image `source_type` (proto enum string); maps with `templateImageSourceRef` to `spec.image`. */
  templateImageSourceType: string;
  /** Optional image reference (e.g. registry URI); maps with `templateImageSourceType` to `spec.image`. */
  templateImageSourceRef: string;
  /**
   * Optional extra data disks as comma-separated GiB sizes (e.g. `50, 100`);
   * maps to `spec.additional_disks` as `{ size_gib }[]`.
   */
  templateAdditionalDisksGibRaw: string;
  templateVmName: string;
  cloneSourceVmId: string | null;
  cloneNewName: string;
  startAfterCreate: boolean;
}

export type UpdateFn = <K extends keyof WizardState>(key: K, value: WizardState[K]) => void;

/** Resolve the underlying compute_instance_template for customization defaults. */
export const resolveUnderlyingTemplate = (
  catalogItem: ComputeInstanceCatalogItem | null | undefined,
  templates: ClusterTemplate[],
): ClusterTemplate | null => {
  if (!catalogItem?.template) {
    return null;
  }
  return templates.find((t) => t.id === catalogItem.template) ?? null;
};
