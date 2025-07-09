# Use official lightweight Python Alpine image
FROM python:3.11-alpine

# Set environment variables to avoid .pyc files and enable unbuffered output
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# Set working directory in the container
WORKDIR /app

# Add community repo in case it's missing (important for some packages)
RUN echo "https://dl-cdn.alpinelinux.org/alpine/v3.22/community" >> /etc/apk/repositories

# Update apk and install system dependencies for Python packages and PostgreSQL client libraries
RUN apk update && apk add --no-cache \
    gcc \
    musl-dev \
    libffi-dev \
    postgresql-dev \
    python3-dev \
    build-base

# Copy requirements.txt separately for better Docker cache utilization
COPY requirements.txt .

# Upgrade pip and install Python dependencies
RUN pip install --upgrade pip \
    && pip install --no-cache-dir -r requirements.txt

# Copy the rest of your app code
COPY . .

# Default command to run your Django development server (adjust as needed)
CMD ["python", "manage.py", "runserver", "0.0.0.0:8000"]