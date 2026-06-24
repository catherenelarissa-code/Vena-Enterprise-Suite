FROM node:20-alpine

RUN npm install -g pnpm

WORKDIR /app

COPY . .

RUN pnpm install --no-frozen-lockfile

RUN cd artefatos/api-server && pnpm run build

RUN ls -la /app/artefatos/api-server/ && ls -la /app/artefatos/api-server/dist/ || echo "DIST NAO EXISTE"

EXPOSE 3000

CMD ["node", "--enable-source-maps", "./artefatos/api-server/dist/index.mjs"]
