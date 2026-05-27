# ═══════════════════════════════════════════════════════════════
# Makefile — Micro Frontend Developer Experience
# ═══════════════════════════════════════════════════════════════
#
# Usage:
#   make dev          # Start all services with Docker
#   make dev-shell    # Run shell app locally (hot reload)
#   make build        # Build all Docker images
#   make logs         # Follow all logs
#   make health       # Check all services health
#   make clean        # Remove all containers & volumes

.PHONY: dev dev-local dev-shell dev-react dev-vue dev-angular build push deploy \
        rollback logs logs-shell health clean help

# ── Variables ──
VERSION := $(shell git rev-parse --short HEAD 2>/dev/null || echo "local")
REGISTRY_URL ?= ghcr.io
REGISTRY_NAMESPACE ?= org

# ── Development ──

## Start all services with Docker Compose (build & run)
dev:
	docker compose up --build

## Start all services in background
dev-bg:
	docker compose up --build -d

## Run all services locally with hot reload (1 terminal via concurrently)
dev-local:
	npx concurrently -n shell,react,vue,angular -c cyan,blue,green,red \
		"cd shell-app && npm run dev" \
		"cd mfe-react && npm run dev" \
		"cd mfe-vue && npm run dev" \
		"cd mfe-angular && npm run start"

## Run shell app locally (hot reload)
dev-shell:
	cd shell-app && npm run dev

## Run React MFE locally (hot reload)
dev-react:
	cd mfe-react && npm run dev

## Run Vue MFE locally (hot reload)
dev-vue:
	cd mfe-vue && npm run dev

## Run Angular MFE locally (hot reload)
dev-angular:
	cd mfe-angular && npm run start

# ── Build ──

## Build all Docker images (parallel)
build:
	docker compose build --parallel

## Build a specific service (e.g., make build-service s=shell-app)
build-service:
	docker compose build $(s)

# ── Deploy ──

## Push images to registry
push:
	docker compose push

## Deploy production stack
deploy:
	VERSION=$(VERSION) docker compose -f docker-compose.prod.yml up -d

## Deploy with zero-downtime
deploy-rolling:
	VERSION=$(VERSION) docker compose -f docker-compose.prod.yml up -d --no-deps --scale shell-app=2

## Rollback to previous version
rollback:
	docker compose -f docker-compose.prod.yml rollback

# ── Monitoring ──

## Follow all service logs
logs:
	docker compose logs -f

## Follow shell app logs
logs-shell:
	docker compose logs -f shell-app

## Check all services health
health:
	@echo "Shell App ( :3000):"
	@curl -s -o /dev/null -w "%{http_code}" http://localhost:3000 || echo "DOWN"
	@echo ""
	@echo "React MFE ( :3001):"
	@curl -s -o /dev/null -w "%{http_code}" http://localhost:3001/remoteEntry.js || echo "DOWN"
	@echo ""
	@echo "Vue MFE ( :3002):"
	@curl -s -o /dev/null -w "%{http_code}" http://localhost:3002/assets/remoteEntry.js || echo "DOWN"
	@echo ""
	@echo "Angular MFE ( :3003):"
	@curl -s -o /dev/null -w "%{http_code}" http://localhost:3003 || echo "DOWN"
	@echo ""

# ── Maintenance ──

## Stop all services
stop:
	docker compose down

## Stop and remove volumes
clean:
	docker compose down --volumes --remove-orphans
	docker system prune -f

## Reset everything (clean + rebuild)
reset: clean
	docker compose build --parallel

# ── Help ──

## Show available commands
help:
	@echo "Micro Frontend Makefile"
	@echo "======================="
	@echo ""
	@echo "Development:"
	@echo "  make dev          Start all services (Docker)"
	@echo "  make dev-local    Start all services locally (hot reload, 1 terminal)"
	@echo "  make dev-shell    Run shell app locally"
	@echo "  make dev-react    Run React MFE locally"
	@echo "  make dev-vue      Run Vue MFE locally"
	@echo "  make dev-angular  Run Angular MFE locally"
	@echo ""
	@echo "Build & Deploy:"
	@echo "  make build        Build all Docker images"
	@echo "  make deploy       Deploy to production"
	@echo "  make rollback     Rollback to previous version"
	@echo ""
	@echo "Monitoring:"
	@echo "  make logs         Follow all logs"
	@echo "  make health       Check services health"
	@echo ""
	@echo "Maintenance:"
	@echo "  make clean        Remove containers & volumes"
	@echo "  make reset        Clean + rebuild all"
