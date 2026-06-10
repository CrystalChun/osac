import {
  Alert,
  Bullseye,
  Button,
  Card,
  CardBody,
  CardHeader,
  Content,
  Flex,
  FlexItem,
  FormSelect,
  FormSelectOption,
  Label,
  Radio,
  SearchInput,
  Spinner,
  Stack,
  StackItem,
  Title,
} from '@patternfly/react-core';
import { useMemo, useState } from 'react';
import type { ClusterTemplate, OsType, TemplateWorkloadProfile } from '@osac/api-contracts/types';
import { useComputeInstanceTemplates } from '../../../../api/hooks';
import { GuestOsIcon } from '../../../shared/GuestOsIcon';
import { defaultTemplateBootDiskGib } from '../constants';
import type { UpdateFn, WizardState } from '../types';

const applySelectedTemplate = (tpl: ClusterTemplate, update: UpdateFn) => {
  update('selectedTemplateId', tpl.id);
  update('templateBootDiskSizeGib', String(defaultTemplateBootDiskGib(tpl)));
};

const OS_FILTER_OPTIONS = [
  { value: 'all', label: 'All operating systems' },
  { value: 'rhel', label: 'RHEL' },
  { value: 'windows', label: 'Microsoft Windows' },
  { value: 'linux', label: 'Linux' },
] as const;

const WORKLOAD_FILTER_OPTIONS: { value: 'all' | TemplateWorkloadProfile; label: string }[] = [
  { value: 'all', label: 'All workloads' },
  { value: 'high-performance', label: 'High performance' },
  { value: 'analytics', label: 'Analytics' },
  { value: 'machine-learning', label: 'Machine learning' },
  { value: 'data-processing', label: 'Data processing' },
];

const WORKLOAD_LABELS: Record<TemplateWorkloadProfile, string> = {
  'high-performance': 'High performance',
  analytics: 'Analytics',
  'machine-learning': 'Machine learning',
  'data-processing': 'Data processing',
};

const truncateDescription = (text: string, max = 120): string => {
  if (text.length <= max) {
    return text;
  }
  return `${text.slice(0, max - 1)}…`;
};

