import { Spinner } from '@patternfly/react-core';

import { useComputeInstanceCatalogItem } from '../../../api/v1/compute-instance-catalog-item';

interface VmDetailsCatalogValueProps {
  catalogItemId?: string;
}

const VmDetailsCatalogValue = ({ catalogItemId }: VmDetailsCatalogValueProps) => {
  const { data, isLoading } = useComputeInstanceCatalogItem(catalogItemId);

  if (!catalogItemId) {
    return '—';
  }

  if (isLoading) {
    return <Spinner size="sm" aria-label="Loading catalog item" />;
  }

  const displayName = data?.title || data?.metadata?.name;
  return displayName ?? catalogItemId;
};

export default VmDetailsCatalogValue;
