import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Button,
  Checkbox,
  MenuToggle,
  SearchInput,
  Select,
  SelectList,
  SelectOption,
  Toolbar,
  ToolbarContent,
  ToolbarGroup,
  ToolbarItem,
} from '@patternfly/react-core';

import { Architecture, DiskImageLifecycle, GuestOSFamily } from '@osac/types';

import DiskImageTable from './DiskImageTable';
import { buildDiskImageListFilter, useDiskImages } from '../../api/v1/disk-image';
import { useTranslation } from '../../hooks/useTranslation';
import ListPage from '../Page/ListPage';
import ListPageBody from '../Page/ListPageBody';

type SelectOptionValue = string | number;

const ALL_OPTION_VALUE = '__all__';

interface FilterOption {
  value: SelectOptionValue;
  label: string;
}

interface SingleSelectFilterProps {
  label: string;
  allLabel: string;
  options: FilterOption[];
  selected: SelectOptionValue | undefined;
  onChange: (value: SelectOptionValue | undefined) => void;
}

const SingleSelectFilter = ({
  label,
  allLabel,
  options,
  selected,
  onChange,
}: SingleSelectFilterProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const selectedLabel = options.find((option) => option.value === selected)?.label ?? allLabel;

  return (
    <Select
      isOpen={isOpen}
      onOpenChange={setIsOpen}
      onSelect={(_event, value: SelectOptionValue) => {
        onChange(value === ALL_OPTION_VALUE ? undefined : value);
        setIsOpen(false);
      }}
      toggle={(toggleRef) => (
        <MenuToggle ref={toggleRef} onClick={() => setIsOpen((open) => !open)} isExpanded={isOpen}>
          {`${label}: ${selectedLabel}`}
        </MenuToggle>
      )}
    >
      <SelectList>
        <SelectOption value={ALL_OPTION_VALUE} isSelected={selected === undefined}>
          {allLabel}
        </SelectOption>
        {options.map((option) => (
          <SelectOption
            key={option.value}
            value={option.value}
            isSelected={selected === option.value}
          >
            {option.label}
          </SelectOption>
        ))}
      </SelectList>
    </Select>
  );
};

interface MultiSelectFilterProps {
  label: string;
  options: FilterOption[];
  selected: SelectOptionValue[];
  onChange: (values: SelectOptionValue[]) => void;
}

const MultiSelectFilter = ({ label, options, selected, onChange }: MultiSelectFilterProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const toggleLabel = selected.length ? `${label} (${selected.length})` : label;

  return (
    <Select
      role="menu"
      isOpen={isOpen}
      onOpenChange={setIsOpen}
      onSelect={(_event, value: SelectOptionValue | undefined) => {
        if (value === undefined) {
          return;
        }
        onChange(
          selected.includes(value) ? selected.filter((v) => v !== value) : [...selected, value],
        );
      }}
      toggle={(toggleRef) => (
        <MenuToggle ref={toggleRef} onClick={() => setIsOpen((open) => !open)} isExpanded={isOpen}>
          {toggleLabel}
        </MenuToggle>
      )}
    >
      <SelectList>
        {options.map((option) => (
          <SelectOption
            key={option.value}
            value={option.value}
            hasCheckbox
            isSelected={selected.includes(option.value)}
          >
            {option.label}
          </SelectOption>
        ))}
      </SelectList>
    </Select>
  );
};

const DiskImageListPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [search, setSearch] = useState('');
  const [guestOsFamily, setGuestOsFamily] = useState<GuestOSFamily>();
  const [architecture, setArchitecture] = useState<Architecture[]>([]);
  const [lifecycle, setLifecycle] = useState<DiskImageLifecycle[]>([]);
  const [showObsolete, setShowObsolete] = useState(false);
  const [scope, setScope] = useState<'global' | 'tenant'>();

  const filter = useMemo(
    () =>
      buildDiskImageListFilter({
        search,
        guestOsFamily,
        architecture,
        lifecycle,
        showObsolete,
        scope,
      }),
    [search, guestOsFamily, architecture, lifecycle, showObsolete, scope],
  );

  const { data: diskImages = [], isLoading, error } = useDiskImages({ filter });

  const guestOsFamilyOptions: FilterOption[] = [
    { value: GuestOSFamily.GUEST_OS_FAMILY_LINUX, label: t('Linux') },
    { value: GuestOSFamily.GUEST_OS_FAMILY_WINDOWS, label: t('Windows') },
  ];
  const architectureOptions: FilterOption[] = [
    { value: Architecture.AMD64, label: 'amd64' },
    { value: Architecture.ARM64, label: 'arm64' },
    { value: Architecture.S390X, label: 's390x' },
  ];
  const lifecycleOptions: FilterOption[] = [
    { value: DiskImageLifecycle.AVAILABLE, label: t('Available') },
    { value: DiskImageLifecycle.DEPRECATED, label: t('Deprecated') },
  ];
  const scopeOptions: FilterOption[] = [
    { value: 'global', label: t('Global') },
    { value: 'tenant', label: t('Tenant') },
  ];

  return (
    <ListPage
      title={t('Disk images')}
      description={t('Manage disk images available for provisioning virtual machines.')}
      error={error}
      actions={
        <Button
          variant="primary"
          onClick={() => navigate('/admin/infrastructure/disk-images/create')}
        >
          {t('Create disk image')}
        </Button>
      }
    >
      <ListPageBody isLoading={isLoading} error={error}>
        <Toolbar>
          <ToolbarContent>
            <ToolbarGroup>
              <ToolbarItem>
                <SearchInput
                  placeholder={t('Search disk images by name…')}
                  value={search}
                  onChange={(_event, value) => setSearch(value)}
                  onClear={() => setSearch('')}
                  aria-label={t('Search disk images')}
                />
              </ToolbarItem>
              <ToolbarItem>
                <SingleSelectFilter
                  label={t('Guest OS family')}
                  allLabel={t('All guest OS families')}
                  options={guestOsFamilyOptions}
                  selected={guestOsFamily}
                  onChange={(value) => setGuestOsFamily(value as GuestOSFamily | undefined)}
                />
              </ToolbarItem>
              <ToolbarItem>
                <MultiSelectFilter
                  label={t('Architecture')}
                  options={architectureOptions}
                  selected={architecture}
                  onChange={(values) => setArchitecture(values as Architecture[])}
                />
              </ToolbarItem>
              <ToolbarItem>
                <MultiSelectFilter
                  label={t('Lifecycle')}
                  options={lifecycleOptions}
                  selected={lifecycle}
                  onChange={(values) => setLifecycle(values as DiskImageLifecycle[])}
                />
              </ToolbarItem>
              <ToolbarItem>
                <SingleSelectFilter
                  label={t('Scope')}
                  allLabel={t('All scopes')}
                  options={scopeOptions}
                  selected={scope}
                  onChange={(value) => setScope(value as 'global' | 'tenant' | undefined)}
                />
              </ToolbarItem>
              <ToolbarItem>
                <Checkbox
                  id="disk-image-show-obsolete"
                  label={t('Show obsolete')}
                  isChecked={showObsolete}
                  onChange={(_event, checked) => setShowObsolete(checked)}
                />
              </ToolbarItem>
            </ToolbarGroup>
          </ToolbarContent>
        </Toolbar>
        <DiskImageTable diskImages={diskImages} />
      </ListPageBody>
    </ListPage>
  );
};

export default DiskImageListPage;
