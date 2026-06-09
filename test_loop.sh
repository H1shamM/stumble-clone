#!/usr/bin/env bash

# Test script for junior-loop.sh logic
# Mocking the 'gemini' CLI command
gemini() {
    if [[ "$*" == *"fail"* ]]; then
        echo "Error: QUOTA_EXHAUSTED Your quota will reset after 0h0m5s." >&2
        return 1
    else
        echo "Successfully ran with model: $2"
        return 0
    fi
}
export -f gemini

# The core loop logic extracted from junior-loop.sh for verification
echo "=== Starting Test ==="

# Define models to try.
MODELS=("gemini-1.5-flash" "gemini-1.5-pro" "fail")

SUCCESS=false
MIN_WAIT=0

for model in "${MODELS[@]}"; do
    echo "Attempting with model: $model"
    
    # Capture error output
    ERR_FILE=$(mktemp)
    gemini -y -m "$model" -p "prompt" > /dev/null 2> "$ERR_FILE"
    EXIT_CODE=$?
    ERR_CONTENT=$(cat "$ERR_FILE")
    rm -f "$ERR_FILE"
    
    if [ $EXIT_CODE -eq 0 ]; then
        echo "Successfully ran with model: $model"
        SUCCESS=true
        break
    else
        if [[ "$ERR_CONTENT" == *"QUOTA_EXHAUSTED"* ]]; then
            echo "Quota exhausted for $model"
            # Parse wait time
            hours=$(echo "$ERR_CONTENT" | grep -oE '[0-9]+h' | head -1 | tr -d 'h' || echo 0)
            minutes=$(echo "$ERR_CONTENT" | grep -oE '[0-9]+m' | head -1 | tr -d 'm' || echo 0)
            seconds=$(echo "$ERR_CONTENT" | grep -oE '[0-9]+s' | head -1 | tr -d 's' || echo 0)
            TOTAL_WAIT=$((hours * 3600 + minutes * 60 + seconds))
            echo "Reset time in $TOTAL_WAIT seconds."
            
            if [ "$MIN_WAIT" -eq 0 ] || [ "$TOTAL_WAIT" -lt "$MIN_WAIT" ]; then
                MIN_WAIT=$TOTAL_WAIT
            fi
        else
            echo "Error with $model: $ERR_CONTENT"
        fi
    fi
done

if [ "$SUCCESS" = false ]; then
    SLEEP_TIME=${MIN_WAIT:-300}
    if [ "$SLEEP_TIME" -eq 0 ]; then SLEEP_TIME=300; fi
    echo "Logic Test: Sleeping for $SLEEP_TIME seconds..."
else
    echo "Logic Test: Loop succeeded."
fi
echo "=== Test Finished ==="
