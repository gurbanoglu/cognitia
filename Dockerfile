# Use a slim, official base image
FROM python:3.11-alpine

# Set environment variables to reduce noise and avoid .pyc files
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# Set working directory
WORKDIR /app

# Ensure Alpine community repo is available (only needed once)
RUN echo "https://dl-cdn.alpinelinux.org/alpine/v3.18/community" >> /etc/apk/repositories

# (Optional) Show Alpine version for debug clarity
RUN cat /etc/alpine-release

# Install system dependencies with verbose output
RUN apk update && apk add --no-cache \
    build-base \
    libffi-dev \
    postgresql-dev \
    python3-dev \
    openssl-dev \
    cargo

# Install Python dependencies separately to leverage Docker layer caching
COPY requirements.txt .

RUN pip install --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Copy application code last (so app changes don't invalidate earlier layers)
COPY . .

# # (Optional) Show Alpine version for debug clarity
# RUN cat /etc/alpine-release

# Set default run command — adjust for production as needed
CMD ["python", "manage.py", "runserver", "0.0.0.0:8000"]