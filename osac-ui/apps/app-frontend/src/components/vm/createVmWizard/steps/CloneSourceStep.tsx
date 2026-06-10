/**
 * flow: create-virtual-machine-wizard
 * step: cvm_wizard_source_clone
 */
import {
  Button,
  Card,
  CardBody,
  CardHeader,
  Content,
  Divider,
  Flex,
  FlexItem,
  Form,
  FormGroup,
  FormSelect,
  FormSelectOption,
  Radio,
  SearchInput,
  Stack,
  StackItem,
  TextInput,
  Title,
} from '@patternfly/react-core';
import type { ComputeInstance } from '@osac/api-contracts/types';
import { VmStatusLabel } from '@osac/ui-components/VmStatusLabel';
import '../../../shared/DetailField.css';
import { useMemo, useState } from 'react';
import { GuestOsIcon } from '../../../shared/GuestOsIcon';
import type { UpdateFn, WizardState } from '../types';

interface CloneSourceStepProps {
  state: WizardState;
  update: UpdateFn;
  search: string;
  setSearch: (s: string) => void;
  vms: ComputeInstance[];
}

const OS_FILTER_OPTIONS = [
  { value: 'all', label: 'All operating systems' },
  { value: 'rhel', label: 'RHEL' },
  { value: 'windows', label: 'Microsoft Windows' },
  { value: 'linux', label: 'Linux' },
] as const;

const STATE_FILTER_OPTIONS = [
  { value: 'all', label: 'All states' },
  { value: 'running', label: 'Running' },
  { value: 'stopped', label: 'Stopped' },
  { value: 'paused', label: 'Paused' },
] as const;

const formatCreatedDate = (value?: string): string => {
  if (!value) {
    return 'Not set';
  }
  const parsed = Date.parse(value);
  if (Number.isNaN(parsed)) {
    return value;
  }
  return new Date(parsed).toLocaleDateString();
};

const ownerFromVm = (vm: ComputeInstance): string => {
  return (
    vm.metadata.labels?.owner ??
    vm.metadata.labels?.createdBy ??
    vm.metadata.labels?.tenant ??
    'Not set'
  );
};

const storageSummary = (vm: ComputeInstance): string => {
  if (vm.spec.bootDisk || vm.spec.additionalDisks?.length) {
    return `Storage configured (${(vm.spec.additionalDisks?.length ?? 0) + (vm.spec.bootDisk ? 1 : 0)} disk(s))`;
  }
  return 'Storage not specified';
};

const DetailField = ({ label, value }: { label: string; value: string }) => {
  return (
    <Stack hasGutter={false}>
      <StackItem>
        <Content component="small" className="osac-detail-field__label">
          {label}
        </Content>
      </StackItem>
      <StackItem>
        <Content component="p" className="osac-detail-field__value">
          {value}
        </Content>
      </StackItem>
    </Stack>
  );
};

const InlineDetailField = ({ label, value }: { label: string; value: string }) => {
  return (
    <Content component="p" className="osac-inline-detail-field">
      <span className="osac-inline-detail-field__label">{label}</span>
      <span className="osac-inline-detail-field__value">{value}</span>
    </Content>
  );
};

