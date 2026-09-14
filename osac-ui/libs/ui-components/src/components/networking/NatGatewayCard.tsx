import {
  Button,
  Card,
  CardBody,
  CardHeader,
  CardTitle,
  Content,
  DescriptionList,
  DescriptionListDescription,
  DescriptionListGroup,
  DescriptionListTerm,
  Divider,
} from '@patternfly/react-core';
import { PlusCircleIcon } from '@patternfly/react-icons/dist/esm/icons/plus-circle-icon';

import { type NATGateway, NATGatewayState } from '@osac/types';

import { NatGatewayStatusLabel } from './NatGatewayStatusLabel';
import { useTranslation } from '../../hooks/useTranslation';
import { Timestamp } from '../Primitives/Timestamp';

export interface NatGatewayCardProps {
  natAddress?: string;
  natGateway?: NATGateway;
  onAttach: () => void;
  onDetach: (natGateway: NATGateway) => void;
}

const NatGatewayCard = ({ natAddress, natGateway, onAttach, onDetach }: NatGatewayCardProps) => {
  const { t } = useTranslation();
  const isDeleting = natGateway?.status?.state === NATGatewayState.NAT_GATEWAY_STATE_DELETING;

  return (
    <Card variant="secondary">
      <CardHeader
        actions={{
          actions: natGateway ? (
            <Button
              variant="link"
              isInline
              onClick={() => onDetach(natGateway)}
              isDisabled={isDeleting}
            >
              {t('Detach')}
            </Button>
          ) : (
            <Button variant="link" isInline icon={<PlusCircleIcon />} onClick={onAttach}>
              {t('Attach')}
            </Button>
          ),
        }}
      >
        <CardTitle>{t('NAT gateway')}</CardTitle>
      </CardHeader>
      <Divider />
      <CardBody>
        {natGateway ? (
          <DescriptionList isCompact aria-label={t('Attached NAT gateway')}>
            <DescriptionListGroup>
              <DescriptionListTerm>{t('Status')}</DescriptionListTerm>
              <DescriptionListDescription>
                <NatGatewayStatusLabel state={natGateway.status?.state} />
              </DescriptionListDescription>
            </DescriptionListGroup>
            <DescriptionListGroup>
              <DescriptionListTerm>{t('Name')}</DescriptionListTerm>
              <DescriptionListDescription>
                {natGateway.metadata?.name ?? natGateway.id}
              </DescriptionListDescription>
            </DescriptionListGroup>
            <DescriptionListGroup>
              <DescriptionListTerm>{t('Public IP')}</DescriptionListTerm>
              <DescriptionListDescription>
                <code>{natAddress ?? '—'}</code>
              </DescriptionListDescription>
            </DescriptionListGroup>
            <DescriptionListGroup>
              <DescriptionListTerm>{t('Attached')}</DescriptionListTerm>
              <DescriptionListDescription>
                <Timestamp value={natGateway.metadata?.creationTimestamp} />
              </DescriptionListDescription>
            </DescriptionListGroup>
          </DescriptionList>
        ) : (
          <Content component="p">{t('No NAT gateway attached to this virtual network.')}</Content>
        )}
      </CardBody>
    </Card>
  );
};

export default NatGatewayCard;
