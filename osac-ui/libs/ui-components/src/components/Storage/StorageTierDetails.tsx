import {
  Alert,
  Card,
  CardBody,
  CardTitle,
  DescriptionList,
  DescriptionListDescription,
  DescriptionListGroup,
  DescriptionListTerm,
  Divider,
  Flex,
  FlexItem,
  PageSection,
  Stack,
  StackItem,
} from '@patternfly/react-core';

import type { StorageBackend, StorageTier } from '@osac/types/private';

import { StorageTierBackendAssociationsTable } from './StorageTierBackendAssociationsTable';
import { StorageTierDetailActionButtons } from './StorageTierDetailActionButtons';
import { StorageTierStatusLabel } from './StorageTierStatusLabel';
import { useTranslation } from '../../hooks/useTranslation';
import { ResourceDetailHeader } from '../Resource/ResourceDetailHeader';

const TIERS_LIST_PATH = '/admin/infrastructure/storage/tiers';

interface StorageTierDetailsProps {
  tier: StorageTier;
  backendsById: Map<string, StorageBackend>;
  backendsError?: unknown;
}

export const StorageTierDetails = ({
  tier,
  backendsById,
  backendsError,
}: StorageTierDetailsProps) => {
  const { t } = useTranslation();
  const tierName = tier.metadata?.name ?? tier.id;

  return (
    <>
      <PageSection hasBodyWrapper={false}>
        <Stack hasGutter>
          <StackItem>
            <Flex
              justifyContent={{ default: 'justifyContentSpaceBetween' }}
              alignItems={{ default: 'alignItemsFlexStart' }}
              flexWrap={{ default: 'wrap' }}
              spaceItems={{ default: 'spaceItemsMd' }}
            >
              <FlexItem>
                <ResourceDetailHeader
                  parentTo={TIERS_LIST_PATH}
                  parentLabel={t('Storage tiers')}
                  resourceName={tierName}
                  titleAddon={<StorageTierStatusLabel state={tier.status?.state} />}
                />
              </FlexItem>
              <FlexItem>
                <StorageTierDetailActionButtons tier={tier} />
              </FlexItem>
            </Flex>
          </StackItem>
          <StackItem>
            <Divider />
          </StackItem>
        </Stack>
      </PageSection>

      <PageSection hasBodyWrapper={false}>
        <Card>
          <CardBody>
            <DescriptionList isHorizontal>
              <DescriptionListGroup>
                <DescriptionListTerm>{t('Name')}</DescriptionListTerm>
                <DescriptionListDescription>{tierName}</DescriptionListDescription>
              </DescriptionListGroup>

              {tier.spec?.description && (
                <DescriptionListGroup>
                  <DescriptionListTerm>{t('Description')}</DescriptionListTerm>
                  <DescriptionListDescription>{tier.spec.description}</DescriptionListDescription>
                </DescriptionListGroup>
              )}

              {tier.status?.message && (
                <DescriptionListGroup>
                  <DescriptionListTerm>{t('Message')}</DescriptionListTerm>
                  <DescriptionListDescription>{tier.status.message}</DescriptionListDescription>
                </DescriptionListGroup>
              )}
            </DescriptionList>
          </CardBody>
        </Card>
      </PageSection>

      <PageSection hasBodyWrapper={false}>
        <Card>
          <CardTitle>{t('Backend associations')}</CardTitle>
          <CardBody>
            <Stack hasGutter>
              {Boolean(backendsError) && (
                <StackItem>
                  <Alert variant="warning" isInline title={t('Unable to resolve backend names')}>
                    {t(
                      'Backend IDs are shown in place of names until this recovers. This is separate from the normal fallback shown when a tier references a backend that no longer exists.',
                    )}
                  </Alert>
                </StackItem>
              )}
              <StackItem>
                <StorageTierBackendAssociationsTable
                  backends={tier.spec?.backends ?? []}
                  backendsById={backendsById}
                />
              </StackItem>
            </Stack>
          </CardBody>
        </Card>
      </PageSection>
    </>
  );
};
