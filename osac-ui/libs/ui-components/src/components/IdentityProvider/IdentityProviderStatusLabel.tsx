import type { TFunction } from 'i18next';

import { IdentityProviderPhase } from '@osac/types';

import {
  ResourceStatusLabel,
  StatusLabelProps,
} from '../../components/Resource/ResourceStatusLabel';
import { useTranslation } from '../../hooks/useTranslation';

interface IdentityProviderStatusLabelProps {
  phase?: IdentityProviderPhase;
}

const identityProviderPhaseMap = (
  t: TFunction,
): Record<IdentityProviderPhase, StatusLabelProps> => ({
  [IdentityProviderPhase.READY]: {
    status: 'ready',
    text: t('Ready'),
  },
  [IdentityProviderPhase.ERROR]: {
    status: 'failed',
    text: t('Error'),
  },
  [IdentityProviderPhase.UNKNOWN]: {
    status: 'unspecified',
    text: t('Unknown'),
  },
  [IdentityProviderPhase.UNSPECIFIED]: {
    status: 'unspecified',
    text: t('Unspecified'),
  },
});

const IdentityProviderStatusLabel = ({ phase }: IdentityProviderStatusLabelProps) => {
  const { t } = useTranslation();

  const phaseMap = identityProviderPhaseMap(t);

  const status =
    phase !== undefined ? phaseMap[phase] : phaseMap[IdentityProviderPhase.UNSPECIFIED];

  return <ResourceStatusLabel {...status} />;
};

export default IdentityProviderStatusLabel;
