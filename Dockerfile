FROM node:25-alpine AS dependencies

WORKDIR /app

COPY package*.json ./

ENV NODE_ENV=production

RUN apk add jq && npm ci --omit=dev

COPY . .
COPY entrypoint.sh /entrypoint.sh

RUN touch config/settings.json && chown node config/settings.json
USER node

CMD [ "npm", "start" ]

ENTRYPOINT [ "/entrypoint.sh" ] 
