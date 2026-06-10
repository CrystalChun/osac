/**
 * flow: create-virtual-machine-wizard
 * steps: cvm_modal_open, cvm_wizard_template, cvm_wizard_customization, cvm_wizard_review_create
 *
 * WIZARD_TEMPLATE_ONLY (2026): only **create from template** is active.
 * Step orchestration is client-side; finalize builds ComputeInstance and POSTs via onProvision.
 * Per-step contract: docs/specs/ui-flows/create-virtual-machine-wizard.yaml (step_worksheets).
 */
import {
  Alert,
  Button,
  Flex,
  Modal,
  Wizard,
  WizardFooterWrapper,
  WizardHeader,
  WizardStep,
} from '@patternfly/react-core';
import type { ComputeInstance } from '@osac/api-contracts/types';
import { forwardRef, useCallback, useImperativeHandle, useMemo, useState } from 'react';
import { useComputeInstanceTemplates } from '../../api/hooks';
import { INITIAL_STATE, mergeWizardDraft } from './createVmWizard/constants';
import { getWizardOrderedSteps } from './createVmWizard/stepIds';
import { CustomizationStep, ReviewStep, TemplateStep } from './createVmWizard/steps/WizardSteps';
import type { CreateVmWizardHandle, DeploymentMode, WizardState } from './createVmWizard/types';
import './CreateVmWizard.css';
import {
  buildComputeInstanceFromWizardDraft,
  validateWizardForFinalize,
  validateWizardStep,
} from './createVmWizard/wizardBuild';
export type { CreateVmWizardHandle, DeploymentMode } from './createVmWizard/types';

const STEP_LABELS: Record<string, string> = {
  template: 'Templates',
  customization: 'Customization',
  review: 'Review',
};

interface Props {
  existingVms: ComputeInstance[];
  onProvision: (
    vm: Partial<ComputeInstance>,
    meta: { mode: DeploymentMode },
  ) => void | Promise<void>;
  defaultMode?: DeploymentMode;
}

const canProceedLocal = (stepId: string, state: WizardState): boolean => {
  return Object.keys(validateWizardStep(stepId, state)).length === 0;
};

