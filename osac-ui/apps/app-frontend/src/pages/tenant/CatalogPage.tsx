import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Bullseye,
  Button,
  Content,
  Gallery,
  GalleryItem,
  PageSection,
  SearchInput,
  Spinner,
  Stack,
  StackItem,
} from '@patternfly/react-core';
import type { ComputeInstance, ComputeInstanceCatalogItem } from '@osac/api-contracts/types';
import { useLocation } from 'react-router-dom';
import { useComputeInstanceCatalogItems, useProvisionVm } from '../../api/hooks';
import { PageHeader } from '../../components/layout/PageHeader';
import { PageDataSection } from '../../components/layout/PageDataSection';
import { CatalogItemCard } from '../../components/vm/CatalogItemCard';
import { CatalogItemDetailDrawer } from '../../components/vm/CatalogItemDetailDrawer';
import { searchableCatalogItemText } from '../../components/vm/catalogItemDisplay';
import {
  CatalogProvisionWizard,
  type CatalogProvisionWizardHandle,
} from '../../components/catalogProvision/CatalogProvisionWizard';
import './CatalogPage.css';

interface Props {
  isProviderGlobal?: boolean;
}

export const CatalogPage = ({ isProviderGlobal = false }: Props) => {
  const location = useLocation();
  const [search, setSearch] = useState('');
  const [selectedCatalogItem, setSelectedCatalogItem] = useState<ComputeInstanceCatalogItem | null>(
    null,
  );
  const wizardRef = useRef<CatalogProvisionWizardHandle>(null);

  const {
    data: catalogItems = [],
    isPending: catalogLoading,
    isError: catalogError,
    refetch: refetchCatalogItems,
  } = useComputeInstanceCatalogItems();
  const provisionVm = useProvisionVm();

  const handleWizardProvision = useCallback(
    async (vm: Partial<ComputeInstance>) => {
      await provisionVm.mutateAsync({ vm, specCatalogItemOnly: true });
    },
    [provisionVm],
  );

  const searchTerm = search.trim().toLowerCase();

  const filtered = useMemo(() => {
    if (!searchTerm) {
      return catalogItems;
    }
    return catalogItems.filter((item) => searchableCatalogItemText(item).includes(searchTerm));
  }, [catalogItems, searchTerm]);

  const handleOpenFromCatalogItem = useCallback((item: ComputeInstanceCatalogItem) => {
    wizardRef.current?.openFromCatalogItem(item.id);
    setSelectedCatalogItem(null);
  }, []);

  const locationState =
    location.state && typeof location.state === 'object'
      ? (location.state as { navReselect?: boolean; navSelectSeq?: number })
      : null;

  useEffect(() => {
    if (locationState?.navReselect) {
      setSelectedCatalogItem(null);
    }
  }, [locationState?.navReselect, locationState?.navSelectSeq]);

  const catalogContent = (
    <Stack hasGutter>
      {catalogError ? (
        <StackItem>
          <Stack hasGutter>
            <StackItem>
              <Alert variant="danger" title="Could not load catalog items">
                Unable to load catalog items right now. Please try again.
              </Alert>
            </StackItem>
            <StackItem>
              <Button variant="primary" onClick={() => void refetchCatalogItems()}>
                Retry
              </Button>
            </StackItem>
          </Stack>
        </StackItem>
      ) : (
        <>
          <StackItem>
            <SearchInput
              className="osac-template-catalog-search"
              placeholder="Search catalog items"
              value={search}
              onChange={(_e, value) => setSearch(value)}
              onClear={() => setSearch('')}
              aria-label="Filter catalog by keyword"
            />
          </StackItem>
          <StackItem>
            <Content component="small" className="osac-template-catalog-count">
              {catalogLoading ? '…' : filtered.length} catalog items
            </Content>
          </StackItem>
          <StackItem>
            {catalogLoading ? (
              <Bullseye className="osac-catalog__loading">
                <Spinner aria-label="Loading catalog items" />
              </Bullseye>
            ) : filtered.length === 0 ? (
              <Content component="p" className="osac-template-empty-state">
                No catalog items match your search.
              </Content>
            ) : (
              <Gallery hasGutter className="osac-template-gallery">
                {filtered.map((item) => (
                  <GalleryItem key={item.id}>
                    <div
                      className="tenant-vm-catalog-template-card-wrap"
                      role="button"
                      tabIndex={0}
                      aria-label={`Open catalog item details for ${item.title}`}
                      onClick={() => setSelectedCatalogItem(item)}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter' || event.key === ' ') {
                          event.preventDefault();
                          setSelectedCatalogItem(item);
                        }
                      }}
                    >
                      <CatalogItemCard item={item} />
                    </div>
                  </GalleryItem>
                ))}
              </Gallery>
            )}
          </StackItem>
        </>
      )}
    </Stack>
  );

  return (
    <PageSection isFilled className="osac-page tenant-vm-templates-catalog-root">
      <CatalogProvisionWizard
        ref={wizardRef}
        breadcrumbParentLabel="Catalog"
        onProvision={handleWizardProvision}
      />

      <PageHeader
        title={isProviderGlobal ? 'Global catalog' : 'Catalog'}
        descriptionWidth="medium"
        description={
          isProviderGlobal
            ? 'Browse published catalog items and inspect details before launching a virtual machine.'
            : 'Browse catalog items and launch virtual machines from published offerings.'
        }
      />
      <div className="tenant-vm-templates-header-separator" aria-hidden />

      <PageDataSection>
        <CatalogItemDetailDrawer
          item={selectedCatalogItem}
          onClose={() => setSelectedCatalogItem(null)}
          hostClassName="tenant-vm-templates-drawer-host"
          className="tenant-vm-templates-drawer"
          actions={
            selectedCatalogItem ? (
              <Button
                className="catalog-item-detail-drawer__primary-action"
                variant="primary"
                onClick={() => handleOpenFromCatalogItem(selectedCatalogItem)}
              >
                Create virtual machine
              </Button>
            ) : null
          }
        >
          {catalogContent}
        </CatalogItemDetailDrawer>
      </PageDataSection>
    </PageSection>
  );
};
