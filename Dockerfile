# rebuild: 2026-06-24

FROM node:20-alpine

RUN npm install -g pnpm

WORKDIR /app

COPY . .

RUN pnpm install --no-frozen-lockfile

RUN cd artefatos/api-server && pnpm run build

RUN ls -la /app/artefatos/api-server/dist/

EXPOSE 3000

CMD ["node", "--enable-source-maps", "./artefatos/api-server/dist/index.mjs"]
