import { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Alert,
  Bullseye,
  Button,
  Gallery,
  GalleryItem,
  PageSection,
  SearchInput,
  Spinner,
  Stack,
  StackItem,
} from '@patternfly/react-core';

import { useComputeInstanceCatalogItems } from '@osac/ui-components/api/v1/compute-instance-catalog-item';
import { SubtleContent } from '@osac/ui-components/components/SubtleContent/SubtleContent';

import { PageDataSection } from '../../components/layout/PageDataSection';
import { PageHeader } from '../../components/layout/PageHeader';
import { CatalogItemCard } from '../../components/vm/CatalogItemCard';
import { CatalogItemDetailDrawer } from '../../components/vm/CatalogItemDetailDrawer';
import type { CatalogItemForDisplay } from '../../components/vm/catalogItemDisplay';
import { searchableCatalogItemText } from '../../components/vm/catalogItemDisplay';

import './CatalogPage.css';

interface Props {
  isProviderGlobal?: boolean;
}

export const CatalogPage = ({ isProviderGlobal = false }: Props) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [selectedCatalogItem, setSelectedCatalogItem] = useState<CatalogItemForDisplay | null>(
    null,
  );

  const {
    data: catalogItems = [],
    isPending: catalogLoading,
    isError: catalogError,
    refetch: refetchCatalogItems,
  } = useComputeInstanceCatalogItems();

  const searchTerm = search.trim().toLowerCase();

  const filtered = useMemo(() => {
    if (!searchTerm) {
      return catalogItems;
    }
    return catalogItems.filter((item) => searchableCatalogItemText(item).includes(searchTerm));
  }, [catalogItems, searchTerm]);

  const handleOpenFromCatalogItem = useCallback(
    (item: CatalogItemForDisplay) => {
      setSelectedCatalogItem(null);
      navigate('/vms/create', { state: { catalogItemId: item.id } });
    },
    [navigate],
  );

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
            <SubtleContent component="small" className="osac-template-catalog-count">
              {catalogLoading ? '…' : filtered.length} catalog items
            </SubtleContent>
          </StackItem>
          <StackItem>
            {catalogLoading ? (
              <Bullseye className="osac-catalog__loading">
                <Spinner aria-label="Loading catalog items" />
              </Bullseye>
            ) : filtered.length === 0 ? (
              <SubtleContent component="p" className="osac-template-empty-state">
                No catalog items match your search.
              </SubtleContent>
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
