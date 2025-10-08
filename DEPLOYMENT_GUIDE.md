# AI Reporting Application - Deployment Guide

This guide provides instructions for deploying both the frontend and backend of the AI Reporting application.

---

## Quick Start - Local Development

### Backend Setup

1. **Navigate to backend folder**:
   ```bash
   cd backend
   ```

2. **Install dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

3. **Configure database connection** (.env file):
   ```env
   DB_SERVER=your-sql-server.database.windows.net
   DB_DATABASE=AIReporting
   DB_USERNAME=your-username
   DB_PASSWORD=your-password
   DB_DRIVER={ODBC Driver 17 for SQL Server}
   ```

4. **Initialize the database**:
   ```bash
   # Run the SQL initialization script on your SQL Server
   # Use SQL Server Management Studio or Azure Data Studio
   # Execute: backend/sql_init_ai_reporting.sql
   ```

5. **Run the backend**:
   ```bash
   python app.py
   ```
   Backend will run on `http://localhost:8000`

### Frontend Setup

1. **Navigate to frontend folder**:
   ```bash
   cd frontend
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure environment variables**:

   **Option A: Using env_var_init.sh (Git Bash/Linux/Mac)**
   ```bash
   # Edit env_var_init.sh with your Azure AD credentials
   nano env_var_init.sh

   # Source the file
   source env_var_init.sh
   ```

   **Option B: Using .env file (All platforms)**
   ```bash
   # Copy example file
   cp .env.example .env

   # Edit .env with your values
   nano .env
   ```

4. **Run the frontend**:
   ```bash
   npm start
   ```
   Frontend will run on `http://localhost:3000`

---

## Azure Deployment

### Prerequisites

1. **Azure AD App Registration**:
   - Create an App Registration in Azure Active Directory
   - Configure redirect URIs for both local and production
   - Copy Client ID and Tenant ID
   - See `frontend/ENVIRONMENT_SETUP.md` for detailed steps

2. **Azure Resources**:
   - Azure SQL Database (for backend)
   - 2x Azure Web Apps (one for frontend, one for backend)
   - Or use Azure Container Instances with Docker

### Backend Deployment

#### Option 1: Azure Web App (Python)

1. **Create Azure Web App**:
   ```bash
   az webapp up \
     --resource-group your-rg \
     --name your-backend-api \
     --runtime "PYTHON:3.11" \
     --location eastus
   ```

2. **Configure App Settings**:
   - Go to Azure Portal → Your Backend Web App → Configuration
   - Add Application Settings:
     ```
     DB_SERVER = your-sql-server.database.windows.net
     DB_DATABASE = AIReporting
     DB_USERNAME = your-username
     DB_PASSWORD = your-password
     DB_DRIVER = {ODBC Driver 17 for SQL Server}
     ```

3. **Deploy backend code**:
   ```bash
   cd backend
   az webapp deployment source config-zip \
     --resource-group your-rg \
     --name your-backend-api \
     --src backend.zip
   ```

#### Option 2: Docker Container

1. **Build Docker image**:
   ```bash
   cd backend
   docker build -t ai-reporting-backend .
   ```

2. **Push to Azure Container Registry**:
   ```bash
   az acr build \
     --registry yourregistry \
     --image ai-reporting-backend:latest \
     --file Dockerfile .
   ```

3. **Deploy to Azure Container Instance or App Service**

### Frontend Deployment

#### Option 1: Build in Azure (Recommended)

1. **Configure Azure App Settings** (these are used during build):
   - Go to Azure Portal → Your Frontend Web App → Configuration
   - Add Application Settings:
     ```
     REACT_APP_AZURE_CLIENT_ID = your-azure-client-id
     REACT_APP_AZURE_TENANT_ID = your-azure-tenant-id
     REACT_APP_REDIRECT_URI = https://your-frontend-app.azurewebsites.net/
     REACT_APP_API_URL = https://your-backend-api.azurewebsites.net
     ```

2. **Deploy frontend code**:
   ```bash
   cd frontend
   az webapp up \
     --resource-group your-rg \
     --name your-frontend-app \
     --runtime "NODE:18-lts" \
     --location eastus
   ```

Azure will automatically:
- Run `npm install`
- Run `npm run build` (with your App Settings)
- Serve the built application

#### Option 2: Build Locally, Deploy Build

1. **Set environment variables locally** (use .env or env_var_init.sh)

2. **Build the application**:
   ```bash
   cd frontend
   npm run build
   ```

3. **Deploy the build folder**:
   ```bash
   # Create a zip of the build folder
   cd build
   zip -r ../build.zip .
   cd ..

   # Deploy to Azure
   az webapp deployment source config-zip \
     --resource-group your-rg \
     --name your-frontend-app \
     --src build.zip
   ```

---

## Environment Variables Reference

