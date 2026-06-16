#!/usr/bin/env bash
set -euo pipefail
npm test
npm run check
npm run smoke >/tmp/jobsearch-skill-smoke.md
test -s /tmp/jobsearch-skill-smoke.md
