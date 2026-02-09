#!/bin/bash
#
# Copyright © 2016-2025 The Thingsboard Authors
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
#


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
