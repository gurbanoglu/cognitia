FROM python:3.11-alpine

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

WORKDIR /app

# TEMP: Don't install anything yet — debug inside container
CMD ["/bin/sh"]