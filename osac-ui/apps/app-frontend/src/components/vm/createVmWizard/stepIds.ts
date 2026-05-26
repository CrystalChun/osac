import type { DeploymentMode } from './types'

/**
 * ---------------------------------------------------------------------------
 * WIZARD_TEMPLATE_ONLY (2026): fulfillment only supports **create from template**.
 * RESTORE multi-mode routing when new + clone are implemented upstream — see git
 * history for `getStepIds` / `getWizardOrderedSteps` using `mode` + `skipDeployment`.
 * ---------------------------------------------------------------------------
 */
export function getStepIds(_mode: DeploymentMode): string[] {
  return ['template', 'customization', 'review']
}

/*
RESTORE when fulfillment supports new + clone:
export function getStepIds(mode: DeploymentMode): string[] {
  if (mode === 'new')
    return ['deployment', 'guest-os', 'boot-source', 'compute', 'customization', 'review']
  if (mode === 'template') return ['deployment', 'template', 'customization', 'review']
  return ['deployment', 'clone-source', 'review']
}
*/

/** Aligns with BFF orderedStepIds when catalog/clone presets skip the deployment step. */
export function getWizardOrderedSteps(_mode: DeploymentMode, _skipDeployment: boolean): string[] {
  return ['template', 'customization', 'review']
}

/*
RESTORE:
export function getWizardOrderedSteps(mode: DeploymentMode, skipDeployment: boolean): string[] {
  if (skipDeployment && mode === 'template') return ['template', 'customization', 'review']
  if (skipDeployment && mode === 'clone') return ['clone-source', 'review']
  return getStepIds(mode)
}
*/
