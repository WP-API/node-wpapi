#!/usr/bin/env bash
#
# Seed the wp-env WordPress instance with the "theme unit test" sample data the
# integration suite asserts against (post titles, counts, pagination). Run once
# against a fresh environment:
#
#   npm run env:start && npm run env:seed
#
set -euo pipefail

fixture="/var/www/html/wp-content/plugins/node-wpapi/tests/fixtures/theme-unit-test-data.xml"

# Start from a clean slate so the dataset is deterministic (drops the default
# "Hello world!" post, "Sample Page", and privacy-policy page).
npx @wordpress/env run cli wp site empty --yes
npx @wordpress/env run cli wp plugin install wordpress-importer --activate
npx @wordpress/env run cli wp import "${fixture}" --authors=create
