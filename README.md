# CTSE Microservices - Production Ready Architecture

This is the actual project repository root.

## Services

- `api-gateway` (port `8000`)
- `user-service` (port `3001`)
- `product-service` (port `3002`)
- `order-service` (port `3003`)
- `payment-service` (port `3004`)
- `cart-service` (port `3005`)

## Documentation

Team instructions are in `Instructions/`.

Production architecture reference:

- `ARCHITECTURE/PRODUCTION_SYSTEM_BLUEPRINT.md` (overall system diagram + per-service diagrams + production hardening roadmap)
- `ARCHITECTURE/PROJECT_REPORT.md` (submission-ready report covering architecture, communication, DevOps/security, and challenges)

Start with:

1. `Instructions/00_START_HERE.md`
2. `Instructions/PRE_LOCAL_TESTING_CHECKLIST.md`
3. `Instructions/IMPLEMENTATION_STATUS.md`

## Local Setup (Node.js)

Run from this directory:

```powershell
cd api-gateway; npm install
cd ../user-service; npm install
cd ../product-service; npm install
cd ../order-service; npm install
cd ../payment-service; npm install
cd ../cart-service; npm install
```

Create `.env` files from `.env.example` in each service, then run `npm run dev` in separate terminals.

## Local Setup (Docker)

Run from this directory:

```powershell
docker compose build
docker compose up -d
docker compose ps
```

Health checks:

```powershell
Invoke-WebRequest http://localhost:8000/health -UseBasicParsing
Invoke-WebRequest http://localhost:3001/health -UseBasicParsing
Invoke-WebRequest http://localhost:3002/health -UseBasicParsing
Invoke-WebRequest http://localhost:3003/health -UseBasicParsing
Invoke-WebRequest http://localhost:3004/health -UseBasicParsing
Invoke-WebRequest http://localhost:3005/health -UseBasicParsing
```

Stop:

```powershell
docker compose down
```

## CI/CD And Security

GitHub Actions workflows are now included:

- `.github/workflows/ci.yml`
	- Installs dependencies for all 6 services
	- Runs syntax checks (`node -c`) across service source files
	- Validates `docker-compose.yml`
	- Performs Docker build smoke tests for all services

- `.github/workflows/security.yml`
	- Runs `npm audit` across all services (high/critical visibility)
	- Runs CodeQL static analysis for JavaScript

- `.github/workflows/docker-publish.yml`
	- Manual or tag-based Docker image publish pipeline
	- Publishes all 6 service images to Docker Hub
	- Requires repository secrets (below)

- `.github/dependabot.yml`
	- Weekly dependency update PRs for each service

## Required Repository Secrets

For Docker image publishing:

- `DOCKERHUB_USERNAME`
- `DOCKERHUB_TOKEN`

For optional SonarCloud extension later:

- `SONAR_TOKEN`

## Next Step (Cloud)

1. Push this repository to GitHub.
2. Confirm Actions tab shows successful CI.
3. Add Docker Hub secrets.
4. Run `Docker Publish` workflow manually.
5. Deploy published images to your target platform (AWS ECS, Azure Container Apps, or GCP Cloud Run).

## AWS Free Tier Deployment (EC2 + Docker Compose)

Production-ready deployment assets are now included:

- `docker-compose.aws.yml` (hardened compose for EC2)
- `.env.production.example` (production env template)
- `frontend/Dockerfile` + `frontend/nginx.conf` (serves SPA and proxies `/api` to gateway)
- `AWS_FREE_TIER_DEPLOYMENT_GUIDE.md` (step-by-step deployment guide)

Quick start on EC2:

```bash
cp .env.production.example .env.production
docker compose -f docker-compose.aws.yml --env-file .env.production up -d --build
```