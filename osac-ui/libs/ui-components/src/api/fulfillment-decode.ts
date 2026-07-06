import { type JsonValue, createRegistry, fromJson } from '@bufbuild/protobuf';
import {
  file_google_protobuf_duration,
  file_google_protobuf_struct,
  file_google_protobuf_timestamp,
  file_google_protobuf_wrappers,
} from '@bufbuild/protobuf/wkt';

import { getErrorMessage } from '../utils/error';

/** Protobuf message schema passed by hooks to decode JSON API responses. */
export type FulfillmentDecodeSchema = Parameters<typeof fromJson>[0];

/**
 * Registry for unpacking `google.protobuf.Any` values in API responses.
 * ComputeInstance `template_parameters` (and similar maps) embed wrapper types
 * such as StringValue that are not part of the OSAC generated schemas.
 */
const fulfillmentDecodeRegistry = createRegistry(
  file_google_protobuf_wrappers,
  file_google_protobuf_timestamp,
  file_google_protobuf_duration,
  file_google_protobuf_struct,
);

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
    return fromJson(schema, data as JsonValue, {
      registry: fulfillmentDecodeRegistry,
      // Tolerate extra JSON keys from mocks or newer API fields before types are regenerated.
      ignoreUnknownFields: true,
    });
  } catch (error) {
    throw new Error(`Protobuf decode failed: ${getErrorMessage(error)}`);
  }
};
