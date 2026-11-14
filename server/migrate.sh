#!/bin/sh
# Apply database migrations and the idempotent RBAC/admin seeds.
# Run on AWS with: aws lambda invoke --function-name <worker> --payload '{"task":"migrate"}' out.json
set -e

echo "Running database migrations..."
alembic upgrade head

echo "Seeding RBAC features, roles, and permissions..."
python -m seeds.rbac_user_management

echo "Seeding system administrator..."
python -m seeds.system_admin
