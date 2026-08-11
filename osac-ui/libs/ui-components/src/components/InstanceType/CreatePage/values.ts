export interface InstanceTypeCreateFormValues {
  metadata: { name: string };
  spec: { description: string; cores: string; memoryGib: string };
}

export const instanceTypeCreateValues: InstanceTypeCreateFormValues = {
  metadata: { name: '' },
  spec: { description: '', cores: '', memoryGib: '' },
};