export const CreateVmWizard = forwardRef<CreateVmWizardHandle, Props>(
  ({ existingVms, onProvision, defaultMode = 'template' }, ref) => {
    const [isOpen, setIsOpen] = useState(false);
    const [activeIndex, setActiveIndex] = useState(0);
    const [draft, setDraft] = useState<WizardState>(() =>
      mergeWizardDraft({ ...INITIAL_STATE, mode: defaultMode }),
    );
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
    const [pending, setPending] = useState(false);
    const { data: templates = [] } = useComputeInstanceTemplates();

    const resetLocal = useCallback(() => {
      setActiveIndex(0);
      setDraft(mergeWizardDraft({ ...INITIAL_STATE, mode: defaultMode }));
      setFieldErrors({});
    }, [defaultMode]);

    const openWizard = useCallback(
      (preset?: Partial<WizardState>) => {
        resetLocal();
        if (preset) {
          setDraft(mergeWizardDraft({ ...INITIAL_STATE, mode: defaultMode, ...preset }));
        }
        setIsOpen(true);
      },
      [defaultMode, resetLocal],
    );

    useImperativeHandle(ref, () => ({
      open() {
        openWizard();
      },
      openFromTemplate(templateId) {
        openWizard({ selectedTemplateId: templateId });
      },
      openFromClone(_sourceVmId) {
        void _sourceVmId;
      },
    }));

    const update = useCallback(<K extends keyof WizardState>(key: K, value: WizardState[K]) => {
      setDraft((prev) => ({ ...prev, [key]: value }));
    }, []);

    const close = useCallback(() => {
      setIsOpen(false);
      resetLocal();
    }, [resetLocal]);

    const orderedSteps = useMemo(() => getWizardOrderedSteps(draft.mode, true), [draft.mode]);
    const activeStepId = orderedSteps[activeIndex] ?? 'template';
    const isFirst = activeIndex <= 0;
    const isReview = activeStepId === 'review';
    const canNext = canProceedLocal(activeStepId, draft);

    const handleBack = useCallback(() => {
      if (isFirst) {
        return;
      }
      setFieldErrors({});
      setActiveIndex((i) => Math.max(0, i - 1));
    }, [isFirst]);

    const handleNextOrCreate = useCallback(async () => {
      setFieldErrors({});
      const stepErrors = validateWizardStep(activeStepId, draft);
      if (Object.keys(stepErrors).length > 0) {
        setFieldErrors(stepErrors);
        return;
      }

      if (isReview) {
        setPending(true);
        const finalizeErrors = validateWizardForFinalize(draft);
        if (Object.keys(finalizeErrors).length > 0) {
          setFieldErrors(finalizeErrors);
          setPending(false);
          return;
        }
        const template = draft.selectedTemplateId
          ? (templates.find((t) => t.id === draft.selectedTemplateId) ?? null)
          : null;
        const vm = buildComputeInstanceFromWizardDraft(draft, template);
        try {
          await Promise.resolve(onProvision(vm, { mode: draft.mode }));
          setIsOpen(false);
          resetLocal();
        } catch {
          setFieldErrors({ _provision: 'Provisioning failed. Please try again.' });
        } finally {
          setPending(false);
        }
        return;
      }

      setActiveIndex((i) => Math.min(orderedSteps.length - 1, i + 1));
    }, [activeStepId, draft, isReview, onProvision, orderedSteps.length, resetLocal, templates]);

    const renderStepBody = (stepId: string) => {
      switch (stepId) {
        case 'template':
          return <TemplateStep state={draft} update={update} />;
        case 'customization':
          return <CustomizationStep state={draft} update={update} />;
        case 'review':
          return <ReviewStep state={draft} update={update} vms={existingVms} />;
        default:
          return null;
      }
    };

    const hasFieldErrors = Object.keys(fieldErrors).length > 0;

    const renderValidationAlert = (stepId: string) =>
      hasFieldErrors && activeStepId === stepId ? (
        <Alert variant="danger" isInline title="Could not continue" className="osac-wizard__alert">
          {Object.entries(fieldErrors).map(([k, v]) => (
            <div key={k}>
              <strong>{k}</strong>: {v}
            </div>
          ))}
        </Alert>
      ) : null;

    return (
      <Modal
        isOpen={isOpen}
        onClose={undefined}
        onEscapePress={() => {
          close();
        }}
        variant="large"
        width="min(980px, 86vw)"
        maxWidth="88vw"
        aria-label="Create virtual machine wizard"
        ouiaId="create-vm-wizard-modal"
      >
        <Wizard
          key={`wizard-${activeIndex}`}
          className="create-vm-wizard"
          navAriaLabel="Create virtual machine steps"
          startIndex={activeIndex + 1}
          height="min(680px, calc(100vh - 120px))"
          header={
            <WizardHeader
              title="Create virtual machine from template"
              description="Select a template, customize, and provision."
              onClose={close}
              closeButtonAriaLabel="Close wizard"
            />
          }
          footer={
            <WizardFooterWrapper>
              <Flex
                className="osac-wizard__footer"
                justifyContent={{ default: 'justifyContentFlexStart' }}
                alignItems={{ default: 'alignItemsCenter' }}
                flexWrap={{ default: 'wrap' }}
                gap={{ default: 'gapMd' }}
              >
                <Button
                  variant="secondary"
                  onClick={handleBack}
                  isDisabled={isFirst || pending}
                  isAriaDisabled={isFirst || pending}
                >
                  Back
                </Button>
                <Button
                  variant="primary"
                  onClick={handleNextOrCreate}
                  isDisabled={!canNext || pending}
                  isAriaDisabled={!canNext || pending}
                  isLoading={pending}
                >
                  {isReview ? 'Create virtual machine' : 'Next'}
                </Button>
                <Button variant="link" onClick={close} isDisabled={pending}>
                  Cancel
                </Button>
              </Flex>
            </WizardFooterWrapper>
          }
          onClose={close}
        >
          {orderedSteps.map((stepId) => (
            <WizardStep key={stepId} id={stepId} name={STEP_LABELS[stepId] ?? stepId}>
              {renderValidationAlert(stepId)}
              {renderStepBody(stepId)}
            </WizardStep>
          ))}
        </Wizard>
      </Modal>
    );
  },
);

CreateVmWizard.displayName = 'CreateVmWizard';
