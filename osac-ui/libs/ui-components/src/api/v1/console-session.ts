import { type MessageInitShape } from '@bufbuild/protobuf';
import { useMutation } from '@tanstack/react-query';

import {
  ConsoleResourceType,
  ConsoleSessionSchema,
  ConsoleSessions,
  ConsoleType,
} from '@osac/types';

import type { VmConsoleType } from '../../components/vm/console/console.types';
import { useApiFetch } from '../api-context';

export const buildConsoleSessionRequest = (
  vmId: string,
  consoleType: VmConsoleType,
  clientId: string,
): MessageInitShape<typeof ConsoleSessionSchema> => ({
  resourceType: ConsoleResourceType.COMPUTE_INSTANCE,
  resourceId: vmId,
  type: consoleType === 'serial' ? ConsoleType.SERIAL : ConsoleType.VNC,
  clientId,
});

export const useCreateConsoleSession = () => {
  const client = useApiFetch(ConsoleSessions);
  return useMutation({
    mutationFn: async (session: MessageInitShape<typeof ConsoleSessionSchema>) => {
      const response = await client.create({ object: session });
      if (!response.object) {
        throw new Error('Console session was not returned');
      }
      return response.object;
    },
  });
};
