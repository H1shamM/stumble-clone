#!/usr/bin/env bash
MODELS=("gemini-1.5-flash" "gemini-1.5-pro" "gemini-pro" "gemini-flash")
for model in "${MODELS[@]}"; do
    echo "Testing $model..."
    gemini -y -m "$model" -p "echo 'ping'" > /dev/null 2>&1
    if [ $? -eq 0 ]; then
        echo "$model is WORKING"
    else
        echo "$model FAILED"
    fi
done
