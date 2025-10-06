# AI Reporting Dashboard

A comprehensive web application for tracking, managing, and reporting on AI initiatives across an organization.

## Features

- **Dashboard**: Executive-level overview with key statistics and trends
- **Initiative Management**: Full CRUD operations for AI initiatives
- **Project View**: Detailed metrics tracking with monthly ROI measurements
- **Featured Solutions**: Showcase highlighted initiatives for reporting
- **Management Console**: Configure field options and custom metrics
- **ROI Tracking**: Monitor time saved, cost savings, revenue impact, and more
- **AI Performance Metrics**: Track model accuracy, user adoption, error rates
- **Trend Analysis**: Historical charts showing metric performance over time

## Technology Stack

### Backend
- Python 3.11
- Flask 3.0
- SQL Server (with pyodbc)
- Docker support

### Frontend
- React 18
- React Router
- Recharts (for data visualization)
- Axios (for API calls)
- Lucide React (for icons)

## Quick Start

### Prerequisites
- Python 3.11+
- Node.js 18+
- SQL Server 2019+
- ODBC Driver 17 for SQL Server

### Installation

1. **Clone the repository**
   ```bash
   cd ai-reporting
   ```

2. **Set up the database**
   - Create a database named `AIReporting`
   - Run `backend/sql_init_ai_reporting.sql` to create tables and seed data

3. **Start the backend**
   ```bash
   cd backend
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   pip install -r requirements.txt
   cp .env.example .env
   # Edit .env with your database connection details
   python app.py
   ```

4. **Start the frontend**
   ```bash
   cd frontend
   npm install
   cp .env.example .env
   # Edit .env if needed (default: http://localhost:8000)
   npm start
   ```

5. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8000

## Docker Deployment

### Build and run with Docker

**Backend:**
```bash
cd backend
docker build -t ai-reporting-backend .
docker run -d -p 8000:8000 \
  -e DB_SERVER=your-server \
  -e DB_DATABASE=AIReporting \
  -e DB_USERNAME=your-username \
  -e DB_PASSWORD=your-password \
  ai-reporting-backend
```

**Frontend:**
```bash
cd frontend
docker build -t ai-reporting-frontend .
docker run -d -p 80:80 ai-reporting-frontend
```

## Project Structure

```
ai-reporting/
├── backend/
│   ├── app.py                          # Flask application
│   ├── sql_init_ai_reporting.sql       # Database schema
│   ├── requirements.txt                # Python dependencies
│   ├── Dockerfile                      # Backend Docker config
│   └── .env.example                    # Environment variables template
├── frontend/
│   ├── src/
│   │   ├── components/                 # React components
│   │   ├── pages/                      # Page components
│   │   ├── services/                   # API service layer
│   │   ├── config/                     # Configuration files
│   │   ├── App.js                      # Main app component
│   │   └── index.js                    # Entry point
│   ├── public/
│   ├── package.json                    # Node dependencies
│   ├── Dockerfile                      # Frontend Docker config
│   └── nginx.conf                      # Nginx configuration
├── IMPLEMENTATION_GUIDE.md             # Detailed setup guide
└── README.md                           # This file
```

## Key Pages

1. **Dashboard** (`/`) - Executive overview with statistics and charts
2. **Initiatives** (`/initiatives`) - List and manage all initiatives
3. **Initiative Form** (`/initiatives/new`, `/initiatives/:id/edit`) - Create/edit initiatives
4. **Project View** (`/initiatives/:id`) - Detailed view with metrics tracking
5. **Featured Solutions** (`/featured`) - Showcase featured initiatives
6. **Management** (`/management`) - Configure field options and custom metrics

## Documentation

For detailed setup instructions, troubleshooting, and user guides, see:
- [IMPLEMENTATION_GUIDE.md](./IMPLEMENTATION_GUIDE.md)

## Default Test User

- Name: Tester
- Email: test@tester.com

## API Documentation

The backend provides a RESTful API. Key endpoints:

- `GET /api/health` - Health check
- `GET /api/dashboard/stats` - Dashboard statistics
- `GET /api/initiatives` - List initiatives
- `POST /api/initiatives` - Create initiative
- `PUT /api/initiatives/:id` - Update initiative
- `DELETE /api/initiatives/:id` - Delete initiative
- `GET /api/initiatives/:id/metrics` - Get initiative metrics
- `POST /api/initiatives/:id/metrics` - Save monthly metrics

For a complete API reference, see the [IMPLEMENTATION_GUIDE.md](./IMPLEMENTATION_GUIDE.md).

## Contributing

This is an internal TIH application. For contributions or issues, please contact the development team.

## License

Internal use only - TIH Organization
