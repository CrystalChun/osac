import { Label } from '@patternfly/react-core';

import { useTranslation } from '../../hooks/useTranslation';
import type { CatalogItemScope } from '../catalog/catalogItemDisplay';

interface CatalogItemScopeBadgeProps {
  scope: CatalogItemScope;
}

const CatalogItemScopeBadge = ({ scope }: CatalogItemScopeBadgeProps) => {
  const { t } = useTranslation();

  switch (scope.level) {
    case 'general':
      return <Label color="blue">{t('General')}</Label>;
    case 'organization':
      return (
        <Label color="purple">
          {scope.name ? t('Organization: {{name}}', { name: scope.name }) : t('Organization')}
        </Label>
      );
    case 'project':
      return <Label color="teal">{t('Project: {{name}}', { name: scope.name })}</Label>;
    default: {
      const exhaustiveCheck: never = scope;
      return exhaustiveCheck;
    }
  }
};

export default CatalogItemScopeBadge;
