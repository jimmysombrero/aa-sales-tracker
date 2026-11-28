FROM node:latest

WORKDIR /usr/src/app

COPY ./src .

RUN npm install -g npm@12.2.3

RUN npm install express dotenv

EXPOSE 3249

CMD ["node", "main.js"]