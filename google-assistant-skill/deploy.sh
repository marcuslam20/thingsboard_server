#!/bin/bash

# Script deploy Google Cloud Function cho Google Assistant Integration
# Chạy script này SAU KHI đã login gcloud

set -e  # Dừng nếu có lỗi

echo "================================================"
echo "  DEPLOY GOOGLE ASSISTANT CLOUD FUNCTION"
echo "================================================"
echo ""

# Load gcloud vào PATH
echo "📦 Loading Google Cloud SDK..."
source ~/google-cloud-sdk/path.bash.inc
source ~/google-cloud-sdk/completion.bash.inc

# Kiểm tra đã login chưa
echo ""
echo "🔐 Checking authentication..."
if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" | grep -q "@"; then
    echo "❌ Bạn chưa đăng nhập Google Cloud!"
    echo "   Hãy chạy: gcloud auth login"
    exit 1
fi

ACTIVE_ACCOUNT=$(gcloud auth list --filter=status:ACTIVE --format="value(account)")
echo "✅ Đã đăng nhập với tài khoản: $ACTIVE_ACCOUNT"

# Set project
PROJECT_ID="intense-acrobat-485903-h3"
echo ""
echo "🎯 Setting project to: $PROJECT_ID"
gcloud config set project $PROJECT_ID

# Enable APIs
echo ""
echo "🔧 Enabling required APIs..."
echo "   - Cloud Functions API"
gcloud services enable cloudfunctions.googleapis.com --quiet

echo "   - Cloud Build API"
gcloud services enable cloudbuild.googleapis.com --quiet

echo "   - Cloud Run API (Gen2 functions)"
gcloud services enable run.googleapis.com --quiet

echo "   - Artifact Registry API"
gcloud services enable artifactregistry.googleapis.com --quiet

echo "✅ All APIs enabled!"

# Deploy function
echo ""
echo "🚀 Deploying Cloud Function..."
echo "   Function name: google-assistant-fulfillment"
echo "   Region: asia-southeast1"
echo "   Runtime: nodejs20"
echo ""

cd /home/vietlam/Desktop/TB_SERVER/alexa_intergration/thingboard_server/google-assistant-skill

gcloud functions deploy google-assistant-fulfillment \
  --gen2 \
  --runtime=nodejs20 \
  --region=asia-southeast1 \
  --source=. \
  --entry-point=fulfillment \
  --trigger-http \
  --allow-unauthenticated \
  --env-vars-file=.env.yaml \
  --memory=256Mi \
  --timeout=60s \
  --max-instances=10

echo ""
echo "================================================"
echo "  ✅ DEPLOY THÀNH CÔNG!"
echo "================================================"
echo ""

# Lấy URL của function
FUNCTION_URL=$(gcloud functions describe google-assistant-fulfillment --region=asia-southeast1 --gen2 --format="value(serviceConfig.uri)")

echo "📝 Fulfillment URL (copy URL này):"
echo ""
echo "   $FUNCTION_URL"
echo ""
echo "================================================"
echo ""
echo "🎯 BƯỚC TIẾP THEO:"
echo ""
echo "1. Copy URL bên trên"
echo "2. Vào Actions Console: https://console.actions.google.com/"
echo "3. Chọn project của bạn"
echo "4. Vào 'Develop' → 'Actions'"
echo "5. Paste URL vào 'Fulfillment URL'"
echo "6. Click 'Save'"
echo ""
echo "================================================"
