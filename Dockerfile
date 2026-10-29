FROM node:22-alpine AS dependencies
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM node:22-alpine AS builder
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
COPY --from=dependencies /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
ENV ORCHA_SESSION_DIRECTORY=/data/sessions

RUN addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 app \
  && mkdir -p /data/sessions \
  && chown -R app:nodejs /data

COPY --from=builder --chown=app:nodejs /app ./

USER app
EXPOSE 3000
VOLUME ["/data/sessions"]

CMD ["npm", "start"]
