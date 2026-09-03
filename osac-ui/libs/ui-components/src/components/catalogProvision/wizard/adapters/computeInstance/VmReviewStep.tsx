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
  Title,
} from '@patternfly/react-core';
import { useFormikContext } from 'formik';

import { type SecurityGroup } from '@osac/types';
import { cel } from '@osac/ui-components/api/cel';
import { useInstanceType } from '@osac/ui-components/api/v1/instance-types';
import {
  useSecurityGroups,
  useSubnet,
  useVirtualNetwork,
} from '@osac/ui-components/api/v1/networking';
import { useProjects } from '@osac/ui-components/api/v1/project';
import { useStorageTiers } from '@osac/ui-components/api/v1/storage-tiers';
import { CatalogItem } from '@osac/ui-components/components/catalog/catalogItemDisplay';
import {
  fullProjectPathToQueryFilter,
  getProjectName,
} from '@osac/ui-components/components/Project/utils';
import { formatInstanceTypeReviewLabelFromType } from '@osac/ui-components/components/vm/utils';
import { getErrorMessage } from '@osac/ui-components/utils/error';

import { ComputeInstanceWizardValues } from './fields';
import { useTranslation } from '../../../../../hooks/useTranslation';
import {
  formatBootDiskSizeForReview,
  formatReviewScalar,
  resolveStorageTierDisplayName,
} from '../../catalogOverlay';

interface Props {
  catalogItem: CatalogItem | null;
}

