FROM python:3.11-alpine

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

WORKDIR /app

COPY requirements.txt .

# Install system dependencies required for psycopg2 and other packages
RUN apk update && apk add --no-cache \
    gcc \
    musl-dev \
    libffi-dev \
    postgresql-dev \
    python3-dev \
    build-base

# Install Python dependencies
RUN pip install --upgrade pip \
    && pip install --no-cache-dir -r requirements.txt

COPY . .