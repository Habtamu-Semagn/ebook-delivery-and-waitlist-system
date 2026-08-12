#!/bin/bash

SECRET="super-secret-jwt-token-with-at-least-32-characters-long"
IAT=$(date +%s)
EXP=$((IAT + 315360000))  # 10 years from now

# Create anon token
ANON_HEADER='{"alg":"HS256","typ":"JWT"}'
ANON_PAYLOAD="{\"role\":\"anon\",\"iss\":\"supabase\",\"iat\":${IAT},\"exp\":${EXP}}"

# Base64url encode
b64enc() { openssl enc -base64 -A | tr '+/' '-_' | tr -d '='; }

ANON_HEADER_B64=$(echo -n "$ANON_HEADER" | b64enc)
ANON_PAYLOAD_B64=$(echo -n "$ANON_PAYLOAD" | b64enc)
ANON_SIGNATURE=$(echo -n "${ANON_HEADER_B64}.${ANON_PAYLOAD_B64}" | openssl dgst -binary -sha256 -hmac "$SECRET" | b64enc)
ANON_TOKEN="${ANON_HEADER_B64}.${ANON_PAYLOAD_B64}.${ANON_SIGNATURE}"

# Create service_role token
SERVICE_PAYLOAD="{\"role\":\"service_role\",\"iss\":\"supabase\",\"iat\":${IAT},\"exp\":${EXP}}"

SERVICE_PAYLOAD_B64=$(echo -n "$SERVICE_PAYLOAD" | b64enc)
SERVICE_SIGNATURE=$(echo -n "${ANON_HEADER_B64}.${SERVICE_PAYLOAD_B64}" | openssl dgst -binary -sha256 -hmac "$SECRET" | b64enc)
SERVICE_TOKEN="${ANON_HEADER_B64}.${SERVICE_PAYLOAD_B64}.${SERVICE_SIGNATURE}"

echo "SUPABASE_ANON_KEY=$ANON_TOKEN"
echo ""
echo "SUPABASE_SERVICE_ROLE_KEY=$SERVICE_TOKEN"
