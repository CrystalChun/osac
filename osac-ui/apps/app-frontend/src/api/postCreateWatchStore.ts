/**
 * Session-scoped post-create watches (survives route changes within the SPA).
 */
import type { PostCreateWatch } from './pendingVmCreation';

const postCreateWatches = new Map<string, PostCreateWatch>();

export const getPostCreateWatch = (vmId: string): PostCreateWatch | undefined => {
  return postCreateWatches.get(vmId);
};

export const setPostCreateWatch = (watch: PostCreateWatch): void => {
  postCreateWatches.set(watch.vmId, watch);
};

export const deletePostCreateWatch = (vmId: string): void => {
  postCreateWatches.delete(vmId);
};

export const listPostCreateWatchIds = (): string[] => {
  return [...postCreateWatches.keys()];
};

/** @internal test helper */
export const clearAllPostCreateWatches = (): void => {
  postCreateWatches.clear();
};
