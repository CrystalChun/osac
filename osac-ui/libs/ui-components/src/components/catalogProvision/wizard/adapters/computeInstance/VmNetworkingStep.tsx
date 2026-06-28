import { useEffect, useMemo, useRef } from 'react';
import { Alert, Button, Stack, StackItem } from '@patternfly/react-core';
import { useFormikContext } from 'formik';

import type { ComputeInstanceCatalogItem } from '@osac/types';

import type { ComputeInstanceWizardValues } from './fields';
import {
  resourceDisplayName,
  useSecurityGroups,
  useSubnets,
  useVirtualNetworks,
  virtualNetworkFilterForSubnetList,
} from '../../../../../api/v1/networking';
import { useTranslation } from '../../../../../hooks/useTranslation';
import OsacForm from '../../../../Form/OsacForm';
import { MultiSelectField } from '../../../../Form/MultiSelectField';
import { SelectField } from '../../../../Form/SelectField';

interface Props {
  catalogItem: ComputeInstanceCatalogItem | null;
}

export const VmNetworkingStep = ({ catalogItem }: Props) => {
  const { t } = useTranslation();
  const { values, setFieldValue } = useFormikContext<ComputeInstanceWizardValues>();
  const virtualNetworkId = values.spec.networking.virtualNetworkId;

  const {
    data: virtualNetworks = [],
    isPending: virtualNetworksLoading,
    isError: virtualNetworksError,
    refetch: refetchVirtualNetworks,
  } = useVirtualNetworks();

  const subnetFilter = virtualNetworkId
    ? virtualNetworkFilterForSubnetList(virtualNetworkId)
    : undefined;
  const securityGroupFilter = subnetFilter;

  const {
    data: subnets = [],
    isPending: subnetsLoading,
    isError: subnetsError,
    refetch: refetchSubnets,
  } = useSubnets(subnetFilter ? { filter: subnetFilter } : {}, { enabled: Boolean(virtualNetworkId) });

  const {
    data: securityGroups = [],
    isPending: securityGroupsLoading,
    isError: securityGroupsError,
    refetch: refetchSecurityGroups,
  } = useSecurityGroups(securityGroupFilter ? { filter: securityGroupFilter } : {}, {
    enabled: Boolean(virtualNetworkId),
  });

  const virtualNetworkOptions = useMemo(
    () =>
      virtualNetworks.map((vn) => ({
        value: vn.id,
        label: resourceDisplayName(vn.metadata, vn.id),
      })),
    [virtualNetworks],
  );

  const subnetOptions = useMemo(
    () =>
      subnets.map((subnet) => ({
        value: subnet.id,
        label: resourceDisplayName(subnet.metadata, subnet.id),
      })),
    [subnets],
  );

  const securityGroupOptions = useMemo(
    () =>
      securityGroups.map((group) => ({
        value: group.id,
        label: resourceDisplayName(group.metadata, group.id),
      })),
    [securityGroups],
  );

  const previousVirtualNetworkIdRef = useRef(virtualNetworkId);

  useEffect(() => {
    if (virtualNetworkOptions.length === 1 && !virtualNetworkId) {
      void setFieldValue('spec.networking.virtualNetworkId', virtualNetworkOptions[0].value);
    }
  }, [setFieldValue, virtualNetworkId, virtualNetworkOptions]);

  useEffect(() => {
    if (!virtualNetworkId) {
      return;
    }
    if (subnetOptions.length === 1 && !values.spec.networking.subnetId) {
      void setFieldValue('spec.networking.subnetId', subnetOptions[0].value);
    }
  }, [setFieldValue, subnetOptions, values.spec.networking.subnetId, virtualNetworkId]);

  useEffect(() => {
    if (!virtualNetworkId) {
      return;
    }
    if (securityGroupOptions.length === 1 && values.spec.networking.securityGroupIds.length === 0) {
      void setFieldValue('spec.networking.securityGroupIds', [securityGroupOptions[0].value]);
    }
  }, [
    securityGroupOptions,
    setFieldValue,
    values.spec.networking.securityGroupIds.length,
    virtualNetworkId,
  ]);

  useEffect(() => {
    const previous = previousVirtualNetworkIdRef.current;
    previousVirtualNetworkIdRef.current = virtualNetworkId;
    if (previous && previous !== virtualNetworkId) {
      void setFieldValue('spec.networking.subnetId', '');
      void setFieldValue('spec.networking.securityGroupIds', []);
    }
  }, [setFieldValue, virtualNetworkId]);

  if (!catalogItem) {
    return null;
  }

  const listError = virtualNetworksError || subnetsError || securityGroupsError;
  const loadingPlaceholder = t('catalogProvision.common.loading');
  const subnetListLoading = Boolean(virtualNetworkId) && subnetsLoading;
  const securityGroupListLoading = Boolean(virtualNetworkId) && securityGroupsLoading;

  return (
    <Stack hasGutter>
      {listError ? (
        <StackItem>
          <Alert variant="danger" isInline title={t('catalogProvision.networking.loadError')}>
            <Button variant="link" isInline onClick={() => {
              void refetchVirtualNetworks();
              void refetchSubnets();
              void refetchSecurityGroups();
            }}>
              {t('catalogProvision.actions.retry')}
            </Button>
          </Alert>
        </StackItem>
      ) : null}
      <StackItem>
        <OsacForm>
          <SelectField
            name="spec.networking.virtualNetworkId"
            label={t('catalogProvision.vm.fields.virtualNetwork')}
            fieldId="vm-virtual-network"
            isRequired
            isLoading={virtualNetworksLoading}
            isDisabled={virtualNetworksLoading}
            loadingPlaceholder={loadingPlaceholder}
            placeholder={t('catalogProvision.vm.placeholders.selectVirtualNetwork')}
            options={virtualNetworkOptions}
          />
          <SelectField
            name="spec.networking.subnetId"
            label={t('catalogProvision.vm.fields.subnet')}
            fieldId="vm-subnet"
            isRequired
            isLoading={subnetListLoading}
            isDisabled={!virtualNetworkId || subnetListLoading}
            loadingPlaceholder={loadingPlaceholder}
            placeholder={t('catalogProvision.vm.placeholders.selectSubnet')}
            options={subnetOptions}
          />
          <MultiSelectField
            name="spec.networking.securityGroupIds"
            label={t('catalogProvision.vm.fields.securityGroup')}
            fieldId="vm-security-group"
            isRequired
            isLoading={securityGroupListLoading}
            isDisabled={!virtualNetworkId || securityGroupListLoading}
            loadingPlaceholder={loadingPlaceholder}
            placeholder={t('catalogProvision.vm.placeholders.selectSecurityGroup')}
            options={securityGroupOptions}
          />
        </OsacForm>
      </StackItem>
    </Stack>
  );
};
