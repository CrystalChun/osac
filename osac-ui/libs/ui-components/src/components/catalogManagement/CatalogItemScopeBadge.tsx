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
      // Guards against a future scope level being added without updating this switch — TS flags the
      // assignment below at compile time, while runtime still renders a safe fallback instead of crashing.
      const exhaustiveCheck: never = scope;
      void exhaustiveCheck;
      return <Label color="grey">{t('Unknown')}</Label>;
    }
  }
};

export default CatalogItemScopeBadge;
