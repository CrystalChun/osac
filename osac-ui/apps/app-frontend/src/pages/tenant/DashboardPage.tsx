/**
 * flow: tenant-user-dashboard
 * step: tud_dashboard_home
 */
import { useCallback, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Button,
  Card,
  CardBody,
  CardHeader,
  CardTitle,
  Content,
  Gallery,
  GalleryItem,
  PageSection,
  Title,
} from '@patternfly/react-core';
import type { ComputeInstance, VmPowerState } from '@osac/api-contracts/types';
import type { CreateVmWizardHandle, DeploymentMode } from '../../components/vm/CreateVmWizard';
import { CreateVmWizard } from '../../components/vm/CreateVmWizard';
import { PageHeader } from '../../components/layout/PageHeader';
import '../../components/dashboard/DashboardVmStatCard.css';
import './DashboardPage.css';
import { useSession } from '../../contexts/SessionContext';
import { useComputeInstances, useProvisionVm } from '../../api/hooks';

type StatValueTone = 'default' | 'running' | 'paused' | 'stopped';

interface StatCard {
  key: string;
  label: string;
  value: number;
  valueTone: StatValueTone;
  caption: string;
  powerFilter: VmPowerState | null;
}

export const DashboardPage = () => {
  const navigate = useNavigate();
  const { username } = useSession();
  const wizardRef = useRef<CreateVmWizardHandle>(null);
  const { data: vms = [] } = useComputeInstances();
  const provisionVm = useProvisionVm();

  const handleWizardProvision = useCallback(
    async (vm: Partial<ComputeInstance>, meta: { mode: DeploymentMode }) => {
      await provisionVm.mutateAsync({ vm, specCatalogItemOnly: meta.mode === 'template' });
    },
    [provisionVm],
  );

  const displayName = username?.trim() || 'there';

  const powerCounts = useMemo(() => {
    let running = 0;
    let paused = 0;
    let stopped = 0;
    for (const v of vms) {
      const s = v.status.state;
      if (s === 'running') {
        running++;
      } else if (s === 'paused') {
        paused++;
      } else if (s === 'stopped') {
        stopped++;
      }
    }
    return { running, paused, stopped, all: vms.length };
  }, [vms]);

  const stats: StatCard[] = [
    {
      key: 'all-vms',
      label: 'All VMs',
      value: powerCounts.all,
      valueTone: 'default',
      caption: 'Total VMs across your workspaces',
      powerFilter: null,
    },
    {
      key: 'running',
      label: 'Running',
      value: powerCounts.running,
      valueTone: 'running',
      caption: 'On and ready for workloads',
      powerFilter: 'running',
    },
    {
      key: 'paused',
      label: 'Paused',
      value: powerCounts.paused,
      valueTone: 'paused',
      caption: 'Suspended with memory and disks retained',
      powerFilter: 'paused',
    },
    {
      key: 'stopped',
      label: 'Stopped',
      value: powerCounts.stopped,
      valueTone: 'stopped',
      caption: 'Powered off — storage may still incur cost',
      powerFilter: 'stopped',
    },
  ];

  const handleStatCardClick = useCallback(
    (powerFilter: VmPowerState | null) => {
      const path = powerFilter ? `/vms?power=${powerFilter}` : '/vms';
      navigate(path);
    },
    [navigate],
  );

  const handleOpenCreateVm = useCallback(() => {
    wizardRef.current?.open();
  }, []);

  return (
    <PageSection isFilled>
      <CreateVmWizard ref={wizardRef} existingVms={vms} onProvision={handleWizardProvision} />

      <PageHeader
        title={`Welcome, ${displayName}`}
        description="This workspace is for VM as a Service — create, run, and manage virtual machines."
        descriptionWidth="medium"
        actions={
          <Button variant="primary" onClick={handleOpenCreateVm}>
            Create virtual machine
          </Button>
        }
      />

      <Gallery hasGutter className="osac-dashboard-vm-stats-grid">
        {stats.map((stat) => (
          <GalleryItem key={stat.key}>
            <Card
              isClickable
              isFullHeight
              component="article"
              className="osac-dashboard-vm-stat-card"
            >
              <CardHeader
                selectableActions={{
                  onClickAction: () => handleStatCardClick(stat.powerFilter),
                  selectableActionAriaLabel: `${stat.label}, ${stat.value}. ${stat.caption}`,
                }}
              >
                <CardTitle component="h2" className="osac-dashboard-stat__title">
                  {stat.label}
                </CardTitle>
              </CardHeader>
              <CardBody>
                <Title
                  headingLevel="h3"
                  size="4xl"
                  className={`osac-dashboard-stat__value osac-dashboard-stat__value--${stat.valueTone}`}
                >
                  {stat.value}
                </Title>
                <Content component="p" className="osac-dashboard-stat__caption">
                  {stat.caption}
                </Content>
              </CardBody>
            </Card>
          </GalleryItem>
        ))}
      </Gallery>
    </PageSection>
  );
};
