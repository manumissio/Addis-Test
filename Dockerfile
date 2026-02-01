FROM node:22-slim AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable
WORKDIR /app

FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/api/package.json ./apps/api/
COPY apps/web/package.json ./apps/web/
COPY packages/db/package.json ./packages/db/
COPY packages/shared/package.json ./packages/shared/
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile

FROM deps AS build
COPY . .
RUN pnpm run build

# API Image
FROM node:22-slim AS api
RUN corepack enable
WORKDIR /app
COPY --from=build /app ./
EXPOSE 3001
CMD [ "pnpm", "--filter", "api", "start" ]

# Web Image
FROM node:22-slim AS web
RUN corepack enable
WORKDIR /app
COPY --from=build /app ./
EXPOSE 3000
CMD [ "pnpm", "--filter", "web", "start" ]
