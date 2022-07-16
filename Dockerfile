# syntax=docker/dockerfile:1
FROM node:14.18.0-alpine

#ENV NODE_ENV=production

# update packages
RUN apk update

RUN apk add --update python make g++ && rm -rf /var/cache/apk/*

WORKDIR /servichain-backend

COPY package.json /servichain-backend
COPY tsconfig.json /servichain-backend

COPY . /servichain-backend

RUN npm install

CMD [ "npm", "start" ]