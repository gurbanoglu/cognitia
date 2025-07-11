# Use a slim, official base image
FROM python:3.11-alpine

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# Set working directory
WORKDIR /app

# Add community repository for Alpine (fixes some missing packages)
RUN echo "https://dl-cdn.alpinelinux.org/alpine/edge/community" >> /etc/apk/repositories

# Install dependencies
RUN apk update && apk add --no-cache \
    build-base \
    libffi-dev \
    postgresql-dev \
    python3-dev \
    openssl-dev \
    cargo \
    bash \
    curl \
    gcc \
    musl-dev

# Copy Python dependencies first
COPY requirements.txt .

# Install Python dependencies
RUN pip install --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Copy the rest of the application code
COPY . .

# Expose Django port
EXPOSE 8000

# Default command
CMD ["python", "manage.py", "runserver", "0.0.0.0:8000"]