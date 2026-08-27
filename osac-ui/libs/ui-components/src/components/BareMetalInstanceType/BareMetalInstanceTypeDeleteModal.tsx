import type { BareMetalInstanceType as PrivateBareMetalInstanceType } from '@osac/types/private';

import { useDeleteBareMetalInstanceType } from '../../api/v1/private/baremetal-instance-type';
import { useTranslation } from '../../hooks/useTranslation';
import DeleteResourceModal from '../Resource/DeleteResourceModal';

interface BareMetalInstanceTypeDeleteModalProps {
  bareMetalInstanceType: PrivateBareMetalInstanceType;
  onClose: VoidFunction;
  onSuccess: VoidFunction;
}

const BareMetalInstanceTypeDeleteModal = ({
  bareMetalInstanceType,
  onClose,
  onSuccess,
}: BareMetalInstanceTypeDeleteModalProps) => {
  const { mutateAsync: deleteBareMetalInstanceType } = useDeleteBareMetalInstanceType();
  const { t } = useTranslation();
  return (
    <DeleteResourceModal
      resourceName={bareMetalInstanceType.metadata?.name || bareMetalInstanceType.id}
      onDelete={() => deleteBareMetalInstanceType(bareMetalInstanceType.id)}
      label={t(
        'This permanently deletes the bare metal instance type. This action cannot be undone.',
      )}
      errorLabel={t('Failed to delete bare metal instance type')}
      onClose={onClose}
      onSuccess={onSuccess}
    />
  );
};

export default BareMetalInstanceTypeDeleteModal;
