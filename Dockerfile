# rebuild: 2026-06-24f
FROM node:20-alpine
RUN npm install -g pnpm
WORKDIR /app
COPY . .
RUN pnpm install --no-frozen-lockfile
RUN cd artifacts/api-server && pnpm run build 2>&1 && ls -la dist/ || echo "DIST VAZIO OU NAO EXISTE"
EXPOSE 3000
CMD ["node", "--enable-source-maps", "./artifacts/api-server/dist/index.mjs"]
