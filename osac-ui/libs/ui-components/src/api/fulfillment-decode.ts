import { type JsonValue, fromJson } from '@bufbuild/protobuf';

import { ClusterSchema, ClustersListResponseSchema } from '@osac/types';

/** TEMP: decode cluster responses when `decode` is set on the fetch call. */
export const decodeFulfillmentResponse = (
  decode: boolean | undefined,
  pathParams: (string | number)[] | null | undefined,
  data: unknown,
): unknown => {
  if (!decode || data == null) {
    return data;
  }

  const hasId = Array.isArray(pathParams) && pathParams.length === 1;

  if (hasId) {
    return fromJson(ClusterSchema, data as JsonValue);
  }

  return fromJson(ClustersListResponseSchema, data as JsonValue);
};
