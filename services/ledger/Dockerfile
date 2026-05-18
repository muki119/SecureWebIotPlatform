FROM node:24-bookworm-slim AS build
LABEL author="Mugagga Kimera"
LABEL version="1.0"
LABEL description="Domain service for the Secure Web IoT Platform"

## to be ran from the workspace root
WORKDIR /app
# Copy the workspace package.json files
COPY package*.json ./
## Have to copy entire workspace packages.json because of the workspaces setup - will cause errors if theres none of the packages
COPY authentication/package*.json ./authentication/
COPY common/package*.json ./common/
COPY devicecontrol/package*.json ./devicecontrol/
COPY domain/package*.json ./domain/
COPY eventbus/package*.json ./eventbus/
COPY ledger/package*.json ./ledger/

# Install deps
RUN npm ci

# Copy the code thats actually needed for the build
COPY domain/ ./ledger/
COPY common/ ./common/
COPY eventbus/ ./eventbus/

WORKDIR /app/ledger

RUN npm run build

FROM node:24-bookworm-slim AS production
WORKDIR /app

# only need the dist and the package json , since every other dir is pre-build 
COPY --from=build /app/ledger/dist ./dist
COPY --from=build /app/ledger/package*.json ./


## only install production dependencies
RUN npm install --production

ENV NODE_ENV=production
ENV PORT=2559
EXPOSE 2559


CMD [ "node","dist/index.js" ]