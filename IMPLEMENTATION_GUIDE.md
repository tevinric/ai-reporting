# AI Reporting Application - Implementation Guide

## Overview

This is a comprehensive AI Reporting Dashboard application designed to capture, view, track, and report on all AI initiatives within an organization. The application consists of a Python Flask backend with SQL Server database and a React frontend.

## Table of Contents

1. [System Requirements](#system-requirements)
2. [Database Setup](#database-setup)
3. [Backend Setup](#backend-setup)
4. [Frontend Setup](#frontend-setup)
5. [Running with Docker](#running-with-docker)
6. [Application Features](#application-features)
7. [User Guide](#user-guide)
8. [Troubleshooting](#troubleshooting)

---

## System Requirements

### For Local Development
- **Python**: 3.11 or higher
- **Node.js**: 18.x or higher
- **SQL Server**: 2019 or higher (or Azure SQL Database)
- **ODBC Driver**: Microsoft ODBC Driver 17 for SQL Server

### For Docker Deployment
- **Docker**: 20.10 or higher
- **SQL Server**: Accessible instance (local or remote)

---

## Database Setup

### Step 1: Create Database

Connect to your SQL Server instance and create a new database:

```sql
CREATE DATABASE AIReporting;
GO
```

### Step 2: Run Initialization Script

Execute the SQL initialization script to create all required tables and seed initial data:

1. Open SQL Server Management Studio (SSMS) or Azure Data Studio
2. Connect to your SQL Server instance
3. Open the file: `backend/sql_init_ai_reporting.sql`
4. Execute the script against the `AIReporting` database

This script will create the following tables:
- `field_options` - Configurable dropdown options
- `custom_metrics` - User-defined metrics
- `initiatives` - Main AI initiatives table
- `initiative_departments` - Many-to-many relationship for departments
- `monthly_metrics` - Monthly ROI and performance metrics

### Step 3: Verify Installation

Run the following query to verify tables were created:

```sql
SELECT TABLE_NAME
FROM INFORMATION_SCHEMA.TABLES
WHERE TABLE_TYPE = 'BASE TABLE'
ORDER BY TABLE_NAME;
```

You should see 5 tables listed.

---

## Backend Setup

### Method 1: Local Development (Without Docker)

#### Step 1: Navigate to Backend Directory

```bash
cd backend
```

#### Step 2: Create Virtual Environment

**Windows:**
```bash
python -m venv venv
venv\Scripts\activate
```

**Linux/Mac:**
```bash
python -m venv venv
source venv/bin/activate
```

#### Step 3: Install Dependencies

```bash
pip install -r requirements.txt
```

#### Step 4: Configure Environment Variables

Create a `.env` file in the `backend` directory:

```bash
cp .env.example .env
```

Edit the `.env` file with your database connection details:

```env
DB_SERVER=localhost
DB_DATABASE=AIReporting
DB_USERNAME=
DB_PASSWORD=
DB_DRIVER={ODBC Driver 17 for SQL Server}
```

**Note:**
- If using Windows Authentication, leave `DB_USERNAME` and `DB_PASSWORD` empty
- If using SQL Authentication, provide the username and password

#### Step 5: Run the Backend

```bash
python app.py
```

The backend API will start on `http://localhost:8000`

#### Step 6: Verify Backend is Running

Open your browser and navigate to:
```
http://localhost:8000/api/health
```

You should see:
```json
{
  "status": "healthy",
  "database": "connected"
}
```

### Method 2: Using Docker

#### Step 1: Build Docker Image

```bash
cd backend
docker build -t ai-reporting-backend .
```

#### Step 2: Run Docker Container

**For Windows Authentication:**
```bash
docker run -d -p 8000:8000 \
  -e DB_SERVER=host.docker.internal \
  -e DB_DATABASE=AIReporting \
  ai-reporting-backend
```

**For SQL Authentication:**
```bash
docker run -d -p 8000:8000 \
  -e DB_SERVER=your-server \
  -e DB_DATABASE=AIReporting \
  -e DB_USERNAME=your-username \
  -e DB_PASSWORD=your-password \
  ai-reporting-backend
```

---

## Frontend Setup

### Method 1: Local Development (Without Docker)

#### Step 1: Navigate to Frontend Directory

```bash
cd frontend
```

#### Step 2: Install Dependencies

```bash
npm install
```

#### Step 3: Configure Environment Variables

Create a `.env` file in the `frontend` directory:

```bash
cp .env.example .env
```

Edit the `.env` file:

```env
REACT_APP_API_URL=http://localhost:8000
```

#### Step 4: Run the Frontend

```bash
npm start
```

The frontend will start on `http://localhost:3000` and automatically open in your browser.

### Method 2: Using Docker

#### Step 1: Build Docker Image

```bash
cd frontend
docker build -t ai-reporting-frontend .
```

#### Step 2: Run Docker Container

```bash
docker run -d -p 80:80 ai-reporting-frontend
```

The frontend will be available at `http://localhost`

---

## Running with Docker

### Step 1: Build Both Images

```bash
# Build backend
cd backend
docker build -t ai-reporting-backend .

# Build frontend
cd ../frontend
docker build -t ai-reporting-frontend .
```

### Step 2: Run Backend Container

```bash
docker run -d --name ai-backend -p 8000:8000 \
  -e DB_SERVER=your-server \
  -e DB_DATABASE=AIReporting \
  -e DB_USERNAME=your-username \
  -e DB_PASSWORD=your-password \
  ai-reporting-backend
```

### Step 3: Run Frontend Container

```bash
docker run -d --name ai-frontend -p 80:80 ai-reporting-frontend
```

### Step 4: Access Application

Open your browser and navigate to:
```
http://localhost
```

---

## Application Features

### 1. Dashboard
- **Overview Statistics**: View total initiatives, completed, in-progress, and ideation counts
- **Department Breakdown**: Bar chart showing initiatives by department
- **Benefit Analysis**: Pie chart showing initiatives by benefit category
- **Monthly Trends**: Line chart showing ROI metrics over time
- **Progress Tracking**: Average completion rate across all initiatives

### 2. Initiatives Management
- **View All Initiatives**: List all initiatives with filtering by status and department
- **Create New Initiative**: Form to capture all initiative details including:
  - Basic information (name, description, benefit, objective)
  - Department assignments (multi-select)
  - Ownership details (process owner, business owner)
  - Timeline information (start date, expected/actual completion)
  - Project details (priority, risk level, technology stack, budget)
- **Edit Initiative**: Update any initiative details
- **Delete Initiative**: Remove initiatives (with confirmation)
- **Quick Actions**: View, edit, or delete from the list view

### 3. Project View
- **Initiative Overview**: Detailed view of a specific initiative
- **Current Metrics**: Display latest month's metrics with trend indicators
- **Historical Trends**: Charts showing metric performance over time
- **Add Monthly Metrics**: Form to capture monthly ROI metrics including:
  - Customer experience score
  - Time saved (hours/month)
  - Cost saved (Rands/month)
  - Revenue increase (Rands/month)
  - Model accuracy
  - User adoption rate
  - Error rate
  - And more...
- **Metrics History**: Table showing all historical metrics

### 4. Featured Solutions
- **Monthly Showcase**: Display initiatives marked as featured
- **Filter by Month**: View featured solutions for specific months
- **Executive Summary**: Professional cards showing key information
- **Quick Navigation**: Link to full project details

### 5. Management View
- **Field Options Configuration**: Manage dropdown options for:
  - Benefit categories
  - Strategic objectives
  - Status options
  - Departments
  - Priority levels
  - Risk levels
- **Add/Edit/Delete Options**: Full CRUD operations on field options
- **Cascade Updates**: When updating an option, all initiatives using that option are updated
- **Custom Metrics**: Define new metrics to track for initiatives

---

## User Guide

### Creating Your First Initiative

1. Navigate to **Initiatives** page from the sidebar
2. Click **New Initiative** button
3. Fill in the required fields:
   - Use Case Name (required)
   - Description (required)
   - Benefit (required)
   - Strategic Objective (required)
   - Status (defaults to "Ideation")
4. Select departments (multi-select)
5. Add ownership and timeline information
6. Fill in project details
7. Click **Create Initiative**

### Adding Monthly Metrics

1. Navigate to **Initiatives** page
2. Click the **View** (eye icon) button on an initiative
3. Scroll to the **Monthly Metrics** section
4. Click **Add Monthly Metrics**
5. Select the reporting period (month/year)
6. Fill in the relevant metrics:
   - ROI Metrics (CX score, time saved, cost saved, revenue)
   - AI Performance Metrics (accuracy, adoption, error rate)
7. Add comments for context
8. Click **Save Metrics**

### Marking an Initiative as Featured

1. Navigate to **Initiatives** page
2. Click **Edit** on the initiative you want to feature
3. The backend automatically tracks featured status (you can implement a checkbox in the form if needed)
4. The initiative will appear on the **Featured Solutions** page

### Managing Field Options

1. Navigate to **Management** page from the sidebar
2. Scroll to the field category you want to manage
3. To add a new option:
   - Click **New Option**
   - Select the field name
   - Enter the option value
   - Set display order
   - Click **Create Option**
4. To edit an option:
   - Click the **Edit** icon
   - Modify the value or order
   - Click **Save**
5. To delete an option:
   - Click the **Delete** icon
   - Confirm deletion
   - Note: Existing initiatives retain the deleted value

---

## Troubleshooting

### Backend Issues

**Problem**: Cannot connect to database
```
Solution:
1. Verify SQL Server is running
2. Check firewall settings
3. Verify connection string in .env file
4. Test connection with SSMS/Azure Data Studio
5. Ensure ODBC Driver 17 is installed
```

**Problem**: Import error for pyodbc
```
Solution:
1. Ensure Visual C++ Redistributable is installed (Windows)
2. Reinstall pyodbc: pip uninstall pyodbc && pip install pyodbc
3. On Linux: sudo apt-get install unixodbc-dev
```

**Problem**: Permission denied when accessing database
```
Solution:
1. Check user has appropriate permissions
2. Grant necessary permissions:
   GRANT SELECT, INSERT, UPDATE, DELETE ON DATABASE::AIReporting TO [username]
```

### Frontend Issues

**Problem**: Cannot connect to backend API
```
Solution:
1. Verify backend is running on http://localhost:8000
2. Check REACT_APP_API_URL in .env file
3. Check browser console for CORS errors
4. Ensure Flask-CORS is properly configured in backend
```

**Problem**: npm install fails
```
Solution:
1. Delete node_modules folder and package-lock.json
2. Run: npm cache clean --force
3. Run: npm install
```

**Problem**: Charts not displaying
```
Solution:
1. Check browser console for errors
2. Verify recharts is installed: npm list recharts
3. Ensure data is being fetched from API
```

### Docker Issues

**Problem**: Container cannot connect to SQL Server on host
```
Solution:
1. Use host.docker.internal instead of localhost (Windows/Mac)
2. Use bridge network or host network mode
3. Ensure SQL Server allows remote connections
4. Check firewall rules
```

**Problem**: Docker build fails
```
Solution:
1. Ensure you're in the correct directory (backend or frontend)
2. Check Dockerfile syntax
3. Verify all required files exist
4. Check Docker daemon is running
```

---

## Default Credentials

For testing purposes, the application uses:
- **User Name**: Tester
- **Email**: test@tester.com

These are hardcoded in the backend (`DEFAULT_USER` in `app.py`). For production, you would integrate with your authentication system.

---

## API Endpoints Reference

### Health Check
- `GET /api/health` - Check API and database connectivity

### Dashboard
- `GET /api/dashboard/stats` - Get dashboard statistics
- `GET /api/dashboard/monthly-trends` - Get monthly ROI trends

### Initiatives
- `GET /api/initiatives` - Get all initiatives (supports filtering)
- `GET /api/initiatives/<id>` - Get specific initiative
- `POST /api/initiatives` - Create new initiative
- `PUT /api/initiatives/<id>` - Update initiative
- `DELETE /api/initiatives/<id>` - Delete initiative

### Metrics
- `GET /api/initiatives/<id>/metrics` - Get all metrics for initiative
- `GET /api/initiatives/<id>/metrics/<period>` - Get metrics for specific period
- `POST /api/initiatives/<id>/metrics` - Create/update monthly metrics

### Field Options
- `GET /api/field-options` - Get all field options
- `POST /api/field-options` - Create field option
- `PUT /api/field-options/<id>` - Update field option
- `DELETE /api/field-options/<id>` - Delete field option

### Custom Metrics
- `GET /api/custom-metrics` - Get custom metrics definitions
- `POST /api/custom-metrics` - Create custom metric

### Featured Solutions
- `GET /api/featured-solutions` - Get featured solutions

### Suggestions
- `GET /api/suggestions/process-owners` - Get process owner suggestions
- `GET /api/suggestions/business-owners` - Get business owner suggestions

---

## Support

For issues or questions, please contact the development team or create an issue in the project repository.

---

## License

Internal use only - TIH Organization
