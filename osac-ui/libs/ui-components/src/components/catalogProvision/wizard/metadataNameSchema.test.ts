import { describe, expect, it } from 'vitest';
import { ValidationError } from 'yup';

import { buildMetadataNameSchema } from './metadataNameSchema';

const t = (key: string) => key;

const validateName = async (name: string) => {
  const schema = buildMetadataNameSchema(t);
  try {
    await schema.validate(name);
    return undefined;
  } catch (error) {
    if (error instanceof ValidationError) {
      return error.message;
    }
    throw error;
  }
};

describe('buildMetadataNameSchema', () => {
  it.each([
    ['my-cluster', undefined],
    ['web-vm-1', undefined],
    ['a', undefined],
    ['a23456789012345678901234567890123456789012345678901234567890123', undefined],
  ])('accepts valid DNS label %s', async (name, expected) => {
    await expect(validateName(name)).resolves.toBe(expected);
  });

  it.each([
    ['', 'catalogProvision.validation.nameRequired'],
    ['   ', 'catalogProvision.validation.nameRequired'],
    [
      'a234567890123456789012345678901234567890123456789012345678901234',
      'catalogProvision.validation.nameDnsLabelMaxLength',
    ],
    ['MyVM', 'catalogProvision.validation.nameDnsLabelCharset'],
    ['my_vm', 'catalogProvision.validation.nameDnsLabelCharset'],
    ['-myvm', 'catalogProvision.validation.nameDnsLabelLeadingHyphen'],
    ['myvm-', 'catalogProvision.validation.nameDnsLabelTrailingHyphen'],
  ])('rejects invalid name %s', async (name, expectedMessage) => {
    await expect(validateName(name)).resolves.toBe(expectedMessage);
  });
});
