# ====== STAGE 1: BUILD ======
FROM node:22-slim as builder

WORKDIR /build

COPY package.json package-lock.json ./
RUN npm install

COPY . .

RUN npm run build
RUN npm run prisma:generate

# ====== STAGE 2: RUNTIME ======
FROM node:22-slim

WORKDIR /home/node/app

RUN apt-get update && \
    apt-get -y upgrade && \
    apt-get -y dist-upgrade && \
    apt-get install -y alien libaio1 libssl-dev

COPY --from=builder /build ./ 

COPY entrypoint.sh /home/node/app/
RUN chmod +x /home/node/app/entrypoint.sh

ENTRYPOINT ["/home/node/app/entrypoint.sh"]