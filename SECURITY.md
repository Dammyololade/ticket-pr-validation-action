# Security Policy

## Supported Versions

We release patches for security vulnerabilities. Which versions are eligible for receiving such patches depends on the CVSS v3.0 Rating:

| Version | Supported          |
| ------- | ------------------ |
| 1.0.x   | :white_check_mark: |

## Reporting a Vulnerability

Please report (suspected) security vulnerabilities by creating an issue on github. If the issue is confirmed, we will release a patch as soon as possible depending on complexity but historically within a few days.

## Security Best Practices

When using this action:

1. **Never commit API keys or tokens** - Always use GitHub Secrets
2. **Use least-privilege tokens** - Only grant necessary permissions
3. **Review action updates** - Pin to specific versions when possible
4. **Monitor action logs** - Check for unexpected behavior

### Required Secrets

- `LINEAR_API_KEY`: Your Linear API key (Personal API Key)
- `GITHUB_TOKEN`: GitHub token with `issues: write` and `pull-requests: read` permissions

### Token Permissions

The GitHub token should have minimal required permissions:

- `issues: write` - To post comments on PRs
- `pull-requests: read` - To read PR details

Do not grant unnecessary permissions like `repo: write` unless specifically needed.
