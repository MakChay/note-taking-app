FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install --only=production

COPY . .

EXPOSE 3002

ENV NODE_ENV=production
ENV PORT=3002

CMD ["node", "server.js"]