export const TemplateStep = ({ state, update }: { state: WizardState; update: UpdateFn }) => {
  const [osFilter, setOsFilter] = useState<string>('all');
  const [workloadFilter, setWorkloadFilter] = useState<string>('all');
  const [search, setSearch] = useState('');

  const {
    data: templates = [],
    isPending: templatesLoading,
    isError: templatesError,
    error: templatesErrorDetail,
    refetch: refetchTemplates,
  } = useComputeInstanceTemplates();

  const filtered = useMemo(() => {
    let list: ClusterTemplate[] = [...templates];
    if (osFilter !== 'all') {
      list = list.filter((t) => (t.icon ?? 'linux') === osFilter);
    }
    if (workloadFilter !== 'all') {
      list = list.filter((t) => t.workloadProfile === workloadFilter);
    }
    if (search.trim()) {
      const q = search.toLowerCase().trim();
      list = list.filter(
        (t) =>
          t.title.toLowerCase().includes(q) ||
          (t.description ?? '').toLowerCase().includes(q) ||
          (t.tags ?? []).some((tag) => tag.toLowerCase().includes(q)),
      );
    }
    return list;
  }, [templates, osFilter, workloadFilter, search]);

  const clearFilters = () => {
    setOsFilter('all');
    setWorkloadFilter('all');
    setSearch('');
  };

  const count = filtered.length;
  const countPhrase = `${count} ${count === 1 ? 'template' : 'templates'} available`;

  return (
    <Stack hasGutter>
      <StackItem>
        <Title id="template-step-heading" headingLevel="h2" size="xl">
          Templates
        </Title>
        <Content component="p" className="pf-v6-u-color-text-subtle osac-wizard-step__intro">
          Select a template to create your virtual machine from
        </Content>
      </StackItem>
      <StackItem>
        <Flex
          direction={{ default: 'column', md: 'row' }}
          flexWrap={{ default: 'wrap' }}
          alignItems={{ default: 'alignItemsFlexStart', md: 'alignItemsFlexEnd' }}
          gap={{ default: 'gapMd' }}
          justifyContent={{ default: 'justifyContentFlexStart' }}
        >
          <FlexItem>
            <FormSelect
              id="template-filter-os"
              value={osFilter}
              onChange={(_e, v) => setOsFilter(v)}
              aria-label="Filter templates by operating system"
            >
              {OS_FILTER_OPTIONS.map((o) => (
                <FormSelectOption key={o.value} value={o.value} label={o.label} />
              ))}
            </FormSelect>
          </FlexItem>
          <FlexItem>
            <FormSelect
              id="template-filter-workload"
              value={workloadFilter}
              onChange={(_e, v) => setWorkloadFilter(v)}
              aria-label="Filter templates by workload"
            >
              {WORKLOAD_FILTER_OPTIONS.map((o) => (
                <FormSelectOption key={o.value} value={o.value} label={o.label} />
              ))}
            </FormSelect>
          </FlexItem>
          <FlexItem>
            <Button variant="link" onClick={clearFilters} isInline>
              Clear filters
            </Button>
          </FlexItem>
          <FlexItem flex={{ default: 'flex_1' }} className="osac-wizard-template__search-item">
            <SearchInput
              placeholder="Search templates…"
              value={search}
              onChange={(_e, v) => setSearch(v)}
              onClear={() => setSearch('')}
              aria-label="Search templates"
            />
          </FlexItem>
        </Flex>
      </StackItem>
      <StackItem>
        <Flex
          gap={{ default: 'gapSm' }}
          flexWrap={{ default: 'wrap' }}
          alignItems={{ default: 'alignItemsBaseline' }}
        >
          <Content component="p" className="osac-wizard-template__count">
            {templatesLoading ? 'Loading templates…' : countPhrase}
          </Content>
          <Content
            component="p"
            className="pf-v6-u-color-text-subtle osac-wizard-template__count-hint"
          >
            Select one to continue.
          </Content>
        </Flex>
      </StackItem>
      {templatesError ? (
        <StackItem>
          <Stack hasGutter>
            <StackItem>
              <Alert variant="danger" title="Could not load templates">
                {templatesErrorDetail instanceof Error
                  ? templatesErrorDetail.message
                  : 'Request failed'}
              </Alert>
            </StackItem>
            <StackItem>
              <Button variant="primary" onClick={() => void refetchTemplates()}>
                Retry
              </Button>
            </StackItem>
          </Stack>
        </StackItem>
      ) : null}
      <StackItem>
        <div
          className="osac-template-cards"
          role="radiogroup"
          aria-labelledby="template-step-heading"
        >
          {templatesLoading ? (
            <Bullseye className="osac-template-cards__loading">
              <Spinner aria-label="Loading templates" />
            </Bullseye>
          ) : null}
          {!templatesLoading && !templatesError && count === 0 ? (
            <Content component="p" className="pf-v6-u-color-text-subtle osac-template-cards__empty">
              No templates match your filters or search. Try clearing filters or changing keywords.
            </Content>
          ) : null}
          {!templatesLoading &&
            !templatesError &&
            filtered.map((tpl) => {
              const selected = state.selectedTemplateId === tpl.id;
              const cores = tpl.defaultCores ?? 2;
              const mem = tpl.defaultMemoryGib ?? 8;
              const diskGib = defaultTemplateBootDiskGib(tpl);
              const profile = tpl.workloadProfile;
              return (
                <div key={tpl.id}>
                  <Card
                    id={`template-card-${tpl.id}`}
                    className="osac-template-cards__card"
                    isCompact
                    isClickable
                    isSelected={selected}
                    onClick={() => applySelectedTemplate(tpl, update)}
                    ouiaId={`template-option-${tpl.id}`}
                  >
                    <CardHeader className="osac-template-cards__card-header">
                      <Flex
                        justifyContent={{ default: 'justifyContentSpaceBetween' }}
                        alignItems={{ default: 'alignItemsFlexStart' }}
                        className="osac-template-cards__card-header-row"
                      >
                        <FlexItem>
                          <GuestOsIcon os={(tpl.icon ?? 'linux') as OsType} size="lg" />
                        </FlexItem>
                        <FlexItem>
                          <Radio
                            id={`template-radio-${tpl.id}`}
                            name="selectedCatalogTemplate"
                            aria-label={tpl.title}
                            isChecked={selected}
                            onChange={() => applySelectedTemplate(tpl, update)}
                          />
                        </FlexItem>
                      </Flex>
                    </CardHeader>
                    <CardBody>
                      <Stack hasGutter>
                        <StackItem>
                          <Content component="h3" className="osac-template-cards__title">
                            {tpl.title}
                          </Content>
                        </StackItem>
                        {tpl.description ? (
                          <StackItem>
                            <Content
                              component="p"
                              className="pf-v6-u-color-text-subtle osac-template-cards__description"
                            >
                              {truncateDescription(tpl.description)}
                            </Content>
                          </StackItem>
                        ) : null}
                        <StackItem>
                          <Content component="p" className="osac-template-cards__specs">
                            {cores} vCPU · {mem} GiB memory · {diskGib} GiB disk
                          </Content>
                        </StackItem>
                        {profile ? (
                          <StackItem>
                            <Label isCompact color="grey">
                              {WORKLOAD_LABELS[profile]}
                            </Label>
                          </StackItem>
                        ) : null}
                      </Stack>
                    </CardBody>
                  </Card>
                </div>
              );
            })}
        </div>
      </StackItem>
    </Stack>
  );
};
