import { describe, expect, it } from 'vitest';

import { getInstanceTypeCreateSchema } from './validation';
import { tIdentity as t } from '../../../test-utils/i18n';

const validValues = {
  metadata: { name: 'gp-small' },
  spec: { description: '', cores: '4', memoryGib: '16' },
};

describe('getInstanceTypeCreateSchema', () => {
  const schema = getInstanceTypeCreateSchema(t);

  it('accepts valid values', async () => {
    await expect(schema.isValid(validValues)).resolves.toBe(true);
  });

  it('accepts a non-empty description', async () => {
    await expect(
      schema.isValid({
        ...validValues,
        spec: { ...validValues.spec, description: 'General purpose' },
      }),
    ).resolves.toBe(true);
  });

  it('rejects a blank name', async () => {
    await expect(schema.isValid({ ...validValues, metadata: { name: '' } })).resolves.toBe(false);
  });

  it.each([
    ['blank', ''],
    ['decimal', '1.5'],
    ['zero', '0'],
    ['negative', '-1'],
    ['non-numeric', 'abc'],
  ])('rejects %s cores', async (_label, cores) => {
    await expect(
      schema.isValid({ ...validValues, spec: { ...validValues.spec, cores } }),
    ).resolves.toBe(false);
  });

  it.each([
    ['blank', ''],
    ['decimal', '1.5'],
    ['zero', '0'],
    ['negative', '-1'],
    ['non-numeric', 'abc'],
  ])('rejects %s memoryGib', async (_label, memoryGib) => {
    await expect(
      schema.isValid({ ...validValues, spec: { ...validValues.spec, memoryGib } }),
    ).resolves.toBe(false);
  });

  it('accepts positive integer cores and memoryGib at the boundary of 1', async () => {
    await expect(
      schema.isValid({ ...validValues, spec: { ...validValues.spec, cores: '1', memoryGib: '1' } }),
    ).resolves.toBe(true);
  });

  it('accepts cores and memoryGib at the int32 max boundary', async () => {
    await expect(
      schema.isValid({
        ...validValues,
        spec: { ...validValues.spec, cores: '2147483647', memoryGib: '2147483647' },
      }),
    ).resolves.toBe(true);
  });

  it('rejects cores and memoryGib exceeding the int32 max', async () => {
    await expect(
      schema.isValid({
        ...validValues,
        spec: { ...validValues.spec, cores: '2147483648', memoryGib: '2147483648' },
      }),
    ).resolves.toBe(false);
  });
});
