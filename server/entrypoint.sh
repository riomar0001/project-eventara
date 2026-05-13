#!/bin/sh
set -e

echo "Running database migrations..."
alembic upgrade head

echo "Seeding RBAC features, roles, and permissions..."
python -m seeds.rbac_user_management

echo "Seeding system administrator..."
python -m seeds.system_admin

echo "Starting Eventara API..."
exec uvicorn main:app --host 0.0.0.0 --port 8000
