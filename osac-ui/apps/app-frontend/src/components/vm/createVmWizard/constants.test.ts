import { describe, expect, it } from 'vitest';
import {
  parseTemplateAdditionalDisksGibInput,
  parseTemplateCoresInput,
  parseTemplateMemoryGibInput,
  parseTemplateSecurityGroupsInput,
} from './constants';

describe('template wizard parsers', () => {
  it('parseTemplateCoresInput accepts bounded integers', () => {
    expect(parseTemplateCoresInput('4')).toBe(4);
    expect(parseTemplateCoresInput('abc')).toBeNull();
    expect(parseTemplateCoresInput('0')).toBeNull();
    expect(parseTemplateCoresInput('999')).toBeNull();
  });

  it('parseTemplateMemoryGibInput accepts bounded integers', () => {
    expect(parseTemplateMemoryGibInput('16')).toBe(16);
    expect(parseTemplateMemoryGibInput('0')).toBeNull();
  });

  it('parseTemplateAdditionalDisksGibInput parses list or empty', () => {
    expect(parseTemplateAdditionalDisksGibInput('')).toEqual([]);
    expect(parseTemplateAdditionalDisksGibInput('50, 100')).toEqual([50, 100]);
    expect(parseTemplateAdditionalDisksGibInput('bad')).toBeNull();
  });

  it('parseTemplateSecurityGroupsInput splits commas', () => {
    expect(parseTemplateSecurityGroupsInput('')).toEqual([]);
    expect(parseTemplateSecurityGroupsInput('a, b')).toEqual(['a', 'b']);
  });
});
