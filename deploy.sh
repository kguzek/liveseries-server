#!/bin/bash

REGISTRY_HOSTNAME="${REGISTRY_HOSTNAME:-registry.guzek.uk}"
PROJECT_NAME='liveseries'

for dockerfile in ./Dockerfile.*; do
  repository=${dockerfile#./Dockerfile.}
  tag="$REGISTRY_HOSTNAME/$PROJECT_NAME/$repository:latest"

  echo "Building $repository..."
  build_output=$(docker build -t "$tag" -f "$dockerfile" . 2>&1)

  total_steps=$(grep -E '^(RUN|WORKDIR|COPY)' $dockerfile | wc -l)
  cached_steps=$(echo "$build_output" | grep -c "CACHED")

  echo -n "$cached_steps/$total_steps build steps were cached. "
  if [[ "$cached_steps" -lt "$total_steps" || $1 = "--force" ]]; then
    echo "Pushing image..."
    docker push "$tag"
    digest=$(docker image inspect "$tag" --format '{{index .RepoDigests 0}}' | grep "^$REGISTRY_HOSTNAME/")
    cosign sign --yes "$digest"
  else
    echo "Skipping push."
  fi
  echo
done
