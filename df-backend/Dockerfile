# ====== STAGE 1: BUILD ======
FROM node:22-slim as builder

WORKDIR /build

COPY package.json package-lock.json ./
RUN npm install

COPY . .

RUN npm run build

# ====== STAGE 2: RUNTIME ======
FROM node:22-slim

WORKDIR /home/node/app

RUN apt-get update && \
    apt-get -y upgrade && \
    apt-get -y dist-upgrade && \
    apt-get install -y alien libaio1 libssl-dev

COPY --from=builder /build ./ 

ENTRYPOINT ["npm", "start"]