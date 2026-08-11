import { describe, expect, it } from 'vitest';

import { mapCreateErrorToField } from './fieldErrorMapping';

describe('mapCreateErrorToField', () => {
  it('maps a spec.cores field violation to its Formik field path', () => {
    expect(mapCreateErrorToField("field 'spec.cores' must be greater than zero")).toEqual({
      field: 'spec.cores',
      message: "field 'spec.cores' must be greater than zero",
    });
  });

  it('translates a snake_case spec.memory_gib path to camelCase', () => {
    expect(mapCreateErrorToField("field 'spec.memory_gib' must be greater than zero")).toEqual({
      field: 'spec.memoryGib',
      message: "field 'spec.memory_gib' must be greater than zero",
    });
  });

  it('returns undefined for a generic create failure message', () => {
    expect(mapCreateErrorToField('Instance type name already exists')).toBeUndefined();
  });

  it('returns undefined for an empty message', () => {
    expect(mapCreateErrorToField('')).toBeUndefined();
  });
});
