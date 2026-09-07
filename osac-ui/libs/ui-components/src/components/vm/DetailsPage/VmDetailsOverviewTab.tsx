import { Alert, Card, CardBody, CardTitle, Grid, GridItem } from '@patternfly/react-core';

import type { ComputeInstance } from '@osac/types';

import VmDetailsCard from './VmDetailsCard';
import VmStorageCard from './VmStorageCard';
import VmUserDataCard from './VmUserDataCard';
import { useStorageTiers } from '../../../api/v1/storage-tiers';
import { useTranslation } from '../../../hooks/useTranslation';
import { getErrorMessage } from '../../../utils/error';
import { getVmStorageRows } from '../../catalogProvision/wizard/storageRows';
import { ResourceConditionsTable } from '../../Resource/ResourceConditionsTable';

interface Props {
  vm: ComputeInstance;
}

const VmDetailsOverviewTab = ({ vm }: Props) => {
  const { t } = useTranslation();
  const {
    data: storageTiers = [],
    isLoading: isStorageTiersLoading,
    error: storageTiersError,
  } = useStorageTiers();
  const storageRows = getVmStorageRows(
    t,
    vm.spec?.bootDisk,
    vm.spec?.additionalDisks,
    storageTiers,
  );
  const conditions = vm.status?.conditions ?? [];

  return (
    <Grid hasGutter>
      {storageTiersError ? (
        <GridItem span={12}>
          <Alert variant="danger" isInline title={t('Failed to fetch storage tiers')}>
            {getErrorMessage(storageTiersError)}
          </Alert>
        </GridItem>
      ) : null}
      <GridItem md={6}>
        <VmDetailsCard
          vm={vm}
          storageRows={storageRows}
          isStorageTiersLoading={isStorageTiersLoading}
        />
      </GridItem>
      <GridItem md={6}>
        <Card isFullHeight>
          <CardTitle>{t('Conditions')}</CardTitle>
          <CardBody>
            <ResourceConditionsTable
              ariaLabel={t('Virtual machine conditions')}
              conditions={conditions}
              conditionResourceKind="compute_instance"
            />
          </CardBody>
        </Card>
      </GridItem>
      <GridItem span={12}>
        <VmStorageCard storageRows={storageRows} isStorageTiersLoading={isStorageTiersLoading} />
      </GridItem>
      <GridItem span={12}>
        <VmUserDataCard vm={vm} />
      </GridItem>
    </Grid>
  );
};

export default VmDetailsOverviewTab;
