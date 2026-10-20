# Managing Projects

**Last Updated**: 2026-10-13
**Audience**: Tenant administrators, cloud provider administrators
**Status**: Draft

## Contents

- [Overview](#overview)
- [What is a Project?](#what-is-a-project)
- [When to Use Projects](#when-to-use-projects)
- [Project Hierarchy](#project-hierarchy)
- [Prerequisites](#prerequisites)
- [Creating a Project](#creating-a-project)
- [Listing Projects](#listing-projects)
- [Getting Project Details](#getting-project-details)
- [Updating a Project](#updating-a-project)
- [Deleting a Project](#deleting-a-project)
- [Project Memberships](#project-memberships)
- [Assigning Resources to Projects](#assigning-resources-to-projects)
- [Project States](#project-states)
- [Troubleshooting](#troubleshooting)
- [Best Practices](#best-practices)

---

## Overview

Projects provide a way to organize and isolate resources within an OSAC tenant. They act
as logical containers (similar to folders) that group related resources together and
control who can access them.

This guide shows how to create, manage, and use projects using the `osac` CLI.

---

## What is a Project?

A **project** is a logical grouping mechanism within a tenant that provides:

- **Resource organization**: Group related resources (clusters, compute instances, networks, secrets) together
- **Access control**: Control who can view or manage resources via project memberships
- **Hierarchical structure**: Create nested projects for multi-level organization
- **Isolation boundaries**: Separate resources by team, environment, or application

Projects are **not** OpenShift namespaces. Projects exist at the fulfillment API layer and provide
tenant-scoped resource organization.

---

## When to Use Projects

Use projects to:

| Use Case | Example |
|----------|---------|
| **Team separation** | Create a project per team (e.g., `frontend`, `backend`, `data`) |
| **Environment isolation** | Separate prod, staging, and dev resources |
| **Application grouping** | Group all resources for one application together |
| **Departmental organization** | Create projects for different departments or cost centers |
| **Access control boundaries** | Grant specific users access to only certain projects |

---

## Project Hierarchy

Projects support **hierarchical nesting** using dot-separated names. Each segment must
be a valid DNS label (lowercase letters, digits, hyphens; 1-63 characters; start/end
with alphanumeric).

### Hierarchy Examples

```text
team-a                          # Top-level project
team-a.frontend                 # Child of team-a
team-a.frontend.staging         # Child of team-a.frontend (3 levels deep)
```

### How to Create Hierarchical Projects

**Projects are special** - unlike other OSAC resources, Projects allow dots in
`metadata.name` to represent the full hierarchical path.

When you create a project, the server **derives the parent** from `metadata.name`:
- Split the name by dots
- The parent is everything except the last segment
- The `metadata.project` field is auto-filled with this derived parent

#### Recommended: Full hierarchical name only

```yaml
metadata:
  name: team-a.frontend.staging  # Complete dot-separated path
  tenant: my-tenant
  # project: auto-filled to "team-a.frontend"
spec:
  title: Frontend Staging Environment
```

The full project name is `team-a.frontend.staging`, parent is `team-a.frontend`.

#### Optional: Explicitly set the parent (must match)

```yaml
metadata:
  name: team-a.frontend.staging  # Complete dot-separated path
  project: team-a.frontend       # Must match the derived parent
  tenant: my-tenant
spec:
  title: Frontend Staging Environment
```

**Validation:** If you set `metadata.project`, it must either be:
- Empty (recommended - auto-filled from the name)
- Exactly match the derived parent from the name

Setting it to anything else causes `InvalidArgument` error.

#### Top-level projects (no parent)

```yaml
metadata:
  name: team-a       # Single segment (no dots)
  tenant: my-tenant
  # project: auto-filled to "" (no parent)
spec:
  title: Team A Resources
```

### Important: Projects vs Other Resources

- **Project `metadata.name`**: Full dot-separated path (e.g., `team-a.frontend.staging`)
  - Server derives parent from this name automatically
  - Max 4 segments (e.g., `org.team.env.app` is the limit)
- **Other resource `metadata.name`**: Must be a single DNS label without dots (e.g., `db-credentials`, `my-cluster`)
- **All resources `metadata.project`**: References the full project path where the resource lives (e.g., `team-a.frontend.staging`)

Example of a secret in a nested project:
```yaml
"@type": type.googleapis.com/osac.public.v1.Secret
metadata:
  name: api-token                    # ✓ Single DNS label (no dots)
  project: team-a.frontend.staging   # ✓ Full project path (with dots)
  tenant: my-tenant
spec:
  type: opaque
  data:
    token: ZmFrZQo=
```

---

## Prerequisites

Before managing projects, you need:

| Requirement | Description |
|-------------|-------------|
| `osac` CLI | Installed and authenticated |
| Tenant access | Must be a tenant member |
| Active tenant | Tenant must be in `SYNCED` or `ACTIVE` state |

For authentication, see the [Tenant Identity and Access Guide](../tenant-identity-and-access-guide.md).

---

## Creating a Project

Tenant administrators can create projects using a YAML file or inline parameters.

### Basic Project Creation

```bash
# Ensure you're logged in as tenant admin
osac whoami

# Create a project YAML file
cat > project.yaml <<EOF
"@type": type.googleapis.com/osac.public.v1.Project
metadata:
  name: default
  tenant: my-tenant
spec:
  title: Default Project
  description: Primary project for production workloads
EOF

# Create the project
osac create -f project.yaml
```

**Expected output:**

```text
Created project with name 'default' and identifier '<uuid>'.
```

### Creating a Nested Project

Create a child project by including the full dot-separated path in `metadata.name`:

```bash
cat > nested-project.yaml <<EOF
"@type": type.googleapis.com/osac.public.v1.Project
metadata:
  name: team-a.frontend.staging  # Full hierarchical path
  tenant: my-tenant
  # project: auto-filled to "team-a.frontend" by the server
spec:
  title: Frontend Staging
  description: Staging environment for frontend team
EOF

osac create -f nested-project.yaml
```

The server creates project `team-a.frontend.staging` with parent `team-a.frontend`.

**Note:** The parent projects (`team-a` and `team-a.frontend`) must already exist before
creating `team-a.frontend.staging`.

### Field Reference

| Field | Required | Description |
|-------|----------|-------------|
| `metadata.name` | Yes | Full dot-separated project path (e.g., `team-a.frontend.staging`)<br>For top-level: single segment (e.g., `team-a`)<br>Each segment: 1-63 chars, lowercase a-z/0-9/hyphens<br>Max 4 segments total |
| `metadata.tenant` | Yes | Tenant identifier |
| `metadata.project` | No | **Auto-filled from name.** Optional to set explicitly, but if set, must match the derived parent (all segments except the last in `metadata.name`). Recommended to leave empty.<br>Examples: name `team-a.frontend.staging` → project auto-fills to `team-a.frontend` |
| `spec.title` | No | Short display name for UI/CLI |
| `spec.description` | No | Long description (max 1024 characters) |

**Validation:** The server derives the parent from `metadata.name` by taking everything
before the last dot. If `metadata.project` is explicitly set, it must match this derived
value, otherwise you'll get `InvalidArgument` error.

---

## Listing Projects

List all projects you have access to:

```bash
osac get projects
```

**Example output:**

```text
TENANT      DELETING  PROJECT  NAME              TITLE                 STATE
my-tenant   -         -        -                 -                     ACTIVE
my-tenant   -         -        default           Default Project       ACTIVE
my-tenant   -         -        team-a            Team A Resources      ACTIVE
my-tenant   -         team-a   frontend          Frontend Team         ACTIVE
my-tenant   -         team-a   backend           Backend Team          ACTIVE
```

### Filter Projects

Use CEL expressions to filter results:

```bash
# List only top-level projects (no parent)
osac get projects --filter 'this.metadata.project == ""'

# List children of a specific project
osac get projects --filter 'this.metadata.project == "team-a"'

# Filter by label
osac get projects --filter 'this.metadata.labels["env"] == "production"'
```

### Understanding the Output

- **TENANT**: Tenant that owns the project
- **DELETING**: `Yes` if project is being deleted
- **PROJECT**: Parent project (empty for top-level projects)
- **NAME**: Project's own name
- **TITLE**: Display name from `spec.title`
- **STATE**: Current lifecycle state (see [Project States](#project-states))

The nameless row with `STATE=ACTIVE` is the **tenant root project**, automatically
created with the tenant. Leave it unchanged.

---

## Getting Project Details

Retrieve full details for a specific project:

```bash
# Get project by ID
osac get project <project-id>

# Get project details in YAML format
osac get project <project-id> -o yaml
```

**Example output:**

```yaml
id: 019abc...
metadata:
  name: default
  tenant: my-tenant
  creation_timestamp: "2026-10-13T10:00:00Z"
  version: 1
spec:
  title: Default Project
  description: Primary project for production workloads
status:
  state: PROJECT_STATE_ACTIVE
```

---

## Updating a Project

Update a project's title or description:

```bash
# Get current project configuration
osac get project <project-id> -o yaml > project-update.yaml

# Edit the file (modify spec.title or spec.description)
# Save changes

# Apply the update
osac update -f project-update.yaml
```

**Note:** You cannot change a project's name or parent after creation. The `metadata.name`
and `metadata.project` fields are immutable.

---

## Deleting a Project

Delete an empty project:

```bash
osac delete project <project-id>
```

### Deletion Requirements

A project can only be deleted if:

- **No resources are assigned to it** (clusters, compute instances, networks, secrets, etc.)
- **No child projects exist** under it
- **You have delete permissions** (creator or tenant-admin)

If deletion fails, remove all resources from the project first, then retry.

### Handling Stuck Deletions

If a project remains in `DELETING` state:

```bash
# Check for remaining resources
osac get clusters --filter 'this.metadata.project == "<project-name>"'
osac get secrets --filter 'this.metadata.project == "<project-name>"'
# ... check other resource types

# If truly empty and stuck, clear finalizers (last resort)
osac edit project <project-id>
# Remove metadata.finalizers array, save
```

---

## Project Memberships

Control who can access a project using **ProjectMembership** resources.

### Membership Roles

| Role | Permissions |
|------|-------------|
| `PROJECT_MEMBERSHIP_ROLE_VIEWER` | Can view and manage resources |
| `PROJECT_MEMBERSHIP_ROLE_MANAGER` | Can view and manage resources, modify memberships for the project, and modify the project itself |

### Adding a Viewer

```bash
# Get the user's ID
osac get users
USER_ID=$(osac get users | awk '$3=="bob" {print $1; exit}')

# Create a project membership
cat > membership.yaml <<EOF
"@type": type.googleapis.com/osac.public.v1.ProjectMembership
metadata:
  tenant: my-tenant
  project: default  # Project name (not ID)
spec:
  role: PROJECT_MEMBERSHIP_ROLE_VIEWER
  users:
    - ${USER_ID}
EOF

osac create -f membership.yaml
```

### Viewing Memberships

```bash
osac get projectmemberships

# Filter by project
osac get projectmemberships --filter 'this.metadata.project == "default"'
```

**Example output:**

```text
TENANT      STATE  PROJECT  USERS      ROLE
my-tenant   READY  default  <user-id>  VIEWER
```

### Important Notes

- **Use OSAC User IDs**, not usernames or Keycloak IDs
- Users must exist in OSAC (call any API endpoint after login to create the User record)
- `tenant-admin` users can always create/update project memberships
- Project memberships are **automatically deleted** when the project is deleted

For a complete RBAC workflow, see the [Tenant Identity and Access Guide](../tenant-identity-and-access-guide.md),
Flows 8-12.

---

## Assigning Resources to Projects

Assign resources to a project by setting `metadata.project` to the project's **full name**:

```yaml
"@type": type.googleapis.com/osac.public.v1.Secret
metadata:
  name: db-credentials
  tenant: my-tenant
  project: team-a.backend  # Full project name
spec:
  type: opaque
  data:
    username: YWRtaW4=
    password: cGFzc3dvcmQ=
```

### Default Project Assignment

If `metadata.project` is **empty or omitted**, the resource belongs to the **tenant's
default project** (the nameless tenant root project with `STATE=ACTIVE`).

### Cross-Project References

Some resources can reference others across project boundaries (e.g., a cluster in
`team-a.frontend` using a pull secret from `shared` tenant). Check the resource's
documentation for cross-project reference rules.

---

## Project States

Projects transition through these states:

| State | Description | Resources Allowed? |
|-------|-------------|-------------------|
| `PROJECT_STATE_PENDING` | Project is initializing (checking dependencies, creating resources) | No |
| `PROJECT_STATE_ACTIVE` | Project is ready for use | Yes |
| `PROJECT_STATE_FAILED` | Project encountered an error (e.g., circular dependency) | No |
| `PROJECT_STATE_DELETING` | Project is being deleted | No |
| `PROJECT_STATE_DELETE_FAILED` | Deletion failed (check `status.message`) | No |
| `PROJECT_STATE_UNSPECIFIED` | Unknown or not yet determined | Varies |

Check `status.message` for details when a project is in `FAILED` or `DELETE_FAILED` state.

---

## Troubleshooting

| Problem | Likely Cause | Solution |
|---------|--------------|----------|
| Create fails: "circular dependency" | Parent-child loop in hierarchy | Check `metadata.project` values; no project can be its own ancestor |
| Create fails: "PermissionDenied" | Not a tenant-admin | Verify `osac whoami` shows `tenant-admin` role |
| Project stuck in `PENDING` | Initialization timeout or error | Check `osac get project <id> -o yaml` for `status.message` |
| Cannot delete project | Resources still assigned | List resources with `--filter 'this.metadata.project == "<name>"'` and delete them first |
| Membership create fails: user not found | User hasn't called API yet | As that user, run `osac get projects` (or any API call) to create the User record |
| Membership shows `FAILED` state | Invalid user ID | Verify `osac get users` and use the UUID from the first column |
| Project not visible in `osac get projects` | No access permissions | Ask tenant-admin to add you via ProjectMembership |

---

## Best Practices

### Naming Conventions

- Use **descriptive, lowercase names**: `frontend`, `api-gateway`, `data-pipeline`
- Avoid abbreviations that may be unclear later: prefer `production` over `prd`
- Use consistent separators for multi-word names: `web-app` not `webapp` or `web_app`

### Hierarchy Design

- **Keep it shallow**: 2-3 levels max (e.g., `team.env.app`)
- **Top level = organizational unit**: Teams, departments, or major functional areas
- **Second level = environment or capability**: `prod`, `staging`, `dev`, or `api`, `frontend`, `backend`
- **Third level = specific resource grouping**: `api-v2`, `public-frontend`

### Access Control

- Grant **least privilege**: Start with `VIEWER`, promote to `MANAGER` only when needed
- Use projects to **separate concerns**: Don't put dev and prod in the same project
- Audit memberships regularly: Remove users who no longer need access

### Resource Organization

- **Group by lifecycle**: Resources deployed/updated together should share a project
- **Separate shared resources**: Platform-level secrets or configs may belong in a top-level shared project
- **Document project purpose**: Always set `spec.description` to explain the project's scope

### Migration and Cleanup

- **Plan before moving resources**: Changing `metadata.project` may affect references and permissions
- **Delete empty projects**: Reduce clutter by removing unused projects
- **Archive rather than delete**: For audit/compliance, consider marking projects inactive via labels instead of deletion

---

## Related Documentation

- [Tenant Identity and Access Guide](../tenant-identity-and-access-guide.md) — Complete RBAC workflow including project creation and memberships
- [Managing Secrets](../secrets-guide.md) — Creating secrets in projects
- [Catalog Items Guide](../../fulfillment-service/docs/CATALOG_ITEMS.md) — Using project-scoped resources
