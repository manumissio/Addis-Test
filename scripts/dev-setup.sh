#!/bin/bash

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}=== AddisIdeas Development Setup ===${NC}"
echo ""

# Get the script directory and project root
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
cd "$PROJECT_ROOT"

# Check prerequisites
echo -e "${YELLOW}Checking prerequisites...${NC}"

if ! command -v pnpm &> /dev/null; then
    echo -e "${RED}Error: pnpm is not installed${NC}"
    echo "Install it with: npm install -g pnpm"
    exit 1
fi
echo "  pnpm: OK"

if ! command -v psql &> /dev/null; then
    echo -e "${RED}Error: PostgreSQL client (psql) is not installed${NC}"
    echo "Install PostgreSQL first"
    exit 1
fi
echo "  psql: OK"

# Database configuration
DB_NAME="${DB_NAME:-addisideas}"
DB_USER="${DB_USER:-$USER}"
DB_PASSWORD="${DB_PASSWORD:-}"
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"

if [ -n "$DB_PASSWORD" ]; then
    DATABASE_URL="postgresql://${DB_USER}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT}/${DB_NAME}"
else
    DATABASE_URL="postgresql://${DB_USER}@${DB_HOST}:${DB_PORT}/${DB_NAME}"
fi

echo ""
echo -e "${YELLOW}Database configuration:${NC}"
echo "  Database: $DB_NAME"
echo "  User: $DB_USER"
echo "  Host: $DB_HOST:$DB_PORT"
echo ""

# Create database if it doesn't exist
echo -e "${YELLOW}Setting up database...${NC}"
if psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -lqt | cut -d \| -f 1 | grep -qw "$DB_NAME"; then
    echo "  Database '$DB_NAME' already exists"
else
    echo "  Creating database '$DB_NAME'..."
    createdb -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" "$DB_NAME"
    echo "  Database created"
fi

# Create .env file for API if it doesn't exist
ENV_FILE="$PROJECT_ROOT/apps/api/.env"
if [ ! -f "$ENV_FILE" ]; then
    echo ""
    echo -e "${YELLOW}Creating API .env file...${NC}"
    AUTH_SECRET=$(openssl rand -hex 32)
    cat > "$ENV_FILE" << EOF
DATABASE_URL=$DATABASE_URL
AUTH_SECRET=$AUTH_SECRET
API_PORT=3001
API_HOST=0.0.0.0
CORS_ORIGIN=http://localhost:3000
NODE_ENV=development
EOF
    echo "  Created $ENV_FILE"
else
    echo ""
    echo -e "${YELLOW}API .env file already exists${NC}"
fi

# Install dependencies
echo ""
echo -e "${YELLOW}Installing dependencies...${NC}"
pnpm install

# Run database migrations
echo ""
echo -e "${YELLOW}Running database migrations...${NC}"
cd "$PROJECT_ROOT/packages/db"
DATABASE_URL="$DATABASE_URL" pnpm run db:migrate
cd "$PROJECT_ROOT"

# Create uploads directory
mkdir -p "$PROJECT_ROOT/apps/api/uploads/users"
mkdir -p "$PROJECT_ROOT/apps/api/uploads/ideas"

echo ""
echo -e "${GREEN}=== Setup Complete ===${NC}"
echo ""
echo "To start the development servers, run:"
echo ""
echo -e "  ${YELLOW}pnpm run dev${NC}"
echo ""
echo "Then open:"
echo "  - Web:  http://localhost:3000"
echo "  - API:  http://localhost:3001"
echo ""