export const CloneSourceStep = ({
  state,
  update,
  search,
  setSearch,
  vms,
}: CloneSourceStepProps) => {
  const [osFilter, setOsFilter] = useState<string>('all');
  const [stateFilter, setStateFilter] = useState<string>('all');

  const filtered = useMemo(() => {
    let list = [...vms];
    if (osFilter !== 'all') {
      list = list.filter((vm) => (vm.os ?? 'linux') === osFilter);
    }
    if (stateFilter !== 'all') {
      list = list.filter((vm) => vm.status.state === stateFilter);
    }
    if (search.trim()) {
      const q = search.toLowerCase().trim();
      list = list.filter(
        (vm) =>
          vm.metadata.name.toLowerCase().includes(q) ||
          vm.id.toLowerCase().includes(q) ||
          (vm.os ?? '').toLowerCase().includes(q),
      );
    }
    return list;
  }, [vms, osFilter, stateFilter, search]);

  const clearFilters = () => {
    setOsFilter('all');
    setStateFilter('all');
    setSearch('');
  };

  const countPhrase = `${filtered.length} ${filtered.length === 1 ? 'virtual machine' : 'virtual machines'} available`;

  return (
    <Stack hasGutter>
      <StackItem>
        <Title id="clone-source-heading" headingLevel="h2" size="xl">
          Source virtual machine
        </Title>
        <Content component="p" className="pf-v6-u-color-text-subtle osac-wizard-step__intro">
          Select a virtual machine to clone.
        </Content>
      </StackItem>
      <StackItem>
        <Form>
          <FormGroup label="New VM name" fieldId="clone-new-name" isRequired>
            <TextInput
              id="clone-new-name"
              value={state.cloneNewName}
              onChange={(_e, v) => update('cloneNewName', v)}
              placeholder="Enter a name for the cloned VM"
            />
          </FormGroup>
        </Form>
      </StackItem>
      <StackItem>
        <Flex
          direction={{ default: 'column', md: 'row' }}
          flexWrap={{ default: 'wrap' }}
          alignItems={{ default: 'alignItemsFlexStart', md: 'alignItemsFlexEnd' }}
          gap={{ default: 'gapMd' }}
        >
          <FlexItem>
            <FormSelect
              id="clone-filter-os"
              value={osFilter}
              onChange={(_e, v) => setOsFilter(v)}
              aria-label="Filter source VMs by operating system"
              className="osac-wizard-clone__filter-os"
            >
              {OS_FILTER_OPTIONS.map((o) => (
                <FormSelectOption key={o.value} value={o.value} label={o.label} />
              ))}
            </FormSelect>
          </FlexItem>
          <FlexItem>
            <FormSelect
              id="clone-filter-state"
              value={stateFilter}
              onChange={(_e, v) => setStateFilter(v)}
              aria-label="Filter source VMs by state"
              className="osac-wizard-clone__filter-state"
            >
              {STATE_FILTER_OPTIONS.map((o) => (
                <FormSelectOption key={o.value} value={o.value} label={o.label} />
              ))}
            </FormSelect>
          </FlexItem>
          <FlexItem>
            <Button variant="link" onClick={clearFilters} isInline>
              Clear filters
            </Button>
          </FlexItem>
          <FlexItem flex={{ default: 'flex_1' }} className="osac-wizard-clone__search-item">
            <SearchInput
              id="clone-search"
              placeholder="Search source VMs…"
              value={search}
              onChange={(_e, v) => setSearch(v)}
              onClear={() => setSearch('')}
            />
          </FlexItem>
        </Flex>
      </StackItem>
      <StackItem>
        <Content component="p" className="osac-wizard-clone__count">
          {countPhrase}
        </Content>
      </StackItem>
      <StackItem>
        <div
          className="osac-clone-source-cards"
          role="radiogroup"
          aria-label="Source virtual machines"
        >
          {filtered.length === 0 ? (
            <Content
              component="p"
              className="pf-v6-u-color-text-subtle osac-clone-source-cards__empty"
            >
              No virtual machines match your filters or search.
            </Content>
          ) : null}
          {filtered.map((vm) => {
            const selected = state.cloneSourceVmId === vm.id;
            return (
              <div key={vm.id}>
                <Card
                  id={`clone-source-card-${vm.id}`}
                  className="osac-clone-source-cards__card"
                  isCompact
                  isClickable
                  isSelected={selected}
                  onClick={() => {
                    update('cloneSourceVmId', vm.id);
                    update('cloneNewName', `${vm.metadata.name}-clone`);
                  }}
                >
                  <CardHeader className="osac-clone-source-cards__card-header">
                    <Flex
                      justifyContent={{ default: 'justifyContentSpaceBetween' }}
                      alignItems={{ default: 'alignItemsFlexStart' }}
                      className="osac-clone-source-cards__card-header-row"
                    >
                      <FlexItem>
                        <GuestOsIcon os={vm.os ?? 'linux'} size="lg" />
                      </FlexItem>
                      <FlexItem>
                        <Stack hasGutter={false} className="osac-clone-source-cards__card-actions">
                          <StackItem>
                            <Radio
                              id={`clone-source-radio-${vm.id}`}
                              name="selectedCloneSourceVm"
                              aria-label={vm.metadata.name}
                              isChecked={selected}
                              onChange={() => {
                                update('cloneSourceVmId', vm.id);
                                update('cloneNewName', `${vm.metadata.name}-clone`);
                              }}
                            />
                          </StackItem>
                          <StackItem>
                            <VmStatusLabel state={vm.status.state} />
                          </StackItem>
                        </Stack>
                      </FlexItem>
                    </Flex>
                  </CardHeader>
                  <CardBody>
                    <Stack hasGutter>
                      <StackItem>
                        <Content component="h3" className="osac-clone-source-cards__title">
                          {vm.metadata.name}
                        </Content>
                      </StackItem>
                      <StackItem>
                        <Flex gap={{ default: 'gapLg' }} flexWrap={{ default: 'wrap' }}>
                          <FlexItem>
                            <DetailField
                              label="CPU"
                              value={`${(vm.spec.cores ?? 2).toString()} vCPU`}
                            />
                          </FlexItem>
                          <FlexItem>
                            <DetailField
                              label="Memory"
                              value={`${(vm.spec.memoryGib ?? 4).toString()} GiB`}
                            />
                          </FlexItem>
                          <FlexItem>
                            <DetailField label="Storage" value={storageSummary(vm)} />
                          </FlexItem>
                        </Flex>
                      </StackItem>
                      <StackItem>
                        <Divider component="div" />
                      </StackItem>
                      <StackItem>
                        <Stack hasGutter={false}>
                          <StackItem>
                            <InlineDetailField
                              label="Created"
                              value={formatCreatedDate(vm.metadata.createdAt)}
                            />
                          </StackItem>
                          <StackItem>
                            <InlineDetailField label="Owner" value={ownerFromVm(vm)} />
                          </StackItem>
                        </Stack>
                      </StackItem>
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
