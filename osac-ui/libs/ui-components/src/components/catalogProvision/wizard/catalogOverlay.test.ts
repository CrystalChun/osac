import { describe, expect, it } from 'vitest';

import type { CatalogFieldDefinition } from '../catalogFieldDefinition';

import { findCatalogFieldDefinition, formatBootDiskSizeForReview, getCatalogFieldOverlay, hasCatalogFieldDefinition } from './catalogOverlay';

const definitions: CatalogFieldDefinition[] = [
  {
    path: 'boot_disk.size_gib',
    displayName: 'Boot disk',
    editable: true,
    default: 40,
  },
  {
    path: 'image.source_ref',
    displayName: 'Image reference',
    editable: true,
    default: 'quay.io/containerdisks/fedora:latest',
  },
];

describe('findCatalogFieldDefinition', () => {
  it('matches spec-relative API paths when the wizard queries with a spec. prefix', () => {
    expect(findCatalogFieldDefinition('spec.boot_disk.size_gib', definitions)?.path).toBe(
      'boot_disk.size_gib',
    );
    expect(findCatalogFieldDefinition('spec.image.source_ref', definitions)?.path).toBe(
      'image.source_ref',
    );
  });

  it('matches when query and definition use the same path form', () => {
    expect(findCatalogFieldDefinition('boot_disk.size_gib', definitions)?.default).toBe(40);
  });
});

describe('hasCatalogFieldDefinition', () => {
  it('returns true when a matching field definition exists', () => {
    expect(hasCatalogFieldDefinition('spec.user_data', definitions)).toBe(false);
    expect(hasCatalogFieldDefinition('spec.boot_disk.size_gib', definitions)).toBe(true);
  });
});

describe('getCatalogFieldOverlay', () => {
  it('returns catalog defaults for spec-prefixed wizard paths', () => {
    const overlay = getCatalogFieldOverlay(
      'spec.boot_disk.size_gib',
      definitions,
      'Boot disk',
    );

    expect(overlay.defaultValue).toBe(40);
    expect(overlay.label).toBe('Boot disk');
  });
});

describe('formatBootDiskSizeForReview', () => {
  it('appends GB to numeric boot disk values', () => {
    expect(formatBootDiskSizeForReview(40)).toBe('40 GB');
    expect(formatBootDiskSizeForReview('64')).toBe('64 GB');
  });

  it('returns em dash for empty values', () => {
    expect(formatBootDiskSizeForReview(undefined)).toBe('—');
    expect(formatBootDiskSizeForReview('')).toBe('—');
  });
});
