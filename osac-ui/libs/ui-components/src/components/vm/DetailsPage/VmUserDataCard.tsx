import { useState } from 'react';
import {
  Card,
  CardBody,
  CardExpandableContent,
  CardHeader,
  CardTitle,
} from '@patternfly/react-core';

import type { ComputeInstance } from '@osac/types';

import { useVmDetailsDisplay } from './useVmDetailsDisplay';
import { useTranslation } from '../../../hooks/useTranslation';

interface VmUserDataCardProps {
  vm: ComputeInstance;
}

const VmUserDataCard = ({ vm }: VmUserDataCardProps) => {
  const { t } = useTranslation();
  const { hasCatalogItem } = useVmDetailsDisplay(vm);
  const [isExpanded, setIsExpanded] = useState(false);
  const userData = vm.spec?.userData?.trim();

  if (!hasCatalogItem || !userData) {
    return null;
  }

  const cardId = 'vm-user-data-card';
  const titleId = 'vm-user-data-card-title';
  const toggleId = 'vm-user-data-toggle';

  return (
    <Card id={cardId} isExpanded={isExpanded}>
      <CardHeader
        onExpand={() => setIsExpanded((current) => !current)}
        toggleButtonProps={{
          id: toggleId,
          'aria-label': isExpanded
            ? t('vm.details.userData.collapse')
            : t('vm.details.userData.expand'),
          'aria-labelledby': `${titleId} ${toggleId}`,
          'aria-expanded': isExpanded,
        }}
      >
        <CardTitle id={titleId}>{t('vm.details.userData.title')}</CardTitle>
      </CardHeader>
      <CardExpandableContent>
        <CardBody>
          <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{userData}</pre>
        </CardBody>
      </CardExpandableContent>
    </Card>
  );
};

export default VmUserDataCard;
