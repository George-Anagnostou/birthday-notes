#!/bin/bash

# Health check script for birthday-notes deployments
# Usage: ./scripts/check-health.sh <deployment-url> [admin-password]

if [ -z "$1" ]; then
  echo "Usage: ./scripts/check-health.sh <deployment-url> [admin-password]"
  echo "Example: ./scripts/check-health.sh https://your-app.vercel.app GeorgeAdmin31415"
  exit 1
fi

URL="$1"
ADMIN_PASSWORD="${2:-GeorgeAdmin31415}"

echo "🔍 Checking health for: $URL"
echo ""

# Basic health check (no auth)
echo "📋 Basic Health Check:"
curl -s "$URL/api/health" | jq . 2>/dev/null || curl -s "$URL/api/health"
echo ""
echo ""

# Detailed health check (with admin password)
echo "🔐 Detailed Health Check (with admin password):"
curl -s -H "x-admin-password: $ADMIN_PASSWORD" "$URL/api/health" | jq . 2>/dev/null || curl -s -H "x-admin-password: $ADMIN_PASSWORD" "$URL/api/health"
echo ""
