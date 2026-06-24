FROM node:20.19-alpine
RUN npm install -g pnpm
WORKDIR /app
COPY . .
RUN pnpm install --no-frozen-lockfile
RUN cd artifacts/api-server && node build.mjs 2>&1
RUN ls -la artifacts/api-server/dist/ || echo "DIST NAO EXISTE"
EXPOSE 3000
CMD ["node", "--enable-source-maps", "./artifacts/api-server/dist/index.mjs"]
