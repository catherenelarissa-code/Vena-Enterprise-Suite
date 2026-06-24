FROM node:20-alpine

RUN npm install -g pnpm

WORKDIR /app

COPY . .

RUN pnpm install --no-frozen-lockfile

RUN pnpm --filter @workspace/api-server run build && ls -la artefatos/api-server/dist/

EXPOSE 3000

CMD ["node", "--enable-source-maps", "./artefatos/api-server/dist/index.mjs"]
