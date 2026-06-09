#!/usr/bin/env bash

# Autonomous junior loop for stumble-clone. Run: bash junior-loop.sh (Ctrl-C to stop)
set -u
cd "$(dirname "$(readlink -f "$0")")"

if [ -z "${GH_TOKEN:-}" ]; then
  echo "GH_TOKEN is not set. Export it first."
  exit 1
fi

PROMPT_FILE=$(mktemp)
cat <<'EOF' > "$PROMPT_FILE"
Follow GEMINI.md exactly. Do ONE pass of your session loop, then stop:
1) git checkout master && git pull
2) If an open PR you authored has a review requesting changes: switch to its branch, read it with gh pr view <n> --comments, apply the changes, run the gates, commit, push. Then stop.
3) Else if you have NO open PR: take the lowest-numbered open issue labeled gemini-ready assigned to you, implement it, run the gates green, commit on a feat/ branch, push, open a PR with Closes #N. Then stop.
4) If you have an open PR awaiting review, or nothing to do: print NOTHING-TO-DO and stop.

Never push to master. Never merge. One PR at a time.
EOF

# Define models to try. Based on available quota.
MODELS=("gemini-3.1-flash-lite" "gemini-3-flash-preview" "gemini-2.5-flash" "gemma-4-31b-it" "gemma-4-26b-a4b-it")

while true; do
  echo "================ $(date) ================"
  
  SUCCESS=false
  # Default sleep after a successful pass or generic error
  SLEEP_TIME=300

  for model in "${MODELS[@]}"; do
    echo "Attempting with model: $model"
    
    ERR_FILE=$(mktemp)
    # Attempt to run with the specific model flag
    gemini -y -m "$model" -p "$(cat "$PROMPT_FILE")" > /dev/null 2> "$ERR_FILE"
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
        # Parse wait time: 'Your quota will reset after 16h46m31s.'
        hours=$(echo "$ERR_CONTENT" | grep -oE '[0-9]+h' | head -1 | tr -d 'h' || echo 0)
        minutes=$(echo "$ERR_CONTENT" | grep -oE '[0-9]+m' | head -1 | tr -d 'm' || echo 0)
        seconds=$(echo "$ERR_CONTENT" | grep -oE '[0-9]+s' | head -1 | tr -d 's' || echo 0)
        
        TOTAL_WAIT=$((hours * 3600 + minutes * 60 + seconds))
        echo "Reset time in $TOTAL_WAIT seconds."
        
        # If we have a wait time, use it as our sleep time instead of the default
        if [ "$TOTAL_WAIT" -gt 0 ]; then
            SLEEP_TIME=$((TOTAL_WAIT + 60)) # Add a minute buffer
        fi
      elif [[ "$ERR_CONTENT" == *"ModelNotFoundError"* ]]; then
        echo "Model $model not found, skipping..."
        continue
      else
        echo "Error with $model: $ERR_CONTENT"
        # For unknown errors, don't sleep too long
        SLEEP_TIME=60
      fi
    fi
  done

  echo "Sleeping for $SLEEP_TIME seconds..."
  sleep "$SLEEP_TIME"
done
rm -f "$PROMPT_FILE"
