import { Switch } from '@patternfly/react-core';

import { useTranslation } from '../../hooks/useTranslation';

interface CatalogItemPublishToggleProps {
  published: boolean;
  isDisabled?: boolean;
  onChange: (published: boolean) => void;
}

const CatalogItemPublishToggle = ({
  published,
  isDisabled,
  onChange,
}: CatalogItemPublishToggleProps) => {
  const { t } = useTranslation();

  return (
    // Stops the toggle's click from bubbling to an ancestor card's click-to-navigate handler.
    <span onClick={(event) => event.stopPropagation()}>
      <Switch
        label={published ? t('Published') : t('Unpublished')}
        isChecked={published}
        isDisabled={isDisabled}
        onChange={(_event, checked) => onChange(checked)}
      />
    </span>
  );
};

export default CatalogItemPublishToggle;
