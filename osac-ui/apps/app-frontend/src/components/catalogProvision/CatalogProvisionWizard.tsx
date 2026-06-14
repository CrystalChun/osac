/**
 * flow: catalog-provision-wizard
 * steps: catalog → basics → configuration → review
 *
 * Generic catalog-driven provisioning wizard for compute instances (and future clusters).
 * Contract: docs/specs/ui-flows/catalog-provision-wizard.yaml
 */
import {
  Alert,
  Breadcrumb,
  BreadcrumbItem,
  Button,
  Flex,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
  Wizard,
  WizardFooterWrapper,
  WizardStep,
  useWizardContext,
} from '@patternfly/react-core';
import type {
  CatalogItemBase,
  CatalogProvisionKind,
  ComputeInstance,
} from '@osac/api-contracts/types';
import {
  type MouseEvent,
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useState,
} from 'react';
import { createPortal } from 'react-dom';
import { computeInstanceAdapter } from './wizard/adapters/computeInstanceAdapter';
import { clusterAdapter } from './wizard/adapters/clusterAdapter';
import type { CatalogProvisionAdapter } from './wizard/adapters/types';
import { hasWizardUnsavedProgress, mergeWizardDraft } from './wizard/constants';
import { STEP_LABELS, getWizardOrderedSteps } from './wizard/stepIds';
import { BasicsStep, CatalogStep, ConfigurationStep, ReviewStep } from './wizard/steps/WizardSteps';
import type { CatalogProvisionWizardHandle, CatalogProvisionWizardState } from './wizard/types';
import {
  seedFieldValuesFromCatalogItem,
  seedNetworkAttachmentRowsFromCatalogItem,
} from '@osac/api-contracts/catalogFieldDefinition';
import {
  canProceedWizardStep,
  liveWizardStepFieldErrors,
  validateWizardForFinalize,
} from './wizard/wizardBuild';
import { getPageContentPortalHost } from '../../pages/shell/pageContentPortalHost';

import './CatalogProvisionWizard.css';

export type { CatalogProvisionWizardHandle } from './wizard/types';

const ADAPTERS: Record<CatalogProvisionKind, CatalogProvisionAdapter<CatalogItemBase, unknown>> = {
  compute_instance: computeInstanceAdapter,
  cluster: clusterAdapter,
};

interface CatalogProvisionWizardHeaderProps {
  breadcrumbParentLabel: string;
  wizardTitle: string;
  wizardDescription: string;
  onRequestClose: () => void;
  pending: boolean;
}

const CatalogProvisionWizardHeader = ({
  breadcrumbParentLabel,
  wizardTitle,
  wizardDescription,
  onRequestClose,
  pending,
}: CatalogProvisionWizardHeaderProps) => (
  <div className="pf-v6-c-wizard__header catalog-provision-wizard__header">
    <Breadcrumb className="catalog-provision-wizard-breadcrumb">
      <BreadcrumbItem>
        <Button variant="link" isInline onClick={onRequestClose} isDisabled={pending}>
          {breadcrumbParentLabel}
        </Button>
      </BreadcrumbItem>
      <BreadcrumbItem isActive>{wizardTitle}</BreadcrumbItem>
    </Breadcrumb>
    <div className="pf-v6-c-wizard__title">
      <h2 className="pf-v6-c-wizard__title-text">{wizardTitle}</h2>
    </div>
    <div className="pf-v6-c-wizard__description">{wizardDescription}</div>
  </div>
);

interface Props {
  kind?: CatalogProvisionKind;
  /** Parent page label for breadcrumb navigation (e.g. Virtual machines, Catalog). */
  breadcrumbParentLabel: string;
  onProvision: (payload: Partial<ComputeInstance>) => void | Promise<void>;
}

interface WizardFooterProps {
  adapter: CatalogProvisionAdapter<CatalogItemBase, unknown>;
  draft: CatalogProvisionWizardState;
  catalogItem: CatalogItemBase | null;
  orderedSteps: readonly string[];
  activeStepId: string;
  canProceed: boolean;
  setProvisionError: (message: string | undefined) => void;
  pending: boolean;
  setPending: (pending: boolean) => void;
  onProvision: Props['onProvision'];
  close: () => void;
  requestClose: () => void;
}

