import type { DiskImage } from '@osac/types';
import DeleteResourceModal from '@osac/ui-components/components/Resource/DeleteResourceModal.tsx';

import { useDeleteDiskImage } from '../../api/v1/disk-image';
import { useTranslation } from '../../hooks/useTranslation';
import { getErrorMessage } from '../../utils/error';
import { useToast } from '../Toast/useToast';

interface DiskImageDeleteConfirmModalProps {
  diskImage: DiskImage;
  onClose: () => void;
  onSuccess: () => void;
}

const DiskImageDeleteConfirmModal = ({
  diskImage,
  onClose,
  onSuccess,
}: DiskImageDeleteConfirmModalProps) => {
  const { t } = useTranslation();
  const { addToast } = useToast();
  const deleteDiskImage = useDeleteDiskImage();
  const name = diskImage.metadata?.name ?? diskImage.id;

  const mutation = {
    ...deleteDiskImage,
    mutate: (
      variables: string,
      options?: { onSuccess?: () => void; onError?: (error: Error) => void },
    ) =>
      deleteDiskImage.mutate(variables, {
        ...options,
        onError: (error) => {
          addToast({
            variant: 'danger',
            title: t('Failed to delete disk image'),
            description: getErrorMessage(error),
          });
          options?.onError?.(error);
        },
      }),
  };

  return (
    <DeleteResourceModal
      resourceName={name}
      label={t('This permanently deletes the disk image. This action cannot be undone.')}
      errorLabel={t('Failed to delete disk image')}
      onClose={onClose}
      onSuccess={onSuccess}
      mutation={mutation}
      variables={diskImage.id}
    />
  );
};

export default DiskImageDeleteConfirmModal;
