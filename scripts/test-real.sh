#!/bin/bash

# Test the action with real Linear and GitHub APIs
# Usage: ./scripts/test-real.sh <ticket-id> <pr-number> <repo-owner> <repo-name> [dry-run]

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  Testing with Real Linear and GitHub APIs            ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════╝${NC}\n"

# Check arguments
if [ $# -lt 4 ]; then
  echo -e "${RED}Usage:${NC} ./scripts/test-real.sh <ticket-id> <pr-number> <repo-owner> <repo-name> [dry-run (true/false)]"
  echo -e "${YELLOW}Example:${NC} ./scripts/test-real.sh PROJ-123 42 myorg myrepo false"
  exit 1
fi

TICKET_ID="$1"
PR_NUMBER="$2"
REPO_OWNER="$3"
REPO_NAME="$4"
DRY_RUN="${5:-false}"

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

# Build first
echo -e "${GREEN}🔨 Building action...${NC}"
npm run build > /dev/null 2>&1
echo -e "${GREEN}✅ Build complete.${NC}\n"

# Set environment variables for the action
# @actions/core reads inputs from INPUT_* environment variables
# Input names are converted: linear-api-key -> INPUT_LINEAR_API_KEY
# Note: We must export AND pass via env to ensure they're available
export INPUT_LINEAR_API_KEY="$LINEAR_API_KEY"
export INPUT_GITHUB_TOKEN="$GITHUB_TOKEN"
export INPUT_TICKET_ID="$TICKET_ID"
export INPUT_PR_NUMBER="$PR_NUMBER"
export INPUT_DRY_RUN="$DRY_RUN"
export GITHUB_REPOSITORY="$REPO_OWNER/$REPO_NAME"

# Mock GitHub context for github.context
export GITHUB_REPOSITORY_OWNER="$REPO_OWNER"
export GITHUB_REPOSITORY_NAME="$REPO_NAME"
export GITHUB_EVENT_NAME="pull_request"
export GITHUB_WORKFLOW="test-real"

# Debug: Show what we're setting (masked)
echo -e "${YELLOW}Environment variables set:${NC}"
echo "  INPUT_LINEAR_API_KEY=${LINEAR_API_KEY:0:10}..."
echo "  INPUT_GITHUB_TOKEN=${GITHUB_TOKEN:0:10}..."
echo "  INPUT_TICKET_ID=$TICKET_ID"
echo "  INPUT_PR_NUMBER=$PR_NUMBER"
echo "  INPUT_DRY_RUN=$DRY_RUN"
echo "  GITHUB_REPOSITORY=$GITHUB_REPOSITORY"
echo ""

# Verify variables are set before running
if [ -z "$INPUT_LINEAR_API_KEY" ]; then
  echo -e "${RED}❌ Error: INPUT_LINEAR_API_KEY is not set${NC}"
  exit 1
fi

echo -e "${GREEN}▶️  Running action...${NC}"
echo ""

# Export all variables to ensure they're available to the node process
export INPUT_LINEAR_API_KEY="$LINEAR_API_KEY"
export INPUT_GITHUB_TOKEN="$GITHUB_TOKEN"
export INPUT_TICKET_ID="$TICKET_ID"
export INPUT_PR_NUMBER="$PR_NUMBER"
export INPUT_DRY_RUN="$DRY_RUN"
export GITHUB_REPOSITORY="$REPO_OWNER/$REPO_NAME"
export GITHUB_REPOSITORY_OWNER="$REPO_OWNER"
export GITHUB_REPOSITORY_NAME="$REPO_NAME"
export GITHUB_EVENT_NAME="pull_request"
export GITHUB_WORKFLOW="test-real"
export GITHUB_ACTIONS="true"
export GITHUB_ACTION="test-real"
export GITHUB_ACTOR="test-user"
export GITHUB_WORKSPACE="$(pwd)"
export GITHUB_SHA="test-sha"
export GITHUB_REF="refs/heads/test"

# Set runner environment variables that @actions/core might check
export RUNNER_TEMP="${TMPDIR:-/tmp}"
export RUNNER_TOOL_CACHE="${HOME}/.cache/act"

# Verify the key variable is actually exported
if [ -z "${INPUT_LINEAR_API_KEY:-}" ]; then
  echo -e "${RED}❌ Error: INPUT_LINEAR_API_KEY is not set in environment${NC}"
  exit 1
fi

# Debug: Verify Node.js can see the variable
echo -e "${YELLOW}Verifying environment variables are accessible to Node.js...${NC}"
node -e "console.log('INPUT_LINEAR_API_KEY accessible:', !!process.env.INPUT_LINEAR_API_KEY); console.log('GITHUB_ACTIONS:', process.env.GITHUB_ACTIONS); console.log('RUNNER_TEMP:', process.env.RUNNER_TEMP);" || true
echo ""

# Run the action - all variables are now exported and will be inherited
# Note: @actions/core reads INPUT_* variables automatically when GITHUB_ACTIONS is set
# We set RUNNER_TEMP as @actions/core might check for it
# Use exec to ensure the process inherits all environment variables properly
exec node dist/index.js

echo ""
echo -e "${GREEN}✅ Done!${NC}"
if [ "$DRY_RUN" = "false" ]; then
  echo -e "Check PR #${PR_NUMBER} in ${REPO_OWNER}/${REPO_NAME} for the posted comment."
else
  echo -e "Dry-run mode: No comment was posted. Check the output above."
fi

