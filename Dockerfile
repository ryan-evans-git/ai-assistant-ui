# syntax=docker/dockerfile:1.6
#
# This package is a publishable React component library — there is
# no long-running service to run.  The Dockerfile builds the
# library bundle (./dist/*) so the artifacts can be picked up by
# CI without a local Node toolchain.
#
#   docker build -t ai-assistant-ui:builder .
#   docker run --rm -v $(pwd)/dist:/out ai-assistant-ui:builder \
#       sh -c 'cp -r dist/* /out'
#
# For a live demo, run `npm run dev` locally — Vite's dev server
# is the natural fit and doesn't benefit from containerization.

FROM node:20-alpine AS build

WORKDIR /app

COPY package.json ./
# Dev deps are required to build (vite, plugins, types).
RUN --mount=type=cache,target=/root/.npm npm install --no-audit --no-fund

COPY tsconfig.json vite.config.ts ./
COPY src ./src
COPY styles ./styles

RUN npm run build

# Stage 2: ship the built artifacts in a tiny image so CI can
# `docker cp` them or use the layer as a build cache.
FROM scratch AS dist

COPY --from=build /app/dist /dist
COPY --from=build /app/styles /styles
COPY --from=build /app/package.json /package.json
COPY --from=build /app/LICENSE /LICENSE
COPY --from=build /app/README.md /README.md
