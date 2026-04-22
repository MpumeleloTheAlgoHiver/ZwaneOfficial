#!/bin/bash

# Load Environment Variables
ENV_FILE="public/user/.env"
if [ -f "$ENV_FILE" ]; then
    export $(grep -v '^#' $ENV_FILE | xargs)
fi

URL="$VITE_SUPABASE_URL/rest/v1"
KEY="$VITE_SUPABASE_ANON_KEY"

echo "🚀 Injecting Showcase Identity Data..."

# 1. Seed Consumers
curl -X POST "$URL/consumers" \
  -H "apikey: $KEY" \
  -H "Authorization: Bearer $KEY" \
  -H "Content-Type: application/json" \
  -H "Prefer: resolution=merge-duplicates" \
  -d '[
    {"first_name": "Thabo", "surname": "Mokoena", "sa_id": "8501015800081"},
    {"first_name": "Nomvula", "surname": "Zwane", "sa_id": "9205120123085"},
    {"first_name": "Pieter", "surname": "Botha", "sa_id": "7811235012081"},
    {"first_name": "Sarah", "surname": "Naidoo", "sa_id": "8806040124089"},
    {"first_name": "Lindiwe", "surname": "Sisulu", "sa_id": "9507150156082"},
    {"first_name": "Kabelo", "surname": "Molefe", "sa_id": "8203105123084"},
    {"first_name": "Johan", "surname": "Venter", "sa_id": "7409215012087"},
    {"first_name": "Ayesha", "surname": "Khan", "sa_id": "9102280123081"},
    {"first_name": "Bongani", "surname": "Dlamini", "sa_id": "8712125123083"},
    {"first_name": "Elena", "surname": "Smith", "sa_id": "9404050123086"}
  ]'

echo -e "\n✅ Consumers Injected."

# 2. Seed Submission History
curl -X POST "$URL/sacrra_extract_runs" \
  -H "apikey: $KEY" \
  -H "Authorization: Bearer $KEY" \
  -H "Content-Type: application/json" \
  -H "Prefer: resolution=merge-duplicates" \
  -d '[
    {"month_end": "2023-10", "record_count": 1284502, "status": "ACCEPTED"},
    {"month_end": "2023-09", "record_count": 1281200, "status": "ACCEPTED"}
  ]'

echo -e "\n✅ History Injected. Refresh your dashboard now!"
