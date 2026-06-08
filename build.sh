#!/usr/bin/env bash

if [ $# -ne 1 ]; then
  echo "Error: Exactly one argument required"
  echo "Usage: $0 <output-name>"
  exit 1
fi

bun build --compile --define COMMAND="\"$1\"" src/index.ts --outfile "$1-mcp"
claude mcp add --scope project "$1" -- "$(pwd)/$1-mcp"
