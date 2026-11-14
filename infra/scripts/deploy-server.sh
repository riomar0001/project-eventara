#!/usr/bin/env bash
# Build the server image, push it to ECR, roll it out to both Lambdas with
# Terraform, then run migrations. Run from the repository root:
#   infra/scripts/deploy-server.sh            # tag = current git SHA
#   ARCH=arm64 infra/scripts/deploy-server.sh # if lambda_architecture = arm64
set -euo pipefail

TF_DIR="infra/terraform"
ARCH="${ARCH:-x86_64}"
TAG="${TAG:-$(git rev-parse --short=12 HEAD)}"

case "$ARCH" in
  x86_64) PLATFORM="linux/amd64" ;;
  arm64)  PLATFORM="linux/arm64" ;;
  *) echo "ARCH must be x86_64 or arm64" >&2; exit 1 ;;
esac

if [ -n "$(git status --porcelain -- server)" ]; then
  echo "server/ has uncommitted changes; commit them so the image tag matches the code." >&2
  exit 1
fi

# The ECR repository must exist before the first image push.
terraform -chdir="$TF_DIR" apply -target=aws_ecr_repository.server -var "image_tag=$TAG" -auto-approve
REPO="$(terraform -chdir="$TF_DIR" output -raw ecr_repository_url)"
REGION="$(echo "$REPO" | cut -d. -f4)"
REGISTRY="${REPO%%/*}"

aws ecr get-login-password --region "$REGION" | docker login --username AWS --password-stdin "$REGISTRY"
docker build --platform "$PLATFORM" --provenance=false -t "$REPO:$TAG" server
docker push "$REPO:$TAG"

terraform -chdir="$TF_DIR" apply -var "image_tag=$TAG" -var "lambda_architecture=$ARCH"

WORKER="$(terraform -chdir="$TF_DIR" output -raw worker_function_name)"
echo "Running migrations on $WORKER..."
aws lambda invoke --region "$REGION" --function-name "$WORKER" \
  --cli-binary-format raw-in-base64-out --payload '{"task":"migrate"}' \
  --cli-read-timeout 310 migrate-result.json >/dev/null
cat migrate-result.json; echo
grep -q '"exit_code": *0' migrate-result.json || { echo "Migration failed" >&2; exit 1; }
rm -f migrate-result.json
echo "Deployed $TAG"
