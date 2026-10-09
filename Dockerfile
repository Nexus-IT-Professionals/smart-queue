# One image: build the frontend, serve it with the API (TECHNICAL_PROPOSAL §3 Packaging).
# Base images pinned to exact tags (Node matches frontend/.nvmrc). Image build not yet smoke-tested.

FROM node:25.9.0-slim AS web
WORKDIR /web
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

FROM python:3.12.15-slim
WORKDIR /app
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY backend/ ./
COPY --from=web /web/dist ./static
ENV STATIC_DIR=/app/static \
    DATABASE_PATH=/data/smart_queue.db
EXPOSE 8000
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