export const VmReviewStep = ({ catalogItem }: Props) => {
  const { t } = useTranslation();
  const { values } = useFormikContext<ComputeInstanceWizardValues>();

  const {
    data: instanceType,
    isLoading: instanceLoading,
    error: instanceErr,
  } = useInstanceType(values.spec.instanceType);

  const {
    data: virtualNetwork,
    isLoading: virtNetLoading,
    error: virtNetErr,
  } = useVirtualNetwork(values.spec.networking.virtualNetwork);

  const {
    data: subnet,
    isLoading: subnetLoading,
    error: subnetError,
  } = useSubnet(values.spec.networking.subnet);

  const {
    data: securityGroups,
    isLoading: scLoading,
    error: scError,
  } = useSecurityGroups({
    filter: cel<SecurityGroup>((filter) =>
      filter.field('id').isIn(values.spec.networking.securityGroups),
    ),
  });

  const {
    data: projects,
    isLoading: projectsLoading,
    error: projectsError,
  } = useProjects({ filter: fullProjectPathToQueryFilter(values.metadata.project) });

  const { data: tiers, isLoading: tiersLoading, error: tiersError } = useStorageTiers();

  if (
    instanceLoading ||
    virtNetLoading ||
    subnetLoading ||
    scLoading ||
    projectsLoading ||
    tiersLoading
  ) {
    return (
      <Bullseye>
        <Spinner />
      </Bullseye>
    );
  }

  return (
    <Stack hasGutter>
      {!!instanceErr && (
        <StackItem>
          <Alert variant="warning" isInline title={t('Failed to fetch instance type')}>
            {getErrorMessage(instanceErr)}
          </Alert>
        </StackItem>
      )}
      {!!virtNetErr && (
        <StackItem>
          <Alert variant="warning" isInline title={t('Failed to fetch virtual network')}>
            {getErrorMessage(virtNetErr)}
          </Alert>
        </StackItem>
      )}
      {!!subnetError && (
        <StackItem>
          <Alert variant="warning" isInline title={t('Failed to fetch subnet')}>
            {getErrorMessage(subnetError)}
          </Alert>
        </StackItem>
      )}
      {!!scError && (
        <StackItem>
          <Alert variant="warning" isInline title={t('Failed to fetch security groups')}>
            {getErrorMessage(scError)}
          </Alert>
        </StackItem>
      )}

      {!!projectsError && (
        <StackItem>
          <Alert variant="warning" isInline title={t('Failed to fetch project')}>
            {getErrorMessage(projectsError)}
          </Alert>
        </StackItem>
      )}
      {!!tiersError && (
        <StackItem>
          <Alert variant="warning" isInline title={t('Failed to fetch storage tiers')}>
            {getErrorMessage(tiersError)}
          </Alert>
        </StackItem>
      )}
      <StackItem>
        <Title headingLevel="h3">{t('Configuration')}</Title>
      </StackItem>
      <StackItem>
        <DescriptionList isHorizontal isCompact aria-label={t('Configuration')}>
          <DescriptionListGroup>
            <DescriptionListTerm>{t('Catalog item')}</DescriptionListTerm>
            <DescriptionListDescription>
              {catalogItem?.title || catalogItem?.metadata?.name || '—'}
            </DescriptionListDescription>
          </DescriptionListGroup>

          <DescriptionListGroup>
            <DescriptionListTerm>{t('Project')}</DescriptionListTerm>
            <DescriptionListDescription>
              {projects?.length === 1 ? getProjectName(projects[0], t) : values.metadata.project}
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
              {formatReviewScalar(values.spec.sshPublicKey)}
            </DescriptionListDescription>
          </DescriptionListGroup>
          <DescriptionListGroup>
            <DescriptionListTerm>{t('VM image')}</DescriptionListTerm>
            <DescriptionListDescription>
              {formatReviewScalar(values.spec.image.sourceRef)}
            </DescriptionListDescription>
          </DescriptionListGroup>

          <DescriptionListGroup>
            <DescriptionListTerm>{t('Instance type')}</DescriptionListTerm>
            <DescriptionListDescription>
              {formatInstanceTypeReviewLabelFromType(
                instanceType,
                undefined,
                values.spec.instanceType,
              )}
            </DescriptionListDescription>
          </DescriptionListGroup>

          <DescriptionListGroup>
            <DescriptionListTerm>{t('User Data')}</DescriptionListTerm>
            <DescriptionListDescription>
              {formatReviewScalar(values.spec.userData)}
            </DescriptionListDescription>
          </DescriptionListGroup>

          <DescriptionListGroup>
            <DescriptionListTerm>{t('Virtual network')}</DescriptionListTerm>
            <DescriptionListDescription>
              {virtualNetwork?.metadata?.name || values.spec.networking.virtualNetwork}
            </DescriptionListDescription>
          </DescriptionListGroup>
          <DescriptionListGroup>
            <DescriptionListTerm>{t('Subnet')}</DescriptionListTerm>
            <DescriptionListDescription>
              {subnet?.metadata?.name || values.spec.networking.subnet}
            </DescriptionListDescription>
          </DescriptionListGroup>
          <DescriptionListGroup>
            <DescriptionListTerm>{t('Security groups')}</DescriptionListTerm>
            <DescriptionListDescription>
              {values.spec.networking.securityGroups
                .map((sc) => securityGroups?.find(({ id }) => id === sc)?.metadata?.name || sc)
                .join(', ')}
            </DescriptionListDescription>
          </DescriptionListGroup>
        </DescriptionList>
      </StackItem>
      <StackItem>
        <Title headingLevel="h3">{t('Storage')}</Title>
      </StackItem>
      <StackItem>
        <DescriptionList isHorizontal isCompact aria-label={t('Storage')}>
          <DescriptionListGroup>
            <DescriptionListTerm>{t('Boot disk')}</DescriptionListTerm>
            <DescriptionListDescription>
              {formatBootDiskSizeForReview(values.spec.bootDisk.sizeGib)},{' '}
              {resolveStorageTierDisplayName(values.spec.bootDisk.storageTier, tiers)}
            </DescriptionListDescription>
          </DescriptionListGroup>
          {values.spec.additionalDisks.map((disk, index) => (
            <DescriptionListGroup key={index}>
              <DescriptionListTerm>
                {t('Additional disk {{number}}', { number: index + 1 })}
              </DescriptionListTerm>
              <DescriptionListDescription>
                {formatBootDiskSizeForReview(disk.sizeGib)},{' '}
                {resolveStorageTierDisplayName(disk.storageTier, tiers)}
              </DescriptionListDescription>
            </DescriptionListGroup>
          ))}
        </DescriptionList>
      </StackItem>
    </Stack>
  );
};
