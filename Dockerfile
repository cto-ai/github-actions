############################
# Build container
############################
FROM registry.cto.ai/official_images/node:latest

WORKDIR /ops
RUN apt update && apt install -y git unzip
COPY package.json .
RUN npm install
COPY . .
RUN rm -rf lib && npm run build