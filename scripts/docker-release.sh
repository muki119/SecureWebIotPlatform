#!/usr/bin/env bash
# Build + push a versioned image for one package release.
# Invoked by release.config.base.js's @semantic-release/exec publishCmd, with
# cwd set to the package being released (services/<svc> or app).
#
# Usage: docker-release.sh <image> <dockerfile> <context> <version>
set -euo pipefail

image="$1"
dockerfile="$2"
context="$3"
version="$4"

major="${version%%.*}"
rest="${version#*.}"
minor="${rest%%.*}"

echo "Releasing ${image}:${version} (from ${dockerfile}, context ${context})"

docker buildx build --push \
	--build-arg "VERSION=${version}" \
	--label "org.opencontainers.image.version=${version}" \
	--label "org.opencontainers.image.revision=${GITHUB_SHA:-unknown}" \
	-t "${image}:${version}" \
	-t "${image}:${major}.${minor}" \
	-t "${image}:${major}" \
	-t "${image}:latest" \
	-f "${dockerfile}" "${context}"
