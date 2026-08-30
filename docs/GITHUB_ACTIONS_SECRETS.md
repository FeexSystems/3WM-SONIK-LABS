# GitHub Actions Repository Secrets Configuration

This document outlines the required repository secrets for 3WM SONIK's CI/CD workflows.

## Current Workflow Secrets

### Automatically Provided by GitHub Actions

- **GITHUB_TOKEN**: Automatically provided by GitHub Actions, used for:
  - Size limit action integration
  - Repository operations

### Required Manual Configuration

#### Apify Integration (Market Intelligence)

- **APIFY_API_TOKEN**: Your Apify API token for web scraping
  - Used by: Market Intelligence Service
  - Required for: TikTok/Spotify trend scraping, influencer discovery
  - Get from: https://apify.com/account/integrations

#### Optional Future Secrets

#### Supabase Integration (if using Supabase backend)

- **SUPABASE_URL**: Your Supabase project URL
- **SUPABASE_ANON_KEY**: Your Supabase anonymous API key
- **SUPABASE_SERVICE_ROLE_KEY**: Your Supabase service role key (for admin operations)

#### Firebase Integration (if using Firebase)

- **FIREBASE_PROJECT_ID**: Your Firebase project ID
- **FIREBASE_CLIENT_EMAIL**: Firebase service account email
- **FIREBASE_PRIVATE_KEY**: Firebase service account private key (base64 encoded)

#### Deployment Secrets

- **VERCEL_TOKEN**: For Vercel deployment (if using Vercel)
- **NETLIFY_AUTH_TOKEN**: For Netlify deployment (if using Netlify)
- **DEPLOY_WEBHOOK_URL**: Custom deployment webhook URL

## Configuration Steps

### 1. Navigate to Repository Settings

1. Go to your GitHub repository
2. Click on **Settings** tab
3. Click on **Secrets and variables** → **Actions**

### 2. Add Repository Secrets

For each secret:

1. Click **New repository secret**
2. Enter the secret name (e.g., `APIFY_API_TOKEN`)
3. Enter the secret value
4. Click **Add secret**

### 3. Verify Configuration

Run the workflow to verify secrets are properly configured:

```bash
# Trigger the workflow manually or push to main/develop
git push origin main
```

## Environment-Specific Secrets

For different environments (development, staging, production), use GitHub Environments:

### Development Environment

- `APIFY_API_TOKEN_DEV`
- `SUPABASE_URL_DEV`
- etc.

### Production Environment

- `APIFY_API_TOKEN_PROD`
- `SUPABASE_URL_PROD`
- etc.

## Security Best Practices

1. **Never commit secrets to the repository**
2. **Use GitHub's secret scanning** (enabled by default)
3. **Rotate secrets regularly**
4. **Use least privilege access** for API tokens
5. **Audit secret access** in GitHub audit logs

## Troubleshooting

### Workflow Fails with "Secret not found"

- Verify secret name matches exactly (case-sensitive)
- Check secret is configured at the correct level (repository vs organization)

### API Token Expired

- Regenerate the token from the service provider
- Update the secret in GitHub repository settings

### Workflow Permissions

- Ensure workflow has `contents: read` and `secrets: inherit` permissions
- Check repository settings → Actions → General → Workflow permissions

## Current Status

- ✅ Codecov integration: Configured in `.github/workflows/pre-ship.yml`
- ✅ TruffleHog secret scanning: Configured in `.github/workflows/pre-ship.yml`
- ⏳ Apify API token: Needs manual configuration
- ⏳ Other service secrets: Optional, configure as needed

## References

- [GitHub Actions Secrets Documentation](https://docs.github.com/en/actions/security-guides/encrypted-secrets)
- [Apify API Documentation](https://docs.apify.com/)
- [Codecov Documentation](https://docs.codecov.com/)
