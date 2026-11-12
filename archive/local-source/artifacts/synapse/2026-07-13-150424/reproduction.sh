#!/bin/bash
# Reproduction instructions for Synapse DB and Docker benchmarks.

# 1. DB Benchmark
# Command:
# DB_HOST=127.0.0.1 npx tsx db-benchmark.ts
#
# Prerequisite: MySQL running via Docker compose:
# cd packages/backend && docker-compose up -d mysql

# 2. Docker Memory Benchmark
# Commands:
# docker build -f packages/backend/Dockerfile.local -t web23-backend-local .
# docker build -f packages/backend/Dockerfile.dev -t web23-backend-dev .
#
# Running local:
# docker run -d --name temp-local --network backend_web23-network -p 8010:8000 --env-file packages/backend/.env -e DB_HOST=mysql web23-backend-local
# (Wait 12s and measure MEM USAGE using 'docker stats --no-stream temp-local')
#
# Running optimized:
# docker run -d --name temp-dev --network backend_web23-network -p 8011:8000 --env-file packages/backend/.env -e DB_HOST=mysql web23-backend-dev
# (Wait 12s and measure MEM USAGE using 'docker stats --no-stream temp-dev')
