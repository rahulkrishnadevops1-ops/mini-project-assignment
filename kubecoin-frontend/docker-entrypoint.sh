#!/bin/sh
set -e
# Docker Entrypoint Script
# This script runs when the container starts

# Discover DNS resolver from the system (works in Docker, Kubernetes, anywhere)
# Reads the nameserver from /etc/resolv.conf
DNS_RESOLVER=$(grep -m1 '^nameserver' /etc/resolv.conf | awk '{print $2}')

# Fallback to common defaults if not found
if [ -z "$DNS_RESOLVER" ]; then
    DNS_RESOLVER="127.0.0.11"  # Docker default
fi

echo "Using DNS resolver: $DNS_RESOLVER"

# Export for envsubst
export DNS_RESOLVER
export BACKEND_URL

# Replace variables in nginx config template
envsubst '${BACKEND_URL} ${DNS_RESOLVER}' < /etc/nginx/nginx.conf.template > /etc/nginx/nginx.conf

# Start nginx in foreground
exec nginx -g 'daemon off;'
