# enterprise-rag-pipeline

An asynchronous, enterprise-grade Retrieval-Augmented Generation (RAG) pipeline with vector search and background task processing.

## Stack

- FastAPI API server for uploads and document status APIs
- Celery worker for asynchronous PDF processing
- PostgreSQL for metadata persistence
- Redis as Celery broker/backend
- Qdrant as vector database
- Next.js frontend for upload and status dashboard

## Services

The root `docker-compose.yml` includes:

- `db` (PostgreSQL 15) on `5432`
- `redis` on `6379`
- `vector_db` (Qdrant) on `6333`
- `api` (FastAPI) on `8000`
- `worker` (Celery)
- `frontend` (Next.js) on `3000`

## Run

From the repository root:

```bash
docker compose up --build
```

Open:

- Frontend: `http://localhost:3000`
- API docs: `http://localhost:8000/docs`

## Local Runtime (Single Env File)

When Docker is unavailable in the current environment:

1. Copy `.env.example` to `.env` and adjust ports/values if needed.
2. Start both backend and frontend from one command:

```bash
./scripts/dev-up.sh
```

`frontend/next.config.ts` proxies `/api/v1/*` to `API_SERVER_URL`, so browser requests stay same-origin and work in forwarded web environments.

3. Stop both services:

```bash
./scripts/dev-down.sh
```

## API

- `POST /api/v1/upload` accepts multipart form-data with field name `file`
- `GET /api/v1/documents` returns uploaded documents and current processing status
- `GET /api/v1/documents/{id}` returns details for a single document
- `GET /api/v1/summary` returns aggregate totals by status
- `GET /health` returns API health status

## Health Checks

- Compose includes healthchecks for PostgreSQL, Redis, and Backend.
- Frontend waits for Backend health before start.
- Worker waits for PostgreSQL and Redis health before start.

## Devcontainer

`.devcontainer/devcontainer.json` uses:

- Base image: `mcr.microsoft.com/devcontainers/python:3.11`
- Node.js 20 feature
- VS Code extensions for Python, formatting, linting, SQL tools, and Prettier
