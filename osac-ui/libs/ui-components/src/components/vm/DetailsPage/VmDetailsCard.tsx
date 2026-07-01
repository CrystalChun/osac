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
import VmDetailsCatalogValue from './VmDetailsCatalogValue';
import { formatInstanceTypeReviewLabelFromType } from '../../../api/v1/instance-types';
import { useTranslation } from '../../../hooks/useTranslation';
import { displayValue } from '../../../utils/detailFormatters';
import { formatBootDiskSizeForReview } from '../../catalogProvision/wizard/catalogOverlay';
import { Timestamp } from '../../Primitives/Timestamp';
import { SubtleContent } from '../../SubtleContent/SubtleContent';

interface Props {
  vm: ComputeInstance;
}

const VmDetailsCard = ({ vm }: Props) => {
  const { t } = useTranslation();
  const {
    catalogItemId,
    hasCatalogItem,
    isCatalogItemLoading,
    instanceType,
    instanceTypeId,
    isInstanceTypeLoading,
    fieldLabels,
  } = useVmDetailsDisplay(vm);

  return (
    <Card isFullHeight>
      <CardTitle>{t('vm.details.card.details')}</CardTitle>
      <CardBody>
        {!hasCatalogItem ? (
          <SubtleContent component="p">
            {t('vm.details.configuration.catalogUnavailable')}
          </SubtleContent>
        ) : null}
        <DescriptionList isCompact>
          {hasCatalogItem ? (
            <DescriptionListGroup>
              <DescriptionListTerm>{t('vm.details.fields.catalogItem')}</DescriptionListTerm>
              <DescriptionListDescription>
                {isCatalogItemLoading ? (
                  <Skeleton width="150px" />
                ) : (
                  <VmDetailsCatalogValue catalogItemId={catalogItemId} />
                )}
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
                <DescriptionListTerm>{fieldLabels.sshKey}</DescriptionListTerm>
                <DescriptionListDescription>
                  {displayValue(vm.spec?.sshKey)}
                </DescriptionListDescription>
              </DescriptionListGroup>
              <DescriptionListGroup>
                <DescriptionListTerm>{fieldLabels.image}</DescriptionListTerm>
                <DescriptionListDescription>
                  {displayValue(vm.spec?.image?.sourceRef)}
                </DescriptionListDescription>
              </DescriptionListGroup>
              <DescriptionListGroup>
                <DescriptionListTerm>
                  {t('catalogProvision.vm.fields.instanceType')}
                </DescriptionListTerm>
                <DescriptionListDescription>
                  {isInstanceTypeLoading && instanceTypeId?.trim() ? (
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
                <DescriptionListTerm>{fieldLabels.bootDisk}</DescriptionListTerm>
                <DescriptionListDescription>
                  {formatBootDiskSizeForReview(vm.spec?.bootDisk?.sizeGib)}
                </DescriptionListDescription>
              </DescriptionListGroup>
            </>
          ) : null}
          <DescriptionListGroup>
            <DescriptionListTerm>{t('Created')}</DescriptionListTerm>
            <DescriptionListDescription>
              <Timestamp value={vm.metadata?.creationTimestamp} />
            </DescriptionListDescription>
          </DescriptionListGroup>
          <DescriptionListGroup>
            <DescriptionListTerm>{t('vm.details.fields.creator')}</DescriptionListTerm>
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