const CatalogProvisionWizardFooter = ({
  adapter,
  draft,
  catalogItem,
  orderedSteps,
  activeStepId,
  canProceed,
  setProvisionError,
  pending,
  setPending,
  onProvision,
  close,
  requestClose,
}: WizardFooterProps) => {
  const { activeStep, goToStepByIndex } = useWizardContext();
  const stepIndex = activeStep?.index ?? 1;
  const isFirst = stepIndex <= 1;
  const isReview = activeStepId === 'review';

  const handleBack = useCallback(() => {
    if (isFirst || pending) {
      return;
    }
    setProvisionError(undefined);
    goToStepByIndex(stepIndex - 1);
  }, [goToStepByIndex, isFirst, pending, setProvisionError, stepIndex]);

  const handleNextOrCreate = useCallback(async () => {
    if (!canProceed || pending) {
      return;
    }

    if (isReview) {
      setPending(true);
      setProvisionError(undefined);
      const finalizeErrors = validateWizardForFinalize(
        draft,
        catalogItem,
        adapter.kind,
        orderedSteps,
      );
      if (Object.keys(finalizeErrors).length > 0) {
        const firstInvalidStep = orderedSteps.find(
          (stepId) =>
            stepId !== 'review' &&
            Object.keys(liveWizardStepFieldErrors(stepId, draft, catalogItem, adapter.kind))
              .length > 0,
        );
        const targetIndex = firstInvalidStep ? orderedSteps.indexOf(firstInvalidStep) + 1 : 1;
        goToStepByIndex(targetIndex);
        setPending(false);
        return;
      }

      const payload = catalogItem ? adapter.buildCreatePayload(draft, catalogItem) : {};
      try {
        await Promise.resolve(onProvision(payload));
        close();
      } catch {
        setProvisionError('Provisioning failed. Please try again.');
      } finally {
        setPending(false);
      }
      return;
    }

    setProvisionError(undefined);
    goToStepByIndex(stepIndex + 1);
  }, [
    adapter,
    canProceed,
    catalogItem,
    close,
    draft,
    goToStepByIndex,
    isReview,
    onProvision,
    orderedSteps,
    pending,
    setPending,
    setProvisionError,
    stepIndex,
  ]);

  return (
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
        isDisabled={!canProceed || pending}
        isAriaDisabled={!canProceed || pending}
        isLoading={pending}
      >
        {isReview ? adapter.createButtonLabel : 'Next'}
      </Button>
      <Button variant="link" onClick={requestClose} isDisabled={pending}>
        Cancel
      </Button>
    </Flex>
  );
};

