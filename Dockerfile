FROM python:3.11-alpine

WORKDIR /app

# Debug Alpine version and repo config
RUN cat /etc/alpine-release
RUN cat /etc/apk/repositories

# Add community repo if missing
RUN echo "https://dl-cdn.alpinelinux.org/alpine/v3.22/community" >> /etc/apk/repositories

# Update and install dependencies with verbose output
RUN apk update -v && apk add --no-cache -v \
    gcc \
    musl-dev \
    libffi-dev \
    postgresql-dev \
    python3-dev \
    build-base
