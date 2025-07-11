FROM python:3.11-alpine

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# Set working directory
WORKDIR /backend

# Update repositories and install dependencies
RUN apk add --no-cache \
    build-base \
    libffi-dev \
    postgresql-dev \
    python3-dev \
    openssl-dev \
    rust \
    cargo \
    bash \
    gcc \
    musl-dev \
    curl

# Copy Python requirements
COPY requirements.txt .

# Install Python dependencies
RUN pip install --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Expose Django development port
EXPOSE 8000

# Default run command
CMD ["python", "manage.py", "runserver", "0.0.0.0:8000"]