FROM python:3.11-alpine

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

WORKDIR /app

COPY requirements.txt /requirements.txt

# Update pip
RUN pip install --upgrade pip

# Install system dependencies
RUN apk add --no-cache postgresql-client \
    && apk add --no-cache --virtual .tmp build-base postgresql-dev

# Install Python packages
RUN pip install --no-cache-dir -r /requirements.txt

# Clean up
RUN apk del .tmp

COPY . /app/