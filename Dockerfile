FROM node:23-alpine AS dependencies

WORKDIR /app

COPY package*.json ./

ENV NODE_ENV=production

RUN npm ci --omit=dev

COPY . .

RUN cp config/settings.json.template config/settings.json

USER node

CMD [ "npm", "start" ]
