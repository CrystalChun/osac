import type { ComponentType } from 'react';
import type { FormikHelpers } from 'formik';
import type { AnyObjectSchema } from 'yup';

import type { InstanceType, SecurityGroup, Subnet, VirtualNetwork } from '@osac/types';

import type { CatalogProvisionKind } from '../../catalogFieldDefinition';
import type { CatalogProvisionCatalogItem } from '../../catalogProvisionItem';
import type { ReviewSection } from '../catalogOverlay';
import type { WizardStepId } from '../stepIds';

export interface CatalogItemsQueryResult<TItem extends CatalogProvisionCatalogItem> {
  data: TItem[];
  isPending: boolean;
  isError: boolean;
  refetch: () => void;
}

export interface GeneralFieldDescriptor {
  name: string;
  labelKey: string;
  /** Catalog `display_name` override; falls back to `t(labelKey)`. */
  label?: string;
  multiline?: boolean;
  isRequired?: boolean;
  isPassword?: boolean;
  isDisabled?: boolean;
}

export interface ReviewContext {
  securityGroups?: SecurityGroup[];
  instanceTypes?: InstanceType[];
  virtualNetworks?: VirtualNetwork[];
  subnets?: Subnet[];
}

export interface CatalogProvisionAdapter<
  TItem extends CatalogProvisionCatalogItem,
  TValues,
  TPayload,
> {
  kind: CatalogProvisionKind;
  useCatalogItems: () => CatalogItemsQueryResult<TItem>;
  getInitialValues: (catalogItem: TItem | null) => TValues;
  buildCreatePayload: (values: TValues, catalogItem: TItem) => TPayload;
  ConfigurationStep: ComponentType<{ catalogItem: TItem | null }>;
  NetworkingStep: ComponentType<{ catalogItem: TItem | null }>;
  resolveGeneralFields: (catalogItem: TItem | null) => GeneralFieldDescriptor[];
  getWizardSchema: (catalogItem: TItem | null) => AnyObjectSchema | undefined;
  getStepFieldPaths: (stepId: WizardStepId) => string[];
  getReviewSections: (values: TValues, catalogItem: TItem, context?: ReviewContext) => ReviewSection[];
  onCatalogItemSelected?: (
    item: TItem,
    helpers: FormikHelpers<TValues>,
  ) => void | Promise<void>;
  wizardTitleKey: string;
  wizardDescriptionKey: string;
  breadcrumbCreateLabelKey: string;
  ariaLabelKey: string;
}
