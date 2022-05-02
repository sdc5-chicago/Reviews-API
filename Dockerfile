# syntax=docker/dockerfile:1

FROM node:16.14.2-alpine3.15

ENV NODE_ENV=production

WORKDIR /app

COPY package*.json ./

RUN yarn install

COPY . .

ENV PORT=5000

EXPOSE 5000

CMD [ "node", "app.js" ]