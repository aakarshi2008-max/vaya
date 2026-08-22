FROM python:3.12-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies first (cached layer)
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend source
COPY backend ./backend

# Default: run embedding service
# Override CMD to run ingestion: python backend/ingest_msmarco_xi.py
EXPOSE 8081
CMD ["uvicorn", "backend.embed_service:app", "--host", "0.0.0.0", "--port", "8081", "--workers", "2"]
