FROM nginx:stable-alpine

# Copie la configuration nginx (fichier dans le dossier nginx/ du contexte racine)
COPY nginx/nginx.conf /etc/nginx/nginx.conf

# Copie le frontend statique (dossier client/ a la racine)
COPY client /usr/share/nginx/html
