import { describe, expect, it } from 'vitest';
import { INITIAL_STATE } from './constants';
import {
  buildComputeInstanceFromWizardDraft,
  validateWizardForFinalize,
  validateWizardStep,
} from './wizardBuild';

describe('validateWizardStep', () => {
  it('requires a template on the template step', () => {
    expect(validateWizardStep('template', INITIAL_STATE)).toEqual({
      selectedTemplateId: 'Select a template',
    });
  });

  it('passes template step when a template is selected', () => {
    expect(
      validateWizardStep('template', { ...INITIAL_STATE, selectedTemplateId: 'tpl-1' }),
    ).toEqual({});
  });
});

describe('validateWizardForFinalize', () => {
  it('requires customization fields before create', () => {
    const errors = validateWizardForFinalize({
      ...INITIAL_STATE,
      selectedTemplateId: 'tpl-1',
    });
    expect(errors.templateVmName).toBe('Virtual machine name is required');
  });
});

describe('buildComputeInstanceFromWizardDraft', () => {
  it('maps wizard draft to compute instance spec', () => {
    const draft = {
      ...INITIAL_STATE,
      selectedTemplateId: 'tpl-rhel-9',
      templateVmName: 'web-01',
      templateCores: '4',
      templateMemoryGib: '8',
      templateBootDiskSizeGib: '64',
      startAfterCreate: true,
    };
    const vm = buildComputeInstanceFromWizardDraft(draft, {
      id: 'tpl-rhel-9',
      title: 'RHEL 9',
      metadata: { name: 'rhel-9' },
      defaultCores: 2,
      defaultMemoryGib: 4,
    });
    expect(vm.metadata?.name).toBe('web-01');
    expect(vm.spec?.template).toBe('tpl-rhel-9');
    expect(vm.spec?.cores).toBe(4);
    expect(vm.spec?.memoryGib).toBe(8);
    expect(vm.spec?.bootDisk).toEqual({ sizeGib: 64 });
    expect(vm.spec?.runStrategy).toBe('Always');
  });
});
