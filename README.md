# Enterprise RAG Pipeline

Production-minded document ingestion pipeline for Retrieval-Augmented Generation (RAG) systems.

This project demonstrates how to move from simple file uploads to a reliable ingestion control plane with async processing, status observability, and environment-aware deployment paths.

## Why This Exists

Most RAG prototypes break down at ingestion time: uploads are opaque, processing is brittle, and operators have no visibility into queue state or failures.

This repository focuses on that operational gap:

- Controlled ingestion entry point (FastAPI)
- Async processing workflow (Celery)
- Persistent metadata tracking (PostgreSQL/SQLite for local)
- Vector-store integration boundary (Qdrant)
- Operator dashboard with live status and summaries (Next.js)

## Architecture

```text
[Next.js UI]
	|
	| HTTP multipart upload
	v
[FastAPI API] -----> [PostgreSQL metadata]
	|
	| enqueue
	v
[Celery Worker] -----> [Qdrant vector DB]
```

Core implementation goals:

- Separate request handling from heavy processing
- Keep data flow explicit and testable
- Preserve observability through first-class status endpoints
- Support both containerized and constrained local environments

## Tech Stack

- Backend: FastAPI, SQLAlchemy, Celery
- Data: PostgreSQL (container mode), SQLite (local fallback runtime)
- Queue: Redis (container mode), memory broker option for constrained local runtime
- Vector Layer: Qdrant
- Frontend: Next.js (App Router, TypeScript, Tailwind)
- Dev Environment: Dev Container (Python 3.11 + Node 20)

## Runtime Modes

### 1) Containerized Mode (Primary)

Uses root `docker-compose.yml` with:

- `db` (PostgreSQL 15)
- `redis`
- `vector_db` (Qdrant)
- `api` (FastAPI)
- `worker` (Celery)
- `frontend` (Next.js)

Start:

```bash
docker compose up --build
```

### 2) Local Scripted Mode (Constrained Environments)

When Docker is unavailable, use a single env file and script-driven startup.

1. Create runtime config:

```bash
cp .env.example .env
```

2. Start both services:

```bash
./scripts/dev-up.sh
```

3. Stop both services:

```bash
./scripts/dev-down.sh
```

Notes:

- `frontend/next.config.ts` rewrites `/api/v1/*` to `API_SERVER_URL`.
- This keeps browser calls same-origin and avoids forwarded-port CORS issues in web IDEs.

## API Surface

- `POST /api/v1/upload`: Upload a document and dispatch processing
- `GET /api/v1/documents`: List documents with status metadata
- `GET /api/v1/documents/{id}`: Get a single document record
- `GET /api/v1/summary`: Aggregate status counters
- `GET /health`: Service health probe

## Operational Characteristics

- Async-first ingestion with queue-backed processing path
- Health endpoints and compose healthchecks for service readiness
- Status-driven UI for operator visibility
- Graceful degraded behavior in local mode when infra services are absent
- Scripted startup with PID/log files for quick local control

## Repository Highlights

- `backend/main.py`: API entrypoint, upload flow, status endpoints
- `backend/worker.py`: Processing task, status transitions, vector step
- `frontend/src/components/Uploader.tsx`: Upload interaction and dispatch
- `frontend/src/components/StatusList.tsx`: Live status board and detail panel
- `frontend/src/lib/apiClient.ts`: Environment-aware API resolution strategy
- `scripts/dev-up.sh`: One-command local orchestration

## Developer Experience

`.devcontainer/devcontainer.json` includes:

- Python 3.11 base image
- Node 20 feature
- Docker-in-Docker feature for container workflows
- VS Code extensions for linting, formatting, and SQL tooling

## Roadmap Candidates

- Retry policies and dead-letter handling for failed jobs
- Structured logging and trace correlation IDs
- AuthN/AuthZ for ingestion endpoints
- Chunk embedding pipeline with collection versioning
- Integration and contract test suite across API and worker boundaries

## Summary

This project is intentionally structured like an engineering deliverable, not a demo page:

- observable
- asynchronous
- environment-aware
- deployment-ready

It provides a strong foundation for enterprise-grade document ingestion in RAG platforms.
