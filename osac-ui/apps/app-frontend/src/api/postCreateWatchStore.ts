/**
 * Session-scoped post-create watches (survives route changes within the SPA).
 */
import type { PostCreateWatch } from './pendingVmCreation'

const postCreateWatches = new Map<string, PostCreateWatch>()

export function getPostCreateWatch(vmId: string): PostCreateWatch | undefined {
  return postCreateWatches.get(vmId)
}

export function setPostCreateWatch(watch: PostCreateWatch): void {
  postCreateWatches.set(watch.vmId, watch)
}

export function deletePostCreateWatch(vmId: string): void {
  postCreateWatches.delete(vmId)
}

export function listPostCreateWatchIds(): string[] {
  return [...postCreateWatches.keys()]
}

/** @internal test helper */
export function clearAllPostCreateWatches(): void {
  postCreateWatches.clear()
}
