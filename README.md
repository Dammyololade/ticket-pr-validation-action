# Linear Ticket PR Validation Action

[![CI](https://github.com/dammyololade/ticket-pr-validation-action/workflows/CI/badge.svg)](https://github.com/dammyololade/ticket-pr-validation-action/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Version](https://img.shields.io/badge/version-1.0.3-blue.svg)](https://github.com/dammyololade/ticket-pr-validation-action)
[![Marketplace](https://img.shields.io/badge/Marketplace-Linear%20Ticket%20PR%20Validation-blue.svg)](https://github.com/marketplace/actions/linear-ticket-pr-validation)

A GitHub Action that validates Pull Requests against Linear tickets and triggers assistant reviews by posting formatted comments with ticket details and acceptance criteria.

**Available on [GitHub Marketplace](https://github.com/marketplace/actions/linear-ticket-pr-validation)**

## Features

- 🔍 Automatically extracts ticket IDs from branch names or PR titles using regex patterns
- 📋 Fetches ticket details from Linear GraphQL API
- 📝 Extracts acceptance criteria from ticket descriptions
- 💬 Posts formatted comments with ticket information and review requests
- 🧪 Supports dry-run mode for testing
- ⚠️ Graceful error handling with informative error comments

## Installation

### From GitHub Marketplace

This action is available on the [GitHub Marketplace](https://github.com/marketplace/actions/linear-ticket-pr-validation). You can install it directly in your workflow:

```yaml
- name: Validate PR against Linear ticket
  uses: dammyololade/ticket-pr-validation-action@v1.0.3
```

**Recommended**: Pin to a specific version (e.g., `@v1.0.3`) for stability. You can also use `@v1` to automatically get minor and patch updates, or `@main` for the latest development version (not recommended for production).

## Usage

### Basic Example

```yaml
name: Validate PR against Linear Ticket

on:
  pull_request:
    types: [opened, synchronize]

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

- name: Validate PR against Linear ticket
  uses: dammyololade/ticket-pr-validation-action@v1.0.3
        with:
          linear-api-key: ${{ secrets.LINEAR_API_KEY }}
```

### Complete Example with All Options

```yaml
name: Validate PR against Linear Ticket

on:
  pull_request:
    types: [opened, synchronize]

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Validate PR against Linear ticket
        id: validate
        uses: dammyololade/ticket-pr-validation-action@v1.0.3
        with:
          linear-api-key: ${{ secrets.LINEAR_API_KEY }}
          github-token: ${{ secrets.GITHUB_TOKEN }} # Optional: defaults to GITHUB_TOKEN env var
          branch-pattern: '[A-Za-z]+-[0-9]+' # Custom regex pattern (default: [A-Za-z]+-[0-9]+)
          assistant-mention: '@gemini-code-assist' # Custom assistant mention (default: @gemini-code-assist)
          ticket-id: '' # Optional: Manual override for ticket ID
          pr-number: '' # Optional: PR number override
          dry-run: 'false' # Set to 'true' to test without posting comments

      - name: Show results
        run: |
          echo "Ticket ID: ${{ steps.validate.outputs.ticket-id }}"
          echo "Comment URL: ${{ steps.validate.outputs.comment-url }}"
          echo "Success: ${{ steps.validate.outputs.success }}"
```

### Version Pinning

For production use, we recommend pinning to a specific version:

- `@v1.0.3` - Pins to exact version (most stable)
- `@v1` - Gets latest v1.x.x (minor and patch updates)
- `@main` - Latest development version (not recommended for production)

Example:

```yaml
uses: dammyololade/ticket-pr-validation-action@v1.0.3 # Recommended for production
```

## Inputs

| Input               | Description                                         | Required | Default                |
| ------------------- | --------------------------------------------------- | -------- | ---------------------- |
| `linear-api-key`    | Linear API key                                      | Yes      | -                      |
| `github-token`      | GitHub token (optional, defaults to `GITHUB_TOKEN`) | No       | `GITHUB_TOKEN` env var |
| `ticket-id`         | Manual override for ticket ID                       | No       | -                      |
| `branch-pattern`    | Regex pattern to extract ticket ID from branch name | No       | `[A-Za-z]+-[0-9]+`     |
| `pr-number`         | PR number override                                  | No       | From event context     |
| `assistant-mention` | Assistant mention for code review                   | No       | `@gemini-code-assist`  |
| `dry-run`           | Dry run mode - log output without posting comment   | No       | `false`                |

## Outputs

| Output        | Description                                          |
| ------------- | ---------------------------------------------------- |
| `ticket-id`   | Detected or provided ticket ID                       |
| `comment-url` | URL of the posted comment (or `dry-run` placeholder) |
| `success`     | Whether the action completed successfully            |

## Required Secrets

### Linear API Key

1. Go to Linear Settings → API
2. Create a new Personal API Key
3. Add it as a secret named `LINEAR_API_KEY` in your GitHub repository

### GitHub Token

The action uses `GITHUB_TOKEN` by default (automatically provided by GitHub Actions). If you need custom permissions, you can provide a Personal Access Token via the `github-token` input.

**Required permissions:**

- `issues: write` - To post comments on PRs
- `pull-requests: read` - To read PR details

## How It Works

1. **Ticket ID Detection**: The action extracts ticket IDs using the following priority:
   - Explicit `ticket-id` input (if provided)
   - Branch name matching the `branch-pattern` regex
   - PR title matching the `branch-pattern` regex

2. **Linear API Call**: Fetches ticket details including:
   - Identifier (e.g., `PROJ-123`)
   - Title
   - Description
   - Labels
   - State

3. **Acceptance Criteria Extraction**: Parses the ticket description to find acceptance criteria under headings like:
   - "Acceptance Criteria"
   - "AC"
   - "Requirements"
   - "Definition of Done"

4. **Comment Posting**: Creates a formatted comment with:
   - Assistant mention
   - Ticket details (identifier, title, state, labels, link)
   - Full description
   - Extracted acceptance criteria
   - Review request with table template

## Branch Pattern Examples

The default pattern `[A-Za-z]+-[0-9]+` matches ticket IDs like:

- `PROJ-123`
- `ABC-456`
- `FEAT-789`

For custom patterns:

- `TICKET-[0-9]+` - Matches `TICKET-123`
- `[A-Z]{2,}-[0-9]+` - Matches at least 2 uppercase letters followed by digits

**Note**: For digit matching, use `[0-9]+` instead of `\d+` to avoid escaping issues in YAML.

## Troubleshooting

### Ticket ID Not Found

**Error**: `Could not extract ticket ID from branch...`

**Solutions**:

- Ensure your branch name or PR title contains a ticket ID matching the pattern
- Use the `ticket-id` input to manually specify the ticket ID
- Adjust the `branch-pattern` to match your ticket ID format

### Linear API Errors

**Error**: `Linear API error: ...`

**Solutions**:

- Verify your Linear API key is correct and has proper permissions
- Ensure the ticket ID exists and is accessible
- Check Linear API status

### GitHub Token Issues

**Error**: `GitHub token is required...`

**Solutions**:

- Ensure `GITHUB_TOKEN` environment variable is set (automatic in GitHub Actions)
- Or provide `github-token` input with a valid token
- Verify the token has `issues: write` and `pull-requests: read` permissions

### Acceptance Criteria Not Found

If no acceptance criteria are found under expected headings, the action will use the entire ticket description as fallback.

## Testing

> **Note for Users**: If you're using this action from the Marketplace, you don't need to run these tests. These testing instructions are for developers contributing to the action.

### Unit Tests

Run the test suite with mocked APIs (no credentials needed):

```bash
npm test
```

### Testing with Real APIs

For action developers: Test the action with real Linear and GitHub APIs using the provided script:

```bash
export LINEAR_API_KEY="your-linear-api-key"
export GITHUB_TOKEN="your-github-token"
./scripts/test-real.sh PROJ-123 42 myorg myrepo false
```

**Usage:**

```bash
./scripts/test-real.sh <ticket-id> <pr-number> <repo-owner> <repo-name> [dry-run]
```

**Note:** This posts real comments! Use `dry-run=true` to test without posting.

### Testing Locally with Act

For action developers: Test the action locally using `act` to simulate the GitHub Actions environment:

```bash
export LINEAR_API_KEY="your-linear-api-key"
export GITHUB_TOKEN="your-github-token"
./scripts/test-with-act.sh PROJ-123 42 myorg myrepo true
```

**Usage:**

```bash
./scripts/test-with-act.sh <ticket-id> <pr-number> <repo-owner> <repo-name> [dry-run]
```

**Requirements:**

- Docker installed and running
- `act` installed (`brew install act` on macOS)

**Note:** Repository owner and name are required because `github.context.repo` needs to know which repository to work with.

### Testing in Your Workflow

To test the action in your own repository before using it in production:

1. Add the action to a test workflow
2. Use `dry-run: 'true'` to test without posting comments
3. Check the action logs to verify the output
4. Set `dry-run: 'false'` to actually post comments

**Example test workflow:**

```yaml
name: Test Linear Ticket Validation

on:
  workflow_dispatch:
    inputs:
      ticket_id:
        description: 'Linear ticket ID to test'
        required: true

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

- name: Validate PR against Linear ticket
  uses: dammyololade/ticket-pr-validation-action@v1.0.3
        with:
          linear-api-key: ${{ secrets.LINEAR_API_KEY }}
          ticket-id: ${{ inputs.ticket_id }}
          pr-number: 1
          dry-run: 'true'
```

## Development

### Setup

```bash
npm install
```

### Build

```bash
npm run build
```

### Test

```bash
npm test
```

### Lint

```bash
npm run lint
```

### Format

```bash
npm run format
```

## Security

See [SECURITY.md](SECURITY.md) for information about reporting security vulnerabilities.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Support

- 📖 [Documentation](https://github.com/dammyololade/ticket-pr-validation-action#readme)
- 🐛 [Report a Bug](https://github.com/dammyololade/ticket-pr-validation-action/issues)
- 💬 [GitHub Discussions](https://github.com/dammyololade/ticket-pr-validation-action/discussions)
- 🛒 [GitHub Marketplace](https://github.com/marketplace/actions/linear-ticket-pr-validation)

## License

MIT License - see [LICENSE](LICENSE) file for details.
