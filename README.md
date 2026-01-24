# MantisHub Create Version GitHub Action

Automatically create versions in [MantisHub](https://www.mantishub.com) when you release new versions of your software. This action integrates your GitHub release workflow with MantisHub's version tracking system.

## Overview

This GitHub Action creates a new version entry in your MantisHub project via the MantisHub REST API. It's designed to be triggered when a new tag is pushed to your repository, keeping your MantisHub project versions synchronized with your GitHub releases.

**Key Features:**
- Automatically create MantisHub versions from GitHub tags
- Configurable version metadata (description, release status, timestamps)
- Returns the created version ID for use in subsequent workflow steps

## Prerequisites

Before using this action, you need:

1. **A MantisHub account** with access to the project where versions will be created
2. **A MantisHub API key** with permissions to create versions
3. **The project name** in MantisHub (must match exactly)

### Generating a MantisHub API Key

1. Log in to your MantisHub instance
2. Navigate to your user preferences/account settings
3. Generate a new API token with appropriate permissions
4. Store the token as a GitHub secret (see [Security](#security) section)

## Inputs

| Input | Required | Default | Description |
|-------|----------|---------|-------------|
| `url` | **Yes** | - | Base URL of your MantisHub instance (e.g., `https://example.mantishub.io`) |
| `api-key` | **Yes** | - | API key for MantisHub authentication |
| `project` | **Yes** | - | Name of the project in MantisHub (case-sensitive) |
| `name` | **Yes** | - | Version name to create (e.g., `v1.2.0`) |
| `description` | No | - | Description of the version/release |
| `released` | No | `true` | Set to `true` if version is released, `false` if unreleased |
| `obsolete` | No | `false` | Set to `true` to mark version as obsolete |
| `timestamp` | No | Current time | Release date in ISO format (e.g., `2025-09-20`) |

## Outputs

| Output | Description |
|--------|-------------|
| `version-id` | The unique ID of the created version in MantisHub |

Access this output in subsequent steps using: `${{ steps.<step-id>.outputs.version-id }}`

## Usage Examples

### Basic Usage

Create a version with minimal configuration:

```yaml
- name: Create MantisHub Version
  uses: mantishub/action-create-version@v1
  with:
    url: https://example.mantishub.io
    api-key: ${{ secrets.MANTISHUB_API_KEY }}
    project: 'MyProject'
    name: 'v1.0.0'
```

### Automatic Version Creation on Tag Push

The most common use case is to automatically create a MantisHub version when you push a new tag:

```yaml
name: Create MantisHub Version on Release

on:
  push:
    tags:
      - 'v*'  # Triggers on tags starting with 'v' (e.g., v1.0.0, v2.1.3)

jobs:
  create-mantishub-version:
    runs-on: ubuntu-latest
    steps:
      - name: Create Version in MantisHub
        id: create-version
        uses: mantishub/action-create-version@v1
        with:
          url: ${{ secrets.MANTISHUB_URL }}
          api-key: ${{ secrets.MANTISHUB_API_KEY }}
          project: 'MyProject'
          name: ${{ github.ref_name }}  # Automatically uses the tag name (e.g., v1.2.0)
          description: |
            Release ${{ github.ref_name }}
            Commit: ${{ github.sha }}
          released: true

      - name: Log Created Version
        run: echo "Created MantisHub version with ID ${{ steps.create-version.outputs.version-id }}"
```

### Integration with GitHub Releases

Create a MantisHub version when a GitHub Release is published:

```yaml
name: Sync GitHub Release to MantisHub

on:
  release:
    types: [published]

jobs:
  sync-to-mantishub:
    runs-on: ubuntu-latest
    steps:
      - name: Create MantisHub Version
        uses: mantishub/action-create-version@v1
        with:
          url: ${{ secrets.MANTISHUB_URL }}
          api-key: ${{ secrets.MANTISHUB_API_KEY }}
          project: 'MyProject'
          name: ${{ github.event.release.tag_name }}
          description: ${{ github.event.release.body }}
          released: ${{ !github.event.release.prerelease }}
          timestamp: ${{ github.event.release.published_at }}
```

### Full Configuration Example

A complete example showing all available options:

```yaml
name: MantisHub Version Management

on:
  workflow_dispatch:
    inputs:
      version:
        description: 'Version name'
        required: true
      is_released:
        description: 'Mark as released'
        type: boolean
        default: true

jobs:
  create-version:
    runs-on: ubuntu-latest
    steps:
      - name: Create Version in MantisHub
        id: create-version
        uses: mantishub/action-create-version@v1
        with:
          url: 'https://example.mantishub.io'
          api-key: ${{ secrets.MANTISHUB_API_KEY }}
          project: 'MyProject'
          name: ${{ inputs.version }}
          description: |
            Release ${{ inputs.version }}

            Created via GitHub Actions workflow.
          released: ${{ inputs.is_released }}
          obsolete: false
          timestamp: '2025-09-20'

      - name: Use Version ID
        run: |
          echo "Successfully created version!"
          echo "Version ID: ${{ steps.create-version.outputs.version-id }}"
```

## Security

**Important:** Never hardcode your MantisHub API key in workflow files.

### Storing Your API Key as a GitHub Secret

1. Go to your repository on GitHub
2. Navigate to **Settings** > **Secrets and variables** > **Actions**
3. Click **New repository secret**
4. Create a secret named `MANTISHUB_API_KEY` with your API key as the value
5. Optionally, create `MANTISHUB_URL` for your instance URL

Reference secrets in your workflow using `${{ secrets.MANTISHUB_API_KEY }}`.

## Troubleshooting

### Common Issues

**Error: Project not found**
- Verify the project name matches exactly (case-sensitive)
- Ensure your API key has access to the specified project

**Error: Authentication failed**
- Check that the API key is correctly stored in GitHub secrets
- Verify the API key hasn't expired
- Ensure the API key has permission to create versions

**Error: Invalid URL**
- Ensure the URL includes the protocol (`https://`)
- Don't include a trailing slash in the URL
- Verify the MantisHub instance is accessible

**Error: Version already exists**
- MantisHub may not allow duplicate version names
- Check if a version with the same name already exists in the project

### Debugging

Enable debug logging in your workflow by adding this secret:
- Name: `ACTIONS_STEP_DEBUG`
- Value: `true`

## API Reference

This action uses the MantisHub REST API:

- **Get Projects**: `GET /api/rest/projects`
- **Create Version**: `POST /api/rest/projects/{project_id}/versions`

For more information about the MantisHub API, refer to your MantisHub instance's API documentation.

## Contributing

Contributions are welcome! Please feel free to submit issues or pull requests to the [mantishub/action-create-version](https://github.com/mantishub/action-create-version) repository.

## License

This project is licensed under the terms specified in the repository.
