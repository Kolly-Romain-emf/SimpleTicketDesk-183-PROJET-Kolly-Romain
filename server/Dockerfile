FROM node:20-alpine

WORKDIR /app

# Installer les dependances
COPY package.json package-lock.json* ./
RUN npm ci --omit=dev

# Copier tout le code serveur (routes, controllers, etc.)
COPY . .

ENV PORT=3000
EXPOSE 3000

# Demarrer l'API principale
CMD ["node", "app/server.js"]
