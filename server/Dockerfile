FROM oven/bun:1.3.14-alpine AS base

WORKDIR /app

RUN apk add --no-cache git libgcc libstdc++ \
  && bun install -g vite-plus

COPY . .

RUN vp install --frozen-lockfile

WORKDIR /app/server

ENV NODE_ENV=production

FROM base AS admin-server

EXPOSE 3600

CMD ["bun", "run", "src/apps/admin/index.ts"]

FROM base AS user-server

EXPOSE 3999

CMD ["bun", "run", "src/apps/user/index.ts"]

FROM base AS event-server

CMD ["bun", "run", "src/apps/event/index.ts"]
