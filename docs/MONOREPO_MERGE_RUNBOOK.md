# Mono-repo merge runbook

Records exactly how each component was merged into this repo, so a merge can
be understood, audited, or reverted later without re-deriving it from scratch.

## Prerequisites (completed before any merge)

- `fulfillment-service` and `osac-operator` `main` branches locked read-only
  via `gh api -X PUT repos/osac-project/<repo>/branches/main/protection`
  (`lock_branch: true`, all other protection settings preserved unchanged).
- This repo (`osac-project/osac`) already existed with an initial skeleton
  commit and a protected `main`.

## Merge 1: fulfillment-service + osac-operator

Branch: `merge/fulfillment-service-osac-operator` (off `upstream/main` at `088be1b`).

```
git remote add fulfillment-service-src git@github.com:osac-project/fulfillment-service.git
git remote add osac-operator-src git@github.com:osac-project/osac-operator.git
git fetch fulfillment-service-src main
git fetch osac-operator-src main

git subtree add --prefix=fulfillment-service fulfillment-service-src main \
  -m "OSAC-3363: Merge fulfillment-service history into osac mono-repo"

git subtree add --prefix=osac-operator osac-operator-src main \
  -m "OSAC-3363: Merge osac-operator history into osac mono-repo"
```

No `--squash` was used — full commit history of both source repos is
preserved under `fulfillment-service/` and `osac-operator/` respectively.

**Tags:** verified no tags were pulled in by the subtree fetches (both
source repos have tags upstream — 114 on fulfillment-service, 20 on
osac-operator — but `git tag -l` in this repo returns empty after both
merges). Nothing to strip. Going forward, this repo will *not* reuse a bare
`v*` tag across components; each component keeps its own
`<component>/vX.Y.Z` prefix (extends the existing `osac-operator/api/vX.Y.Z`
precedent) for any artifact that still needs a tagged release (CLI binary,
container images, Helm charts). Internal Go module version pinning between
these two components is superseded by `go.work` below.

**go.work:**

```
go work init ./fulfillment-service ./osac-operator ./osac-operator/api
```

Verified: `go build ./...` passes in all three modules, and
`fulfillment-service` resolves `github.com/osac-project/osac-operator/api`
to the local `./osac-operator/api` directory (not its pinned registry
version) — confirmed via
`go list -m -f '{{.Path}} {{.Dir}} {{.Replace}}' github.com/osac-project/osac-operator/api`
run from inside `fulfillment-service`.

`osac-operator`'s own `replace github.com/osac-project/osac-operator/api =>
./api` in its `go.mod` is untouched — it's a relative path and the merge
didn't change osac-operator's internal directory layout.

`bare-metal-fulfillment-operator` is **not** part of this merge (see
OSAC-3395) and stays pinned to its tagged registry version in both
`fulfillment-service/go.mod` and `osac-operator/go.mod` until it is merged
in a future step.

## How to revert this merge

Each subtree merge is a single, separate commit on top of the branch base —
`git revert <merge-commit-sha>` for the `osac-operator` merge commit and/or
the `fulfillment-service` merge commit removes exactly that component's
history and files, since neither commit touches files outside its own
`--prefix` directory (plus this file and `go.work`/`go.work.sum`, which
should be cleaned up by hand if only one component is being unwound).
