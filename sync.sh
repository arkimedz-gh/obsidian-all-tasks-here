#! /bin/bash

# Exit immediately if a command exits with a non-zero status
set -e

yarn test
yarn build

# Define the list of vault paths
VAULT_PATHS=("${1:-./DemoVault}")

# Check if OBSIDIAN_HOME is defined and add it to the list if it is
if [ -n "$OBSIDIAN_HOME" ]; then
  VAULT_PATHS+=("$OBSIDIAN_HOME")
fi

# Loop over each vault path and perform the operations
for DEMO_VAULT_PATH in "${VAULT_PATHS[@]}"; do
  echo "Syncing vault: $DEMO_VAULT_PATH"
  PLUGIN_PATH="$DEMO_VAULT_PATH/.obsidian/plugins/all-tasks-here"

  rm -rf "$PLUGIN_PATH"
  mkdir -p "$PLUGIN_PATH"
  cp main.js manifest.json styles.css "$PLUGIN_PATH"
  touch "$PLUGIN_PATH/.hotreload"
done