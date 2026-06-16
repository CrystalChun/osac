import { type JsonValue, fromJson } from '@bufbuild/protobuf';

import { getErrorMessage } from '../utils/error';

/** Protobuf message schema passed by hooks to decode JSON API responses. */
export type FulfillmentDecodeSchema = Parameters<typeof fromJson>[0];

export const decodeFulfillmentResponse = (
  schema: FulfillmentDecodeSchema | undefined,
  data: unknown,
): unknown => {
  if (!schema || data == null) {
    return data;
  }

  if (typeof data !== 'object' || Array.isArray(data)) {
    throw new Error('Invalid response format for protobuf decode');
  }
  try {
    return fromJson(schema, data as JsonValue);
  } catch (error) {
    throw new Error(`Protobuf decode failed: ${getErrorMessage(error)}`);
  }
};
