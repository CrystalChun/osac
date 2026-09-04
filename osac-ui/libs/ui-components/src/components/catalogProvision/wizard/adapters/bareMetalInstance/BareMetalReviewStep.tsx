import {
  Alert,
  Bullseye,
  DescriptionList,
  DescriptionListDescription,
  DescriptionListGroup,
  DescriptionListTerm,
  Spinner,
  Stack,
  StackItem,
} from '@patternfly/react-core';
import { useFormikContext } from 'formik';

import { BareMetalInstanceType, BareMetalInstanceTypes } from '@osac/types';
import { cel } from '@osac/ui-components/api/cel';
import { useListResource } from '@osac/ui-components/api/use-resource';
import { useProjects } from '@osac/ui-components/api/v1/project';
import { CatalogItem } from '@osac/ui-components/components/catalog/catalogItemDisplay';
import {
  fullProjectPathToQueryFilter,
  getProjectName,
} from '@osac/ui-components/components/Project/utils';
import { getErrorMessage } from '@osac/ui-components/utils/error';

import { BareMetalInstanceWizardValues } from './fields';
import { useTranslation } from '../../../../../hooks/useTranslation';
import { formatReviewScalar } from '../../catalogOverlay';

interface Props {
  catalogItem: CatalogItem | null;
}

export const BareMetalReviewStep = ({ catalogItem }: Props) => {
  const { t } = useTranslation();
  const { values } = useFormikContext<BareMetalInstanceWizardValues>();

  const { data, isLoading, error } = useProjects({
    filter: fullProjectPathToQueryFilter(values.metadata.project),
  });

  const {
    data: instanceTypes,
    isLoading: instanceTypesLoading,
    error: instanceTypeError,
  } = useListResource(BareMetalInstanceTypes, {
    filter: cel<BareMetalInstanceType>((filter) =>
      filter.field('metadata.name').equals(values.spec.instanceType.name),
    ),
  });

  if (isLoading || instanceTypesLoading) {
    return (
      <Bullseye>
        <Spinner />
      </Bullseye>
    );
  }

  const instanceType = instanceTypes?.items.length ? instanceTypes.items[0] : undefined;

  return (
    <Stack hasGutter>
      {!!error && (
        <StackItem>
          <Alert variant="warning" isInline title={t('Failed to fetch project')}>
            {getErrorMessage(error)}
          </Alert>
        </StackItem>
      )}
      {!!instanceTypeError && (
        <StackItem>
          <Alert variant="warning" isInline title={t('Failed to fetch instance type')}>
            {getErrorMessage(instanceTypeError)}
          </Alert>
        </StackItem>
      )}
      <StackItem>
        <DescriptionList
          isHorizontal
          isCompact
          aria-label={t('catalogProvision.steps.review.title')}
        >
          <DescriptionListGroup>
            <DescriptionListTerm>{t('Catalog item')}</DescriptionListTerm>
            <DescriptionListDescription>
              {catalogItem?.title || catalogItem?.metadata?.name || '—'}
            </DescriptionListDescription>
          </DescriptionListGroup>

          <DescriptionListGroup>
            <DescriptionListTerm>{t('Project')}</DescriptionListTerm>
            <DescriptionListDescription>
              {data?.length ? getProjectName(data[0], t) : '-'}
            </DescriptionListDescription>
          </DescriptionListGroup>
          <DescriptionListGroup>
            <DescriptionListTerm>{t('Name')}</DescriptionListTerm>
            <DescriptionListDescription>
              {formatReviewScalar(values.metadata.name)}
            </DescriptionListDescription>
          </DescriptionListGroup>
          <DescriptionListGroup>
            <DescriptionListTerm>{t('SSH public key')}</DescriptionListTerm>
            <DescriptionListDescription>
              {formatReviewScalar(values.spec.sshKey)}
            </DescriptionListDescription>
          </DescriptionListGroup>
          <DescriptionListGroup>
            <DescriptionListTerm>{t('Instance type')}</DescriptionListTerm>
            <DescriptionListDescription>
              {instanceType
                ? `${instanceType.metadata?.name}${instanceType.spec?.description ? `(${instanceType.spec?.description})` : ''}`
                : values.spec.instanceType.name || '-'}
            </DescriptionListDescription>
          </DescriptionListGroup>
          <DescriptionListGroup>
            <DescriptionListTerm>{t('User data')}</DescriptionListTerm>
            <DescriptionListDescription>
              {formatReviewScalar(values.spec.userData, true)}
            </DescriptionListDescription>
          </DescriptionListGroup>
        </DescriptionList>
      </StackItem>
    </Stack>
  );
};
