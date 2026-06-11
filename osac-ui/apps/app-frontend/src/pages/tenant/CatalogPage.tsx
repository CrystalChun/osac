import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Bullseye,
  Button,
  Checkbox,
  Content,
  DescriptionList,
  DescriptionListDescription,
  DescriptionListGroup,
  DescriptionListTerm,
  Drawer,
  DrawerActions,
  DrawerCloseButton,
  DrawerContent,
  DrawerContentBody,
  DrawerHead,
  DrawerPanelBody,
  DrawerPanelContent,
  ExpandableSection,
  Flex,
  FlexItem,
  Gallery,
  GalleryItem,
  PageSection,
  SearchInput,
  Sidebar,
  SidebarContent,
  SidebarPanel,
  Spinner,
  Stack,
  StackItem,
  Switch,
  Title,
} from '@patternfly/react-core';
import type {
  ClusterTemplate,
  ComputeInstance,
  ComputeInstanceCatalogItem,
  OsType,
} from '@osac/api-contracts/types';
import { useLocation } from 'react-router-dom';
import {
  useComputeInstanceCatalogItems,
  useComputeInstanceTemplates,
  useComputeInstances,
  useProvisionVm,
} from '../../api/hooks';
import { GuestOsIcon } from '../../components/shared/GuestOsIcon';
import { PageHeader } from '../../components/layout/PageHeader';
import type { CreateVmWizardHandle, DeploymentMode } from '../../components/vm/CreateVmWizard';
import { CreateVmWizard } from '../../components/vm/CreateVmWizard';
import { TemplateCard } from '../../components/vm/TemplateCard';
import './CatalogPage.css';

interface Props {
  isProviderGlobal?: boolean;
}

type OsFilterKey = 'rhel' | 'windows' | 'linux';
type WorkloadFilterKey = 'highPerformance' | 'machineLearning' | 'dataProcessing' | 'analytics';

const OS_FILTER_CONFIG: Array<{
  key: OsFilterKey;
  label: string;
  matches: (template: ClusterTemplate) => boolean;
}> = [
  { key: 'rhel', label: 'RHEL', matches: (template) => template.icon === 'rhel' },
  { key: 'windows', label: 'Windows', matches: (template) => template.icon === 'windows' },
  { key: 'linux', label: 'Linux', matches: (template) => template.icon === 'linux' },
];

const WORKLOAD_FILTER_CONFIG: Array<{
  key: WorkloadFilterKey;
  label: string;
  matches: (template: ClusterTemplate) => boolean;
}> = [
  {
    key: 'highPerformance',
    label: 'High performance',
    matches: (template) => template.workloadProfile === 'high-performance',
  },
  {
    key: 'machineLearning',
    label: 'Machine learning',
    matches: (template) => template.workloadProfile === 'machine-learning',
  },
  {
    key: 'dataProcessing',
    label: 'Data processing',
    matches: (template) => template.workloadProfile === 'data-processing',
  },
  {
    key: 'analytics',
    label: 'Analytics',
    matches: (template) => template.workloadProfile === 'analytics',
  },
];

