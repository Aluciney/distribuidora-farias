# Name the node stage "builder"
FROM node:22-alpine AS builder

# Set working directory
WORKDIR /app

# Copia o arquivo package.json e yarn.lock para o diretório de trabalho
COPY package.json package-lock.json ./

# Instala as dependências usando o Yarn
RUN npm install

# Copia todos os arquivos do diretório atual para o diretório de trabalho no contêiner
COPY . .

# Compila a aplicação React para produção
RUN npm run build

FROM nginx:alpine

# Set working directory to nginx asset directory
WORKDIR /usr/share/nginx/html

# Remove default nginx static assets
RUN rm -rf ./*

RUN rm /etc/nginx/conf.d/default.conf
COPY nginx/nginx.conf /etc/nginx/conf.d

# Copia os arquivos compilados da aplicação React do estágio anterior para o diretório HTML do Nginx
COPY --from=builder /app/dist /usr/share/nginx/html

# Containers run nginx with global directives and daemon off
ENTRYPOINT ["nginx", "-g", "daemon off;"]