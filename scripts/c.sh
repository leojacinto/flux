#!/bin/bash
# Sends one command to a running drive.mjs and waits for the result.
# Usage: scripts/c.sh '{"action":"goto","url":"/some/path"}'
cd "$(dirname "$0")/.." || exit 1
mkdir -p .local/cmd
id=$(date +%s%N)
echo "$1" > .local/cmd/$id.json.tmp && mv .local/cmd/$id.json.tmp .local/cmd/$id.json
for i in $(seq 1 600); do
  [ -f .local/cmd/$id.json.done ] && { cat .local/cmd/$id.json.done; echo; exit 0; }
  sleep 0.5
done
echo TIMEOUT
