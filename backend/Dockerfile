FROM python:3.11-slim

# Set work directory
WORKDIR /app

# Update the package list and install necessary packages
RUN apt-get update && \
    apt-get install -y \
    curl \
    apt-transport-https \
    gnupg2 \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

RUN apt-get update && \
    apt-get install -y gnupg2

# Add the Microsoft repository key
RUN curl https://packages.microsoft.com/keys/microsoft.asc | gpg --dearmor > microsoft.gpg

RUN cp ./microsoft.gpg /etc/apt/trusted.gpg.d/

# Add the Microsoft repository
RUN curl https://packages.microsoft.com/config/ubuntu/20.04/prod.list > /etc/apt/sources.list.d/mssql-release.list

# Update the package list again
RUN apt-get update

# Install the msodbcsql17 driver and dependencies
RUN ACCEPT_EULA=Y apt-get install -y msodbcsql17

# Install optional: UnixODBC development headers
RUN apt-get install -y unixodbc-dev

# Clean up
RUN apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# Copy requirements and install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application files
COPY . .

# Expose port
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8000/api/health || exit 1

# Run application
CMD ["python", "app.py"]
