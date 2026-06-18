# PASA Election System — production image for VPS deployment.
FROM node:22-bookworm-slim

WORKDIR /app

# Prisma needs OpenSSL at build & runtime.
RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*

RUN corepack enable

# Install dependencies (schema is needed so @prisma/client can generate).
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY prisma ./prisma
RUN pnpm install --frozen-lockfile

# Build the app.
COPY . .
RUN pnpm build

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

COPY docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

ENTRYPOINT ["docker-entrypoint.sh"]
CMD ["pnpm", "start"]
