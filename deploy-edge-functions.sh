#!/bin/bash

# Edge Functions Deployment Script for DataLens
# This script requires the Supabase CLI to be installed and linked

set -e

PROJECT_REF="aqyacoxrjaeizgwvzcov"
SUPABASE_URL="https://aqyacoxrjaeizgwvzcov.supabase.co"

echo "🚀 DataLens Edge Functions Deployment"
echo "======================================"
echo ""

# Check if Supabase CLI is available
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI not found!"
    echo ""
    echo "To install Supabase CLI:"
    echo "  Windows (PowerShell):"
    echo "    scoop bucket add supabase https://github.com/supabase/scoop-bucket.git"
    echo "    scoop install supabase"
    echo ""
    echo "  Or download from: https://github.com/supabase/cli/releases"
    echo ""
    echo "After installation, run:"
    echo "  supabase link --project-ref $PROJECT_REF"
    echo ""
    exit 1
fi

# Check if linked to project
echo "📋 Checking project link..."
if ! supabase status &> /dev/null; then
    echo "⚠️  Not linked to project. Linking now..."
    supabase link --project-ref $PROJECT_REF
fi

echo "✅ Linked to project: $PROJECT_REF"
echo ""

# Deploy each function
FUNCTIONS=(
    "upload-file"
    "create-job"
    "get-job-status"
    "get-analysis-results"
    "ai-insights"
)

for func in "${FUNCTIONS[@]}"; do
    echo "📦 Deploying: $func"

    if [ ! -d "supabase/functions/$func" ]; then
        echo "❌ Directory not found: supabase/functions/$func"
        continue
    fi

    # Deploy the function
    supabase functions deploy "$func" --no-verify-jwt

    if [ $? -eq 0 ]; then
        echo "✅ Deployed: $func"
    else
        echo "❌ Failed to deploy: $func"
    fi
    echo ""
done

echo ""
echo "🎉 Deployment complete!"
echo ""
echo "📝 Next steps:"
echo "  1. Set environment variables in Supabase Dashboard → Edge Functions → Settings:"
echo "     - GEMINI_API_KEY=your_gemini_api_key_here"
echo ""
echo "  2. Create storage bucket 'data-uploads' in Supabase Dashboard → Storage"
echo ""
echo "  3. Test the functions:"
echo "     curl -X POST https://$SUPABASE_URL/functions/v1/upload-file \\"
echo "       -H \"Authorization: Bearer YOUR_ANON_KEY\" \\"
echo "       -F \"file=@test.csv\""