const searchableTemplateText = (template: ClusterTemplate): string => {
  const subtitle =
    template.description && template.description.trim().length > 0
      ? template.description
      : template.metadata.name;
  const workloadLabel = (() => {
    if (!template.workloadProfile) {
      return template.workload ?? 'General';
    }
    if (template.workloadProfile === 'high-performance') {
      return 'High performance';
    }
    if (template.workloadProfile === 'machine-learning') {
      return 'Machine learning';
    }
    if (template.workloadProfile === 'data-processing') {
      return 'Data processing';
    }
    return 'Analytics';
  })();
  const bootDiskGib = template.defaultBootDiskSizeGib ?? 40;

  return [
    template.title,
    subtitle,
    template.description,
    template.metadata.name,
    template.workload,
    template.workloadProfile,
    workloadLabel,
    `${bootDiskGib} gib`,
    bootDiskGib.toString(),
    'Pod network',
    'Guest logs on',
    template.defaultCores?.toString(),
    template.defaultMemoryGib ? `${template.defaultMemoryGib} gib` : '',
    template.defaultMemoryGib?.toString(),
    (template.tags ?? []).join(' '),
    JSON.stringify(template.metadata.labels ?? {}),
    JSON.stringify(template.spec ?? {}),
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
};

const guestOperatingSystem = (template: ClusterTemplate): string => {
  if (template.icon === 'windows') {
    return 'Microsoft Windows';
  }
  if (template.icon === 'rhel') {
    return 'Red Hat Enterprise Linux';
  }
  return 'Linux';
};

const workloadLabel = (template: ClusterTemplate): string => {
  if (!template.workloadProfile) {
    return template.workload ?? 'General';
  }
  if (template.workloadProfile === 'high-performance') {
    return 'High performance';
  }
  if (template.workloadProfile === 'machine-learning') {
    return 'Machine learning';
  }
  if (template.workloadProfile === 'data-processing') {
    return 'Data processing';
  }
  return 'Analytics';
};

const searchableCatalogItemText = (
  item: ComputeInstanceCatalogItem,
  template: ClusterTemplate | undefined,
): string => {
  const templateText = template ? searchableTemplateText(template) : '';
  return [item.title, item.description, item.metadata.name, item.template, templateText]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
};

const resolveTemplateForCatalogItem = (
  item: ComputeInstanceCatalogItem,
  templates: ClusterTemplate[],
): ClusterTemplate => {
  const found = templates.find((t) => t.id === item.template);
  if (found) {
    return found;
  }
  return {
    id: item.template,
    title: item.title,
    metadata: item.metadata,
    description: item.description,
  };
};

const drawerSubtitleForCatalogItem = (item: ComputeInstanceCatalogItem): string => {
  const source = item.description?.trim() || item.metadata.name;
  return source.length <= 88 ? source : `${source.slice(0, 87)}…`;
};

export const CatalogPage = ({ isProviderGlobal = false }: Props) => {
  const location = useLocation();
  const [search, setSearch] = useState('');
  const [osFilters, setOsFilters] = useState<Record<OsFilterKey, boolean>>({
    rhel: false,
    windows: false,
    linux: false,
  });
  const [workloadFilters, setWorkloadFilters] = useState<Record<WorkloadFilterKey, boolean>>({
    highPerformance: false,
    machineLearning: false,
    dataProcessing: false,
    analytics: false,
  });
  const [selectedCatalogItem, setSelectedCatalogItem] = useState<ComputeInstanceCatalogItem | null>(
    null,
  );
  const wizardRef = useRef<CreateVmWizardHandle>(null);
  const drawerTitleRef = useRef<HTMLHeadingElement>(null);

  const {
    data: catalogItems = [],
    isPending: catalogLoading,
    isError: catalogError,
    refetch: refetchCatalogItems,
  } = useComputeInstanceCatalogItems();
  const { data: templates = [], isPending: templatesLoading } = useComputeInstanceTemplates();
  const { data: vms = [] } = useComputeInstances();
  const provisionVm = useProvisionVm();

  const handleWizardProvision = useCallback(
    async (vm: Partial<ComputeInstance>, meta: { mode: DeploymentMode }) => {
      await provisionVm.mutateAsync({ vm, specCatalogItemOnly: meta.mode === 'template' });
    },
    [provisionVm],
  );
  const searchTerm = search.trim().toLowerCase();

  const activeOsFilterKeys = useMemo(
    () =>
      (Object.entries(osFilters) as Array<[OsFilterKey, boolean]>).filter(([, active]) => active),
    [osFilters],
  );
  const activeWorkloadFilterKeys = useMemo(
    () =>
      (Object.entries(workloadFilters) as Array<[WorkloadFilterKey, boolean]>).filter(
        ([, active]) => active,
      ),
    [workloadFilters],
  );

  const templateById = useMemo(
    () => new Map(templates.map((template) => [template.id, template])),
    [templates],
  );

  const filtered = useMemo(() => {
    return catalogItems.filter((item) => {
      const template = templateById.get(item.template);
      const matchesSearch =
        searchTerm.length === 0 || searchableCatalogItemText(item, template).includes(searchTerm);

      const matchesOsGroup =
        activeOsFilterKeys.length === 0 ||
        (template != null &&
          activeOsFilterKeys.some(([key]) =>
            OS_FILTER_CONFIG.find((config) => config.key === key)?.matches(template),
          ));

      const matchesWorkloadGroup =
        activeWorkloadFilterKeys.length === 0 ||
        (template != null &&
          activeWorkloadFilterKeys.some(([key]) =>
            WORKLOAD_FILTER_CONFIG.find((config) => config.key === key)?.matches(template),
          ));

      return matchesSearch && matchesOsGroup && matchesWorkloadGroup;
    });
  }, [catalogItems, templateById, searchTerm, activeOsFilterKeys, activeWorkloadFilterKeys]);

  const handleOpenFromCatalogItem = useCallback((item: ComputeInstanceCatalogItem) => {
    wizardRef.current?.openFromCatalogItem(item.id);
    setSelectedCatalogItem(null);
  }, []);

  const clearCategoryFilters = useCallback(() => {
    setOsFilters({ rhel: false, windows: false, linux: false });
    setWorkloadFilters({
      highPerformance: false,
      machineLearning: false,
      dataProcessing: false,
      analytics: false,
    });
  }, []);
  const hasAnyCategoryFilter = activeOsFilterKeys.length > 0 || activeWorkloadFilterKeys.length > 0;

  const locationState =
    location.state && typeof location.state === 'object'
      ? (location.state as { navReselect?: boolean; navSelectSeq?: number })
      : null;
  useEffect(() => {
    if (locationState?.navReselect) {
      setSelectedCatalogItem(null);
    }
  }, [locationState?.navReselect, locationState?.navSelectSeq]);
  useEffect(() => {
    if (selectedCatalogItem) {
      drawerTitleRef.current?.focus();
    }
  }, [selectedCatalogItem]);

  const catalogContent = (
    <Sidebar
      className="catalog-vm-templates-sidebar osac-template-catalog-layout"
      hasGutter
      hasBorder
    >
      <SidebarPanel variant="static">
        <Title headingLevel="h2" size="md">
          Categories
        </Title>
        <Button
          className="catalog-vm-templates-all-items-button"
          variant={hasAnyCategoryFilter ? 'plain' : 'secondary'}
          isBlock
          onClick={clearCategoryFilters}
        >
          All items
        </Button>
        <ExpandableSection toggleText="Operating system" isExpanded isIndented>
          <Stack className="catalog-vm-templates-checkbox-stack">
            {OS_FILTER_CONFIG.map((filterConfig) => (
              <StackItem key={filterConfig.key}>
                <Checkbox
                  id={`catalog-os-${filterConfig.key}`}
                  label={filterConfig.label}
                  isChecked={osFilters[filterConfig.key]}
                  onChange={(_, checked) =>
                    setOsFilters((current) => ({ ...current, [filterConfig.key]: checked }))
                  }
                />
              </StackItem>
            ))}
          </Stack>
        </ExpandableSection>
        <ExpandableSection toggleText="Workload" isExpanded isIndented>
          <Stack className="catalog-vm-templates-checkbox-stack">
            {WORKLOAD_FILTER_CONFIG.map((filterConfig) => (
              <StackItem key={filterConfig.key}>
                <Checkbox
                  id={`catalog-workload-${filterConfig.key}`}
                  label={filterConfig.label}
                  isChecked={workloadFilters[filterConfig.key]}
                  onChange={(_, checked) =>
                    setWorkloadFilters((current) => ({
                      ...current,
                      [filterConfig.key]: checked,
                    }))
                  }
                />
              </StackItem>
            ))}
          </Stack>
        </ExpandableSection>
      </SidebarPanel>
      <SidebarContent>
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
                {catalogLoading || templatesLoading ? (
                  <Bullseye className="osac-catalog__loading">
                    <Spinner aria-label="Loading catalog items" />
                  </Bullseye>
                ) : filtered.length === 0 ? (
                  <Content component="p" className="osac-template-empty-state">
                    No catalog items match your current filters and search.
                  </Content>
                ) : (
                  <Gallery hasGutter className="osac-template-gallery">
                    {filtered.map((item) => {
                      const cardTemplate = resolveTemplateForCatalogItem(item, templates);
                      return (
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
                            <TemplateCard template={cardTemplate} />
                          </div>
                        </GalleryItem>
                      );
                    })}
                  </Gallery>
                )}
              </StackItem>
            </>
          )}
        </Stack>
      </SidebarContent>
    </Sidebar>
  );

  return (
    <PageSection isFilled className="tenant-vm-templates-catalog-root">
      <CreateVmWizard
        ref={wizardRef}
        existingVms={vms}
        onProvision={handleWizardProvision}
        defaultMode="template"
      />

      <PageHeader
        title={isProviderGlobal ? 'Global catalog' : 'VM catalog'}
        descriptionWidth="medium"
        description={
          isProviderGlobal
            ? 'Browse published catalog items and inspect details before launching a virtual machine.'
            : 'Browse catalog items by operating system and workload.'
        }
        actions={
          isProviderGlobal ? (
            <Button
              variant="primary"
              onClick={(event) => {
                event.preventDefault();
              }}
            >
              Add template
            </Button>
          ) : undefined
        }
      />
      <div className="tenant-vm-templates-header-separator" aria-hidden />

      <div className="tenant-vm-templates-drawer-host">
        {selectedCatalogItem ? (
          <Drawer
            isExpanded
            isInline={false}
            position="right"
            className="tenant-vm-templates-drawer"
          >
            <DrawerContent
              panelContent={
                <DrawerPanelContent
                  widths={{ default: 'width_100', lg: 'width_50' }}
                  className="tenant-vm-template-drawer-panel"
                  aria-labelledby="tenant-vm-template-drawer-title"
                >
                  {(() => {
                    const displayTemplate = resolveTemplateForCatalogItem(
                      selectedCatalogItem,
                      templates,
                    );
                    return (
                      <>
                        <DrawerHead className="tenant-vm-template-drawer-head">
                          <Flex
                            alignItems={{ default: 'alignItemsFlexStart' }}
                            spaceItems={{ default: 'spaceItemsMd' }}
                          >
                            <FlexItem className="tenant-vm-template-card__icon-tile">
                              <GuestOsIcon
                                os={(displayTemplate.icon ?? 'linux') as OsType}
                                size="lg"
                              />
                            </FlexItem>
                            <FlexItem>
                              <Stack hasGutter={false}>
                                <StackItem>
                                  <Title
                                    headingLevel="h2"
                                    size="xl"
                                    tabIndex={-1}
                                    id="tenant-vm-template-drawer-title"
                                    ref={drawerTitleRef}
                                  >
                                    {selectedCatalogItem.title}
                                  </Title>
                                </StackItem>
                                <StackItem>
                                  <Content
                                    component="small"
                                    className="tenant-vm-template-drawer-subtitle"
                                  >
                                    {drawerSubtitleForCatalogItem(selectedCatalogItem)}
                                  </Content>
                                </StackItem>
                              </Stack>
                            </FlexItem>
                          </Flex>
                          <DrawerActions>
                            <Button
                              className="tenant-vm-template-drawer-head-create"
                              variant="primary"
                              onClick={() => {
                                handleOpenFromCatalogItem(selectedCatalogItem);
                              }}
                            >
                              Create virtual machine
                            </Button>
                            <DrawerCloseButton onClick={() => setSelectedCatalogItem(null)} />
                          </DrawerActions>
                        </DrawerHead>
                        <DrawerPanelBody className="tenant-vm-template-drawer-body tenant-vm-template-drawer-scroll">
                          <Stack className="tenant-vm-template-detail-stack">
                            <StackItem>
                              <DescriptionList isCompact>
                                <DescriptionListGroup>
                                  <DescriptionListTerm>Guest operating system</DescriptionListTerm>
                                  <DescriptionListDescription>
                                    {guestOperatingSystem(displayTemplate)}
                                  </DescriptionListDescription>
                                </DescriptionListGroup>
                                <DescriptionListGroup>
                                  <DescriptionListTerm>CPU</DescriptionListTerm>
                                  <DescriptionListDescription>
                                    {displayTemplate.defaultCores ?? 2} vCPU
                                  </DescriptionListDescription>
                                </DescriptionListGroup>
                                <DescriptionListGroup>
                                  <DescriptionListTerm>Memory</DescriptionListTerm>
                                  <DescriptionListDescription>
                                    {displayTemplate.defaultMemoryGib ?? 8} GiB
                                  </DescriptionListDescription>
                                </DescriptionListGroup>
                                <DescriptionListGroup>
                                  <DescriptionListTerm>Storage</DescriptionListTerm>
                                  <DescriptionListDescription>
                                    {displayTemplate.defaultBootDiskSizeGib ?? 40} GiB boot disk
                                  </DescriptionListDescription>
                                </DescriptionListGroup>
                                <DescriptionListGroup>
                                  <DescriptionListTerm>Workload</DescriptionListTerm>
                                  <DescriptionListDescription>
                                    {workloadLabel(displayTemplate)}
                                  </DescriptionListDescription>
                                </DescriptionListGroup>
                              </DescriptionList>
                            </StackItem>
                            <StackItem>
                              <Stack hasGutter>
                                <StackItem>
                                  <Switch
                                    id="template-detail-headless-mode"
                                    label="Headless mode"
                                    aria-label="Headless mode"
                                    isChecked={false}
                                    isDisabled
                                  />
                                </StackItem>
                                <StackItem>
                                  <Switch
                                    id="template-detail-guest-log-access"
                                    label="Guest system log access"
                                    aria-label="Guest system log access"
                                    isChecked
                                    isDisabled
                                  />
                                </StackItem>
                                <StackItem>
                                  <Switch
                                    id="template-detail-deletion-protection"
                                    label="Deletion protection"
                                    aria-label="Deletion protection"
                                    isChecked={false}
                                    isDisabled
                                  />
                                </StackItem>
                              </Stack>
                            </StackItem>
                          </Stack>
                        </DrawerPanelBody>
                      </>
                    );
                  })()}
                </DrawerPanelContent>
              }
            >
              <DrawerContentBody className="tenant-vm-templates-drawer__main">
                {catalogContent}
              </DrawerContentBody>
            </DrawerContent>
          </Drawer>
        ) : (
          <div className="tenant-vm-templates-drawer__main">{catalogContent}</div>
        )}
      </div>
    </PageSection>
  );
};