export const CatalogProvisionWizard = forwardRef<CatalogProvisionWizardHandle, Props>(
  ({ kind = 'compute_instance', breadcrumbParentLabel, onProvision }, ref) => {
    const adapter = ADAPTERS[kind];
    const [isOpen, setIsOpen] = useState(false);
    const [activeIndex, setActiveIndex] = useState(0);
    const [draft, setDraft] = useState<CatalogProvisionWizardState>(() => mergeWizardDraft({}));
    const [provisionError, setProvisionError] = useState<string | undefined>();
    const [pending, setPending] = useState(false);
    const [showCancelConfirm, setShowCancelConfirm] = useState(false);
    const { data: catalogItems = [] } = adapter.useCatalogItems();

    const resetLocal = useCallback(() => {
      setActiveIndex(0);
      setDraft(mergeWizardDraft({}));
      setProvisionError(undefined);
      setShowCancelConfirm(false);
    }, []);

    const openWizard = useCallback(
      (preset?: Partial<CatalogProvisionWizardState>) => {
        resetLocal();
        if (preset) {
          setDraft(mergeWizardDraft(preset));
        }
        setIsOpen(true);
      },
      [resetLocal],
    );

    useImperativeHandle(ref, () => ({
      open() {
        openWizard();
      },
      openFromCatalogItem(catalogItemId) {
        openWizard({ catalogItemId });
      },
    }));

    const update = useCallback(
      <K extends keyof CatalogProvisionWizardState>(
        key: K,
        value: CatalogProvisionWizardState[K],
      ) => {
        setDraft((prev) => ({ ...prev, [key]: value }));
      },
      [],
    );

    const updateFieldValue = useCallback((path: string, value: string) => {
      setDraft((prev) => ({
        ...prev,
        fieldValues: { ...prev.fieldValues, [path]: value },
      }));
    }, []);

    const updateNetworkAttachmentRows = useCallback(
      (networkAttachmentRows: CatalogProvisionWizardState['networkAttachmentRows']) => {
        setDraft((prev) => ({ ...prev, networkAttachmentRows }));
      },
      [],
    );

    const close = useCallback(() => {
      setIsOpen(false);
      resetLocal();
    }, [resetLocal]);

    const requestClose = useCallback(() => {
      if (pending) {
        return;
      }
      if (hasWizardUnsavedProgress(draft)) {
        setShowCancelConfirm(true);
        return;
      }
      close();
    }, [close, draft, pending]);

    const selectedCatalogItem = useMemo(
      () =>
        draft.catalogItemId
          ? (catalogItems.find((item) => item.id === draft.catalogItemId) ?? null)
          : null,
      [catalogItems, draft.catalogItemId],
    );

    const orderedSteps = useMemo(
      () => getWizardOrderedSteps(selectedCatalogItem, adapter.kind),
      [adapter.kind, selectedCatalogItem],
    );
    const activeStepId = orderedSteps[activeIndex] ?? 'catalog';

    const stepFieldErrors = useMemo(
      () => liveWizardStepFieldErrors(activeStepId, draft, selectedCatalogItem, adapter.kind),
      [activeStepId, adapter.kind, draft, selectedCatalogItem],
    );

    const canProceed = useMemo(
      () =>
        canProceedWizardStep(activeStepId, draft, selectedCatalogItem, adapter.kind, orderedSteps),
      [activeStepId, adapter.kind, draft, orderedSteps, selectedCatalogItem],
    );

    const fieldErrors = useMemo(() => {
      if (provisionError) {
        return { ...stepFieldErrors, _provision: provisionError };
      }
      return stepFieldErrors;
    }, [provisionError, stepFieldErrors]);

    const handleStepChange = useCallback(
      (_event: MouseEvent<HTMLButtonElement>, currentStep: { index?: number }) => {
        if (currentStep.index != null) {
          setActiveIndex(currentStep.index - 1);
          setProvisionError(undefined);
        }
      },
      [],
    );

    const renderStepBody = (stepId: string) => {
      switch (stepId) {
        case 'catalog':
          return <CatalogStep adapter={adapter} state={draft} update={update} />;
        case 'basics':
          return (
            <BasicsStep
              adapter={adapter}
              catalogItem={selectedCatalogItem}
              state={draft}
              update={update}
              updateFieldValue={updateFieldValue}
              fieldErrors={fieldErrors}
            />
          );
        case 'configuration':
          return (
            <ConfigurationStep
              adapter={adapter}
              catalogItem={selectedCatalogItem}
              state={draft}
              updateFieldValue={updateFieldValue}
              onChangeNetworkAttachmentRows={updateNetworkAttachmentRows}
              fieldErrors={fieldErrors}
            />
          );
        case 'review':
          return <ReviewStep adapter={adapter} catalogItem={selectedCatalogItem} state={draft} />;
        default:
          return null;
      }
    };

    const renderValidationAlert = (stepId: string) =>
      provisionError && activeStepId === stepId ? (
        <Alert
          variant="danger"
          isInline
          title={`Could not ${adapter.createButtonLabel.toLowerCase()}`}
          className="osac-wizard__alert"
        >
          {provisionError}
        </Alert>
      ) : null;

    useEffect(() => {
      if (!isOpen || !selectedCatalogItem || draft.catalogItemId !== selectedCatalogItem.id) {
        return;
      }
      const seeded = seedFieldValuesFromCatalogItem(selectedCatalogItem.fieldDefinitions);
      const seededNetworkRows = seedNetworkAttachmentRowsFromCatalogItem(
        selectedCatalogItem.fieldDefinitions,
      );
      setDraft((prev) => {
        let changed = false;
        const fieldValues = { ...prev.fieldValues };
        for (const [path, value] of Object.entries(seeded)) {
          if (!fieldValues[path]?.trim()) {
            fieldValues[path] = value;
            changed = true;
          }
        }
        const networkAttachmentRows =
          prev.networkAttachmentRows.length > 0
            ? prev.networkAttachmentRows
            : seededNetworkRows.length > 0
              ? seededNetworkRows
              : prev.networkAttachmentRows;
        if (networkAttachmentRows !== prev.networkAttachmentRows) {
          changed = true;
        }
        return changed ? { ...prev, fieldValues, networkAttachmentRows } : prev;
      });
    }, [draft.catalogItemId, isOpen, selectedCatalogItem]);

    useEffect(() => {
      if (!isOpen) {
        return;
      }
      const portalHost = getPageContentPortalHost();
      const scrollTarget = portalHost ?? document.body;
      const previousOverflow = scrollTarget.style.overflow;
      scrollTarget.style.overflow = 'hidden';
      const onKeyDown = (event: KeyboardEvent) => {
        if (event.key === 'Escape' && !pending && !showCancelConfirm) {
          requestClose();
        }
      };
      document.addEventListener('keydown', onKeyDown);
      return () => {
        scrollTarget.style.overflow = previousOverflow;
        document.removeEventListener('keydown', onKeyDown);
      };
    }, [isOpen, pending, requestClose, showCancelConfirm]);

    useEffect(() => {
      if (activeIndex >= orderedSteps.length) {
        setActiveIndex(Math.max(0, orderedSteps.length - 1));
      }
    }, [activeIndex, orderedSteps.length]);

    if (!isOpen) {
      return null;
    }

    const portalHost = getPageContentPortalHost() ?? document.body;
    const overlayClassName = portalHost.id
      ? 'catalog-provision-wizard-overlay'
      : 'catalog-provision-wizard-overlay catalog-provision-wizard-overlay--viewport';

    return createPortal(
      <>
        {showCancelConfirm ? (
          <Modal
            variant="small"
            isOpen
            onClose={() => setShowCancelConfirm(false)}
            aria-labelledby="catalog-provision-wizard-cancel-title"
          >
            <ModalHeader
              title="Discard wizard progress?"
              titleIconVariant="warning"
              labelId="catalog-provision-wizard-cancel-title"
            />
            <ModalBody>
              Are you sure you want to cancel? Your selections and entered data will be lost.
            </ModalBody>
            <ModalFooter>
              <Button variant="link" onClick={() => setShowCancelConfirm(false)}>
                Keep editing
              </Button>
              <Button variant="primary" onClick={close}>
                Discard and close
              </Button>
            </ModalFooter>
          </Modal>
        ) : null}
        <div
          className={overlayClassName}
          role="dialog"
          aria-modal="true"
          aria-label={adapter.ariaLabel}
          data-ouia-component-id="catalog-provision-wizard-overlay"
        >
          <Wizard
            className="catalog-provision-wizard"
            navAriaLabel={`${adapter.wizardTitle} steps`}
            isVisitRequired
            height="100%"
            onStepChange={handleStepChange}
            header={
              <CatalogProvisionWizardHeader
                breadcrumbParentLabel={breadcrumbParentLabel}
                wizardTitle={adapter.wizardTitle}
                wizardDescription={adapter.wizardDescription}
                onRequestClose={requestClose}
                pending={pending}
              />
            }
            footer={
              <WizardFooterWrapper>
                <CatalogProvisionWizardFooter
                  adapter={adapter}
                  draft={draft}
                  catalogItem={selectedCatalogItem}
                  orderedSteps={orderedSteps}
                  activeStepId={activeStepId}
                  canProceed={canProceed}
                  setProvisionError={setProvisionError}
                  pending={pending}
                  setPending={setPending}
                  onProvision={onProvision}
                  close={close}
                  requestClose={requestClose}
                />
              </WizardFooterWrapper>
            }
          >
            {orderedSteps.map((stepId) => (
              <WizardStep key={stepId} id={stepId} name={STEP_LABELS[stepId] ?? stepId}>
                {renderValidationAlert(stepId)}
                {renderStepBody(stepId)}
              </WizardStep>
            ))}
          </Wizard>
        </div>
      </>,
      portalHost,
    );
  },
);

CatalogProvisionWizard.displayName = 'CatalogProvisionWizard';
