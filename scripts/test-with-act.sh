#!/bin/bash

# Test using 'act' (GitHub Actions local runner)
# Install act first: https://github.com/nektos/act
# Usage: ./scripts/test-with-act.sh <ticket-id> <pr-number> <repo-owner> <repo-name> [dry-run]

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  Testing with 'act' (GitHub Actions local runner)      ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════╝${NC}\n"

# Check if act is installed
if ! command -v act &> /dev/null; then
  echo -e "${RED}❌ 'act' is not installed${NC}"
  echo ""
  echo "Install it with:"
  echo "  macOS: brew install act"
  echo "  Linux: See https://github.com/nektos/act#installation"
  echo ""
  echo "Or use ./scripts/test-real.sh for direct API testing"
  exit 1
fi

# Check arguments
if [ $# -lt 4 ]; then
  echo -e "${RED}Usage:${NC} ./scripts/test-with-act.sh <ticket-id> <pr-number> <repo-owner> <repo-name> [dry-run (true/false)]"
  echo -e "${YELLOW}Example:${NC} ./scripts/test-with-act.sh PROJ-123 42 myorg myrepo true"
  exit 1
fi

TICKET_ID="$1"
PR_NUMBER="$2"
REPO_OWNER="$3"
REPO_NAME="$4"
DRY_RUN="${5:-true}" # Default to true if not provided

# Check required environment variables
if [ -z "$LINEAR_API_KEY" ]; then
  echo -e "${RED}❌ Error: LINEAR_API_KEY environment variable is required${NC}"
  echo "Set it with: export LINEAR_API_KEY='your-api-key'"
  exit 1
fi

if [ -z "$GITHUB_TOKEN" ]; then
  echo -e "${RED}❌ Error: GITHUB_TOKEN environment variable is required${NC}"
  echo "Set it with: export GITHUB_TOKEN='your-github-token'"
  exit 1
fi

echo -e "${GREEN}Configuration:${NC}"
echo "  Ticket ID: ${YELLOW}$TICKET_ID${NC}"
echo "  PR Number: ${YELLOW}$PR_NUMBER${NC}"
echo "  Repository: ${YELLOW}$REPO_OWNER/$REPO_NAME${NC}"
echo "  Dry Run: ${YELLOW}$DRY_RUN${NC}"
echo "  Linear API Key: ${YELLOW}${LINEAR_API_KEY:0:10}...${NC}"
echo "  GitHub Token: ${YELLOW}${GITHUB_TOKEN:0:10}...${NC}"
echo ""

# Verify dist folder exists, build if needed
if [ ! -d "dist" ] || [ ! -f "dist/index.js" ]; then
  echo -e "${GREEN}🔨 Building action (dist folder missing or incomplete)...${NC}"
  npm run build
else
  echo -e "${GREEN}✅ Action already built${NC}"
fi

# Create event JSON for workflow_dispatch
EVENT_JSON=$(cat <<EOF
{
  "inputs": {
    "ticket_id": "$TICKET_ID",
    "pr_number": "$PR_NUMBER",
    "repo_owner": "$REPO_OWNER",
    "repo_name": "$REPO_NAME",
    "dry_run": $DRY_RUN
  }
}
EOF
)

# Set GITHUB_REPOSITORY environment variable for act
# This ensures github.context.repo.owner and github.context.repo.repo work correctly
export GITHUB_REPOSITORY="$REPO_OWNER/$REPO_NAME"

# Create temporary event file
EVENT_FILE=$(mktemp)
echo "$EVENT_JSON" > "$EVENT_FILE"

echo -e "${GREEN}▶️  Running with act...${NC}"
echo -e "${YELLOW}Note:${NC} This simulates GitHub Actions environment"
echo -e "${YELLOW}Note:${NC} First run may take longer (downloading Docker images)"
echo -e "${YELLOW}Note:${NC} Using node:20-slim container (faster than downloading Node.js)"
echo ""

# Run act with the test workflow
# Pass GITHUB_REPOSITORY as an environment variable
act workflow_dispatch \
  --secret LINEAR_API_KEY="$LINEAR_API_KEY" \
  --secret GITHUB_TOKEN="$GITHUB_TOKEN" \
  --env GITHUB_REPOSITORY="$GITHUB_REPOSITORY" \
  --workflows .github/workflows/test-with-act.yml \
  --eventpath "$EVENT_FILE" \
  --container-architecture linux/amd64

# Cleanup
rm -f "$EVENT_FILE"

echo -e "\n${GREEN}✅ Done!${NC}"
echo -e "Check the 'act' output above for action logs and results."
if [ "$DRY_RUN" = "false" ]; then
  echo -e "Check PR #${PR_NUMBER} in ${REPO_OWNER}/${REPO_NAME} for the posted comment."
else
  echo -e "Dry-run mode: No comment was posted. Check the output above."
fi

