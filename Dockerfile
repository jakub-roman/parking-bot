FROM node:16-slim

WORKDIR /app

ADD package.json /app
ADD package-lock.json /app

RUN npm install

ADD . /app

RUN npm run build

ENTRYPOINT [ "npm", "run", "start" ]
