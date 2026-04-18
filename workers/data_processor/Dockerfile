FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    curl \
    libmagic1 \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements
COPY ../shared/requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Copy shared utilities
COPY ../shared ./shared

# Expose port (Railway sets PORT env var)
ENV PYTHONUNBUFFERED=1

# Run worker
CMD ["python", "main.py"]
