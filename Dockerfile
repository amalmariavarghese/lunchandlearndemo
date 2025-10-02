FROM node:18-alpine

WORKDIR /app
COPY package*.json ./

# Use npm install because you likely don't have package-lock.json yet
RUN npm install --omit=dev

COPY . .
EXPOSE 3000
CMD ["npm", "start"]
