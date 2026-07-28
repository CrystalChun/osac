import { Label } from '@patternfly/react-core';

import { useTranslation } from '../../hooks/useTranslation';

interface CatalogItemStatusLabelProps {
  published: boolean;
}

const CatalogItemStatusLabel = ({ published }: CatalogItemStatusLabelProps) => {
  const { t } = useTranslation();

  return published ? (
    <Label color="green">{t('Published')}</Label>
  ) : (
    <Label color="grey">{t('Unpublished')}</Label>
  );
};

export default CatalogItemStatusLabel;
