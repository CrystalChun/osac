import { useParams } from 'react-router-dom';
import {
  Card,
  CardBody,
  DescriptionList,
  DescriptionListDescription,
  DescriptionListGroup,
  DescriptionListTerm,
  PageSection,
} from '@patternfly/react-core';
import type { TFunction } from 'i18next';

import { SourceType } from '@osac/types';

import DiskImageLifecycleLabel from './DiskImageLifecycleLabel';
import { architectureLabels, guestOsFamilyLabels } from './DiskImageTable';
import { useDiskImage } from '../../api/v1/disk-image';
import { useTranslation } from '../../hooks/useTranslation';
import { displayValue } from '../../utils/detailFormatters';
import { Timestamp } from '../Primitives/Timestamp';
import { ResourceDetailHeader } from '../Resource/ResourceDetailHeader';
import { ResourceDetailsPageError } from '../Resource/ResourceDetailsPageError';
import { ResourceDetailsPageLoading } from '../Resource/ResourceDetailsPageLoading';

export const DISK_IMAGES_LIST_ROUTE = '/admin/infrastructure/disk-images';

const sourceTypeLabels = (t: TFunction): Record<SourceType, string> => ({
  [SourceType.UNSPECIFIED]: t('Unspecified'),
  [SourceType.REGISTRY]: t('Registry'),
});

const DiskImageDetailPage = () => {
  const { t } = useTranslation();
  const { id = '' } = useParams<{ id: string }>();
  const { data: diskImage, isLoading, isError, error, refetch } = useDiskImage(id);

  if (isLoading) {
    return (
      <ResourceDetailsPageLoading
        parentTo={DISK_IMAGES_LIST_ROUTE}
        parentLabel={t('Disk images')}
        cardCount={1}
      />
    );
  }

  if (isError) {
    return (
      <ResourceDetailsPageError
        parentTo={DISK_IMAGES_LIST_ROUTE}
        parentLabel={t('Disk images')}
        resourceLabel={t('disk image')}
        error={error}
        onRetry={() => void refetch()}
      />
    );
  }

  if (!diskImage) {
    return (
      <ResourceDetailsPageError
        parentTo={DISK_IMAGES_LIST_ROUTE}
        parentLabel={t('Disk images')}
        resourceLabel={t('disk image')}
        variant="not-found"
      />
    );
  }

  const architecture = diskImage.spec?.architecture ?? [];
  const architectureText = architectureLabels(t);
  const deprecation = diskImage.spec?.deprecation;
  const isGlobal = diskImage.metadata?.tenant === 'shared';

  return (
    <>
      <PageSection hasBodyWrapper={false}>
        <ResourceDetailHeader
          parentTo={DISK_IMAGES_LIST_ROUTE}
          parentLabel={t('Disk images')}
          resourceName={diskImage.metadata?.name || diskImage.id}
        />
        {/* Lifecycle ActionList insertion point — OSAC-4453 */}
      </PageSection>

      <PageSection hasBodyWrapper={false}>
        <Card>
          <CardBody>
            <DescriptionList isCompact columnModifier={{ default: '2Col' }}>
              <DescriptionListGroup>
                <DescriptionListTerm>{t('Source type')}</DescriptionListTerm>
                <DescriptionListDescription>
                  {sourceTypeLabels(t)[diskImage.spec?.sourceType ?? SourceType.UNSPECIFIED]}
                </DescriptionListDescription>
              </DescriptionListGroup>

              <DescriptionListGroup>
                <DescriptionListTerm>{t('Source reference')}</DescriptionListTerm>
                <DescriptionListDescription>
                  <code>{displayValue(diskImage.spec?.sourceRef)}</code>
                </DescriptionListDescription>
              </DescriptionListGroup>

              <DescriptionListGroup>
                <DescriptionListTerm>{t('Guest OS family')}</DescriptionListTerm>
                <DescriptionListDescription>
                  {guestOsFamilyLabels(t)[diskImage.spec?.guestOsFamily ?? 0]}
                </DescriptionListDescription>
              </DescriptionListGroup>

              <DescriptionListGroup>
                <DescriptionListTerm>{t('Architecture')}</DescriptionListTerm>
                <DescriptionListDescription>
                  {architecture.length
                    ? architecture
                        .map((value) => architectureText[value] ?? t('Unspecified'))
                        .join(', ')
                    : '—'}
                </DescriptionListDescription>
              </DescriptionListGroup>

              <DescriptionListGroup>
                <DescriptionListTerm>{t('Lifecycle')}</DescriptionListTerm>
                <DescriptionListDescription>
                  <DiskImageLifecycleLabel lifecycle={diskImage.spec?.lifecycle} />
                </DescriptionListDescription>
              </DescriptionListGroup>

              {deprecation?.deprecationTimestamp && (
                <DescriptionListGroup>
                  <DescriptionListTerm>{t('Deprecation timestamp')}</DescriptionListTerm>
                  <DescriptionListDescription>
                    <Timestamp value={deprecation.deprecationTimestamp} />
                  </DescriptionListDescription>
                </DescriptionListGroup>
              )}

              {deprecation?.obsolescenceTimestamp && (
                <DescriptionListGroup>
                  <DescriptionListTerm>{t('Obsolescence timestamp')}</DescriptionListTerm>
                  <DescriptionListDescription>
                    <Timestamp value={deprecation.obsolescenceTimestamp} />
                  </DescriptionListDescription>
                </DescriptionListGroup>
              )}

              <DescriptionListGroup>
                <DescriptionListTerm>{t('Scope')}</DescriptionListTerm>
                <DescriptionListDescription>
                  {isGlobal ? t('Global') : t('Tenant')}
                </DescriptionListDescription>
              </DescriptionListGroup>

              <DescriptionListGroup>
                <DescriptionListTerm>{t('Created')}</DescriptionListTerm>
                <DescriptionListDescription>
                  <Timestamp value={diskImage.metadata?.creationTimestamp} />
                </DescriptionListDescription>
              </DescriptionListGroup>
            </DescriptionList>
          </CardBody>
        </Card>
      </PageSection>
    </>
  );
};

export default DiskImageDetailPage;
