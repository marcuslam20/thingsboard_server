#!/bin/bash

# Script to watch Cloud Function logs in real-time
# Chạy script này trong terminal riêng để xem logs khi test

source ~/google-cloud-sdk/path.bash.inc

echo "=========================================="
echo "  WATCHING CLOUD FUNCTION LOGS"
echo "=========================================="
echo ""
echo "Monitoring: google-assistant-fulfillment"
echo "Region: asia-southeast1"
echo ""
echo "Press Ctrl+C to stop"
echo ""
echo "=========================================="
echo ""

# Watch logs continuously
while true; do
    gcloud functions logs read google-assistant-fulfillment \
        --region=asia-southeast1 \
        --limit=10 \
        --format="table(time_utc, severity, log)" \
        2>/dev/null

    echo ""
    echo "--- Refreshing in 5 seconds ---"
    sleep 5
    clear
done
