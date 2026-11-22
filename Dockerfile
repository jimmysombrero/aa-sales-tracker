FROM node:latest

WORKDIR /usr/src/app

COPY ./src .

RUN npm install express dotenv

EXPOSE 3249

CMD ["node", "main.js"]