# Environment Variables Setup Guide

This guide explains how to configure environment variables for local development and Azure Web App deployment.

## Environment Variables

The application requires the following environment variables:

| Variable | Description | Example |
|----------|-------------|---------|
| `REACT_APP_AZURE_CLIENT_ID` | Azure AD App Registration Client ID | `12345678-1234-1234-1234-123456789abc` |
| `REACT_APP_AZURE_TENANT_ID` | Azure AD Tenant ID | `87654321-4321-4321-4321-cba987654321` |
| `REACT_APP_REDIRECT_URI` | OAuth redirect URI after login | `https://myapp.azurewebsites.net/` |
| `REACT_APP_API_URL` | Backend API base URL | `https://myapi.azurewebsites.net` |

---

## Local Development Setup

### Option 1: Using env_var_init.sh (Bash/Git Bash)

1. **Edit the `env_var_init.sh` file** with your actual values:
   ```bash
   nano env_var_init.sh
   ```

2. **Source the file to export variables**:
   ```bash
   source env_var_init.sh
   ```
   OR in Git Bash on Windows:
   ```bash
   . ./env_var_init.sh
   ```

3. **Start the application** (in the same terminal):
   ```bash
   npm start
   ```

**Note**: You must source the file in every new terminal session.

### Option 2: Using .env file (All Platforms)

1. **Create a `.env` file** in the `frontend` folder:
   ```bash
   cp .env.example .env
   ```

2. **Edit `.env`** with your actual values:
   ```env
   REACT_APP_AZURE_CLIENT_ID=your-azure-client-id-here
   REACT_APP_AZURE_TENANT_ID=your-azure-tenant-id-here
   REACT_APP_REDIRECT_URI=http://localhost:3000/
   REACT_APP_API_URL=http://localhost:8000
   ```

3. **Start the application**:
   ```bash
   npm start
   ```

**Note**: The `.env` file is automatically loaded by `react-scripts`.

---

## Azure Web App Deployment

### Important: React Environment Variables

React embeds environment variables **at build time**, not runtime. For Azure deployment, you have two options:

### Option A: Build in Azure (Recommended)

This approach builds the app in Azure with access to App Settings.

1. **Configure Azure App Settings**:
   - Go to Azure Portal → Your Web App → Configuration → Application Settings
   - Add the following settings:
     ```
     REACT_APP_AZURE_CLIENT_ID = your-azure-client-id
     REACT_APP_AZURE_TENANT_ID = your-azure-tenant-id
     REACT_APP_REDIRECT_URI = https://your-app.azurewebsites.net/
     REACT_APP_API_URL = https://your-backend-api.azurewebsites.net
     ```
   - Click "Save"

2. **Enable Azure Build Automation**:
   - In Azure Portal → Your Web App → Configuration → General Settings
   - Set "Stack": Node.js (latest LTS version)
   - Set "Build Automation": ON (if available)

3. **Deploy your code** using one of these methods:

   **Method 1: Azure CLI**
   ```bash
   cd frontend
   az webapp up --name your-app-name --resource-group your-resource-group
   ```

   **Method 2: GitHub Actions** (recommended for CI/CD)
   - Set up GitHub Actions workflow
   - Ensure environment variables are set in Azure App Settings
   - Azure will build using those settings

   **Method 3: Local Git Deployment**
   ```bash
   git remote add azure <deployment-git-url>
   git push azure main
   ```

4. **Azure will automatically**:
   - Detect it's a React app
   - Run `npm install`
   - Run `npm run build` (with your App Settings as environment variables)
   - Serve the built files

### Option B: Build Locally, Deploy Built Files

This approach builds locally with your values, then deploys.

1. **Set environment variables locally** (using .env or env_var_init.sh)

2. **Build the application**:
   ```bash
   npm run build
   ```

3. **Deploy the `build` folder** to Azure:
   ```bash
   az webapp deployment source config-zip \
     --resource-group your-resource-group \
     --name your-app-name \
     --src build.zip
   ```

**Note**: With this method, if you need to change environment variables, you must rebuild and redeploy.

---

## Verifying Environment Variables

### During Development
After sourcing `env_var_init.sh` or creating `.env`, verify:
```bash
echo $REACT_APP_API_URL
```

### In Browser Console
After the app loads, check (these will be visible in production too):
```javascript
console.log(process.env.REACT_APP_API_URL)
```

**Security Note**: Never put secrets in React environment variables - they are visible in the browser. Only use non-sensitive configuration values.

---

## Azure AD App Registration Setup

Before running the application, you must register it in Azure Active Directory:

1. **Go to Azure Portal** → Azure Active Directory → App Registrations → New Registration

2. **Configure the registration**:
   - Name: AI Reporting Application
   - Supported account types: Single tenant
   - Redirect URI: `https://your-app.azurewebsites.net/` (for production)
   - Also add: `http://localhost:3000/` (for local development)

3. **Copy the values**:
   - Application (client) ID → `REACT_APP_AZURE_CLIENT_ID`
   - Directory (tenant) ID → `REACT_APP_AZURE_TENANT_ID`

4. **Configure API Permissions**:
   - Add permission → Microsoft Graph → Delegated permissions
   - Add: `User.Read`, `openid`, `profile`, `email`
   - Grant admin consent

5. **Configure Authentication**:
   - Platform: Single-page application
   - Redirect URIs: Add both production and localhost URLs
   - Implicit grant: Enable ID tokens

---

## Troubleshooting

### "Missing required environment variables" error
- Ensure all `REACT_APP_*` variables are set
- If using .env, ensure the file is in the `frontend` folder
- If using env_var_init.sh, ensure you sourced it in the current terminal

### Azure AD login fails
- Verify `REACT_APP_AZURE_CLIENT_ID` matches your App Registration
- Verify `REACT_APP_REDIRECT_URI` is registered in Azure AD
- Check browser console for detailed MSAL errors

### API calls fail
- Verify `REACT_APP_API_URL` points to your backend
- Check backend is running and accessible
- Verify CORS is configured in the backend

### Environment variables not updating in Azure
- Remember to restart your Azure Web App after changing App Settings
- If using build-in-Azure, redeploy to trigger a new build
- If using local build, rebuild and redeploy

---

## Security Best Practices

1. **Never commit `.env` files** to git (already in .gitignore)
2. **Never commit `env_var_init.sh` with real values** to git
3. **Use separate Azure AD registrations** for dev and production
4. **Rotate Azure AD secrets** regularly
5. **Use Azure Key Vault** for sensitive backend configuration

---

## Quick Reference Commands

### Local Development
```bash
# Bash/Git Bash
source env_var_init.sh
npm start

# All platforms (using .env file)
npm start
```

### Build for Production
```bash
npm run build
```

### Deploy to Azure
```bash
az webapp up --name your-app-name --resource-group your-rg
```
