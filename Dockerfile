FROM node:23

WORKDIR /app

COPY package*.json ./ 

RUN pwd && npm install

COPY . .

CMD [ "npm", "start" ]

