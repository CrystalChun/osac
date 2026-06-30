import { useState } from 'react';
import { Button, DescriptionListDescription } from '@patternfly/react-core';
import EyeIcon from '@patternfly/react-icons/dist/esm/icons/eye-icon';
import EyeSlashIcon from '@patternfly/react-icons/dist/esm/icons/eye-slash-icon';

import { useTranslation } from '../../../hooks/useTranslation';
import { formatReviewScalar } from '../../catalogProvision/wizard/catalogOverlay';

interface VmUserDataFieldProps {
  value?: string;
}

export const VmUserDataField = ({ value }: VmUserDataFieldProps) => {
  const { t } = useTranslation();
  const [visible, setVisible] = useState(false);
  const trimmed = value?.trim();

  if (!trimmed) {
    return <DescriptionListDescription>—</DescriptionListDescription>;
  }

  return (
    <DescriptionListDescription>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
        {visible ? (
          <pre style={{ margin: 0, whiteSpace: 'pre-wrap', flex: 1 }}>{trimmed}</pre>
        ) : (
          <span>{formatReviewScalar(trimmed, true)}</span>
        )}
        <Button
          variant="plain"
          aria-label={visible ? t('vm.details.userData.hide') : t('vm.details.userData.show')}
          aria-pressed={visible}
          onClick={() => setVisible((current) => !current)}
          icon={visible ? <EyeSlashIcon aria-hidden /> : <EyeIcon aria-hidden />}
        />
      </div>
    </DescriptionListDescription>
  );
};
