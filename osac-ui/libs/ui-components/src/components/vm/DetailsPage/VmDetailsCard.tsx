import {
  Card,
  CardBody,
  CardTitle,
  DescriptionList,
  DescriptionListDescription,
  DescriptionListGroup,
  DescriptionListTerm,
  Skeleton,
} from '@patternfly/react-core';

import type { ComputeInstance } from '@osac/types';

import { useVmDetailsDisplay } from './useVmDetailsDisplay';
import { useTranslation } from '../../../hooks/useTranslation';
import { displayValue } from '../../../utils/detailFormatters';
import { formatBootDiskSizeForReview } from '../../catalogProvision/wizard/catalogOverlay';
import { formatStorageTierForDisplay } from '../../catalogProvision/wizard/storageRows';
import { Timestamp } from '../../Primitives/Timestamp';
import { SubtleContent } from '../../SubtleContent/SubtleContent';
import { formatInstanceTypeReviewLabelFromType } from '../utils';

interface Props {
  vm: ComputeInstance;
}

const VmDetailsCard = ({ vm }: Props) => {
  const { t } = useTranslation();
  const { hasCatalogItem, catalogItemName, instanceType, instanceTypeId, isInstanceTypeLoading } =
    useVmDetailsDisplay(vm);

  return (
    <Card isFullHeight>
      <CardTitle>{t('Details')}</CardTitle>
      <CardBody>
        {!hasCatalogItem ? (
          <SubtleContent component="p">
            {t('Catalog configuration is unavailable for this virtual machine.')}
          </SubtleContent>
        ) : null}
        <DescriptionList isCompact>
          {hasCatalogItem ? (
            <DescriptionListGroup>
              <DescriptionListTerm>{t('Catalog item')}</DescriptionListTerm>
              <DescriptionListDescription>
                {displayValue(catalogItemName)}
              </DescriptionListDescription>
            </DescriptionListGroup>
          ) : null}
          <DescriptionListGroup>
            <DescriptionListTerm>{t('catalogProvision.vm.fields.name')}</DescriptionListTerm>
            <DescriptionListDescription>
              {displayValue(vm.metadata?.name)}
            </DescriptionListDescription>
          </DescriptionListGroup>
          {hasCatalogItem ? (
            <>
              <DescriptionListGroup>
                <DescriptionListTerm>{t('SSH public key')}</DescriptionListTerm>
                <DescriptionListDescription>
                  {displayValue(vm.spec?.sshPublicKey)}
                </DescriptionListDescription>
              </DescriptionListGroup>
              <DescriptionListGroup>
                <DescriptionListTerm>
                  {t('catalogProvision.vm.fields.instanceType')}
                </DescriptionListTerm>
                <DescriptionListDescription>
                  {isInstanceTypeLoading && instanceTypeId ? (
                    <Skeleton width="150px" />
                  ) : (
                    formatInstanceTypeReviewLabelFromType(
                      instanceType,
                      t('catalogProvision.instanceTypes.deprecatedSuffix'),
                      instanceTypeId,
                    )
                  )}
                </DescriptionListDescription>
              </DescriptionListGroup>
              <DescriptionListGroup>
                <DescriptionListTerm>{t('Boot disk')}</DescriptionListTerm>
                <DescriptionListDescription>
                  {formatBootDiskSizeForReview(vm.spec?.bootDisk?.sizeGib)},{' '}
                  {formatStorageTierForDisplay(vm.spec?.bootDisk?.storageTier)}
                </DescriptionListDescription>
              </DescriptionListGroup>
              {(vm.spec?.additionalDisks ?? []).map((disk, index) => (
                <DescriptionListGroup key={`additional-disk-${index}`}>
                  <DescriptionListTerm>
                    {t('Additional disk {{number}}', { number: index + 1 })}
                  </DescriptionListTerm>
                  <DescriptionListDescription>
                    {formatBootDiskSizeForReview(disk.sizeGib)},{' '}
                    {formatStorageTierForDisplay(disk.storageTier)}
                  </DescriptionListDescription>
                </DescriptionListGroup>
              ))}
            </>
          ) : null}
          <DescriptionListGroup>
            <DescriptionListTerm>{t('Created')}</DescriptionListTerm>
            <DescriptionListDescription>
              <Timestamp value={vm.metadata?.creationTimestamp} />
            </DescriptionListDescription>
          </DescriptionListGroup>
          <DescriptionListGroup>
            <DescriptionListTerm>{t('Creator')}</DescriptionListTerm>
            <DescriptionListDescription>
              {displayValue(vm.metadata?.creator)}
            </DescriptionListDescription>
          </DescriptionListGroup>
        </DescriptionList>
      </CardBody>
    </Card>
  );
};

export default VmDetailsCard;
