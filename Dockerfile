FROM python:3.13.0-alpine3.20

ENV PYTHONUNBUFFERED 1

# Install Python dependencies first
RUN pip install --upgrade pip

# Install PostgreSQL client
RUN apk add --update --upgrade --no-cache postgresql-client

# Install build tools
RUN apk add --update --upgrade --no-cache --virtual .tmp build-base postgresql-dev libffi-dev musl-dev

# Install Python requirements
RUN pip install --no-cache-dir -r /requirements.txt

# Clean up build dependencies
RUN apk del .tmp

# Use the latest Node.js version
RUN npm install -g npm@latest

# Clear npm cache before installing dependencies
RUN npm cache clean --force

# Install dependencies using npm ci
RUN npm ci

COPY ./requirements.txt /requirements.txt

RUN pip install --upgrade pip && \
    apk add --update --upgrade --no-cache postgresql-client && \
    apk add --update --upgrade --no-cache --virtual .tmp \
        build-base postgresql-dev && \
    pip install --no-cache-dir -r /requirements.txt && apk del .tmp

COPY ./backend /backend
WORKDIR /backend

CMD ["python", "manage.py", "runserver", "0.0.0.0:8000"]