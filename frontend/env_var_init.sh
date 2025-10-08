#!/bin/bash

# AI Reporting Frontend Environment Variables
# Source this file before running the frontend locally: source env_var_init.sh

# Azure Entra ID (Active Directory) Configuration
export REACT_APP_AZURE_CLIENT_ID="your-azure-client-id-here"
export REACT_APP_AZURE_TENANT_ID="your-azure-tenant-id-here"
export REACT_APP_REDIRECT_URI="http://localhost:3000/"

# Backend API Configuration
# For local development, point to local backend
export REACT_APP_API_URL="http://localhost:8000"

echo "✓ Environment variables exported successfully!"
echo ""
echo "Azure Client ID: $REACT_APP_AZURE_CLIENT_ID"
echo "Azure Tenant ID: $REACT_APP_AZURE_TENANT_ID"
echo "Redirect URI: $REACT_APP_REDIRECT_URI"
echo "API URL: $REACT_APP_API_URL"
echo ""
echo "You can now run: npm start"
