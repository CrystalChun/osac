import { MessageInitShape } from '@bufbuild/protobuf';

import { BareMetalInstanceRunStrategy, BareMetalInstanceSchema } from '@osac/types';

import type { BareMetalInstanceWizardValues } from './fields';

export const buildBareMetalInstanceCreatePayload = (
  values: BareMetalInstanceWizardValues,
): MessageInitShape<typeof BareMetalInstanceSchema> => {
  const sshKey = values.spec.sshKey.trim();
  const userData = values.spec.userData.trim();

  const bmi = {
    metadata: { name: values.metadata.name.trim() },
    spec: {
      catalogItem: values.catalogItemId,
      runStrategy: BareMetalInstanceRunStrategy.ALWAYS,
      ...(sshKey && { sshPublicKey: sshKey }),
      ...(userData && { userData }),
    },
  };

  return bmi;
};
