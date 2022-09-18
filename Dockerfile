FROM node:16-slim

WORKDIR /usr/src/app

COPY package*.json ./

# cant do `npm ci` because tsc has to compile the project first
# which requires devDependencies
RUN npm install

COPY . .

RUN npm run build

EXPOSE 8080

CMD [ "npm", "start" ]