### Frontend Environment Variables

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `REACT_APP_AZURE_CLIENT_ID` | Yes | Azure AD Client ID | `12345678-1234-1234-1234-123456789abc` |
| `REACT_APP_AZURE_TENANT_ID` | Yes | Azure AD Tenant ID | `87654321-4321-4321-4321-cba987654321` |
| `REACT_APP_REDIRECT_URI` | Yes | OAuth redirect URI | `https://myapp.azurewebsites.net/` |
| `REACT_APP_API_URL` | Yes | Backend API URL | `https://myapi.azurewebsites.net` |

### Backend Environment Variables

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `DB_SERVER` | Yes | SQL Server hostname | `myserver.database.windows.net` |
| `DB_DATABASE` | Yes | Database name | `AIReporting` |
| `DB_USERNAME` | Yes | Database username | `sqladmin` |
| `DB_PASSWORD` | Yes | Database password | `SecureP@ssw0rd123` |
| `DB_DRIVER` | Yes | ODBC driver name | `{ODBC Driver 17 for SQL Server}` |
| `AZURE_OPENAI_ENDPOINT` | No | OpenAI endpoint (for ROI Assistant) | `https://your-openai.openai.azure.com/` |
| `AZURE_OPENAI_API_KEY` | No | OpenAI API key | `your-api-key` |

---

## Post-Deployment Configuration

### 1. Update Azure AD Redirect URIs
After deploying the frontend:
- Go to Azure AD → App Registrations → Your App → Authentication
- Add your production URL to Redirect URIs: `https://your-app.azurewebsites.net/`

### 2. Configure CORS on Backend
The backend `app.py` already has CORS enabled for all origins. For production, you may want to restrict this:

```python
CORS(app, origins=["https://your-frontend-app.azurewebsites.net"])
```

### 3. Database Initialization
Run the SQL initialization script on your Azure SQL Database:
- Connect using SQL Server Management Studio or Azure Data Studio
- Execute `backend/sql_init_ai_reporting.sql`
- This creates all tables, indexes, and default data

### 4. Test the Application
1. Navigate to `https://your-frontend-app.azurewebsites.net`
2. Click "Authenticate with AD"
3. Sign in with your Azure AD credentials
4. Verify you can access all features

---

## Troubleshooting

### Frontend Issues

**"Missing required environment variables"**
- Verify all `REACT_APP_*` variables are set in Azure App Settings
- Restart the Web App after changing settings
- If building locally, check your .env file

**"Authentication failed"**
- Verify `REACT_APP_AZURE_CLIENT_ID` matches your App Registration
- Check `REACT_APP_REDIRECT_URI` is registered in Azure AD
- Ensure the Redirect URI ends with a `/`

**"API calls fail"**
- Verify `REACT_APP_API_URL` points to your backend
- Check backend is running
- Verify CORS is configured correctly

### Backend Issues

**"Database connection failed"**
- Verify database credentials in App Settings
- Check Azure SQL firewall allows connections from Azure services
- Ensure ODBC Driver 17 is available (pre-installed in Azure Web Apps)

**"Import errors"**
- Ensure `requirements.txt` includes all dependencies
- Verify Python version matches (3.11 recommended)
- Check deployment logs in Azure Portal

---

## Monitoring and Logs

### Frontend Logs
```bash
# Stream logs
az webapp log tail --name your-frontend-app --resource-group your-rg

# View in Azure Portal
Azure Portal → Your Web App → Monitoring → Log stream
```

### Backend Logs
```bash
# Stream logs
az webapp log tail --name your-backend-api --resource-group your-rg

# View in Azure Portal
Azure Portal → Your Web App → Monitoring → Log stream
```

---

## Security Best Practices

1. **Use Managed Identities** for database connections instead of passwords
2. **Store secrets in Azure Key Vault** instead of App Settings
3. **Enable HTTPS only** for both frontend and backend
4. **Restrict CORS** to specific origins in production
5. **Use separate Azure AD registrations** for dev and production
6. **Enable Application Insights** for monitoring
7. **Set up alerts** for failures and performance issues

---

## Cost Optimization

1. **Use Azure App Service Free/Basic tiers** for development
2. **Scale up to Standard** for production with auto-scaling
3. **Use Azure SQL Database Basic tier** for development
4. **Enable auto-pause** for development databases
5. **Use Azure CDN** for frontend static files in production

---

## Support and Maintenance

### Updating the Application

**Frontend Updates**:
```bash
cd frontend
git pull
npm install
# If building in Azure, just push the code
# If building locally, run npm build and redeploy
```

**Backend Updates**:
```bash
cd backend
git pull
pip install -r requirements.txt
# Redeploy to Azure
```

### Database Schema Updates
- Create migration SQL scripts
- Test in development environment first
- Apply to production during maintenance window
- Keep backups before applying changes

---

## Additional Resources

- **Frontend Setup**: See `frontend/ENVIRONMENT_SETUP.md`
- **Backend API**: Backend runs on Flask - see `backend/app.py`
- **Database Schema**: See `backend/sql_init_ai_reporting.sql`
- **Azure Documentation**: https://docs.microsoft.com/azure
- **MSAL Documentation**: https://docs.microsoft.com/azure/active-directory/develop/msal-overview
