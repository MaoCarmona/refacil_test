FROM node:18-alpine AS builder

WORKDIR /app

COPY package*.json ./

RUN npm install
RUN npm ci
COPY . .

RUN npm run build

FROM node:18-alpine AS production

RUN addgroup -g 1001 -S nodejs
RUN adduser -S nestjs -u 1001

WORKDIR /app

COPY --from=builder --chown=nestjs:nodejs /app/package*.json ./
COPY --from=builder --chown=nestjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nestjs:nodejs /app/dist ./dist

USER nestjs

EXPOSE 3000

ENV NODE_ENV=production

CMD ["npm", "run", "start:prod"]

