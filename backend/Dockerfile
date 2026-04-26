# use the official Bun image
# see https://hub.docker.com/r/oven/bun/tags for all supported tags
FROM oven/bun:latest as base
WORKDIR /usr/src/app

# install dependencies into temp directory
# this will cache them and speed up future builds
FROM base AS install
RUN apt-get update && apt-get install -y python3 make g++ && rm -rf /var/lib/apt/lists/*
RUN mkdir -p /temp/dev
COPY package.json bun.lock /temp/dev/
RUN cd /temp/dev && bun install --frozen-lockfile

# install with --production (exclude devDependencies)
RUN mkdir -p /temp/prod
COPY package.json bun.lock /temp/prod/
RUN cd /temp/prod && bun install --frozen-lockfile --production

# copy node_modules from temp directory
# then copy all (non-ignored) project files into the image
FROM base AS prerelease
COPY --from=install /temp/dev/node_modules node_modules
COPY . .

# [optional] tests & build
# ENV NODE_ENV=production
# RUN bun test
# RUN bun run build

# copy production dependencies and source code into final image
FROM base AS release
COPY --from=install /temp/prod/node_modules node_modules
COPY --from=prerelease /usr/src/app/src src
COPY --from=prerelease /usr/src/app/drizzle drizzle
COPY --from=prerelease /usr/src/app/drizzle.config.ts .
COPY --from=prerelease /usr/src/app/package.json .

# Push schema to the database (creates sqlite.db)
# Note: drizzle-kit is needed for this, so we use bunx which will use the one from dev dependencies if available
# or download it. Since we are in the release stage with only prod deps, 
# it's better to do this where dev deps are available (prerelease) or ensure it's in the final image.
# Actually, let's run push and seed in the prerelease stage and copy the resulting db.

FROM prerelease AS build-db
RUN bun x drizzle-kit push
RUN bun run src/seed.ts

FROM release AS final
# Copy the pre-populated database from the build-db stage
COPY --from=build-db /usr/src/app/sqlite.db .

# run the app
USER bun
EXPOSE 3001/tcp
ENTRYPOINT [ "bun", "run", "src/index.ts" ]
