# SimpleTicketDesk

Application client/serveur réalisée dans le cadre du module 183 (CFC) à l’École des Métiers de Fribourg (EMF), avec un focus sur la sécurité applicative.

## Contexte du projet
SimpleTicketDesk est une application web de gestion de tickets de support.
L'idee est simple: une personne signale un probleme, cree un ticket, puis suit
son avancement jusqu'a sa resolution.

Concretement, l'application permet de:
- creer, modifier et supprimer ses propres tickets
- consulter des tickets publics
- gerer son compte (profil, mot de passe, MFA)
- administrer les utilisateurs, les statuts et consulter le journal d'audit (role ADMIN)

Le projet met l'accent sur une base propre et securisee (sessions, roles,
ownership, validation et logs), avec un demarrage rapide en Docker.

## Captures
![Demo](docs/Demo.gif)

## Objectif
Fournir une base simple pour gérer des tickets avec authentification par session, gestion des rôles et contrôles d’accès côté API.

## Fonctionnalités
- Authentification `register/login/logout` avec sessions serveur
- MFA TOTP (2e facteur) pour renforcer la connexion
- Gestion des rôles `USER` / `ADMIN`
- CRUD tickets avec règles d’ownership + tickets publics
- CRUD utilisateurs (profil + administration)
- CRUD statuts (admin)
- Journal d’audit des actions sensibles

## Stack technique
- Frontend: HTML, CSS, JavaScript (SPA sans framework)
- Backend: Node.js + Express (API REST)
- Auth/Sécurité: `express-session`, `bcrypt`, MFA TOTP (`speakeasy` + `qrcode`)
- Base de données: MySQL 8 (`mysql2`)
- Infra: Docker Compose + Nginx (reverse proxy) + conteneurs `db/server/nginx`
- Logging: `winston` + logs d’audit en base

## Sécurité et publication
- Variables sensibles via `.env` (fichier non versionné)
- Exemple de configuration fourni dans `.env.example`
- Mots de passe stockés en hash (`bcrypt`)
- Validation des entrées + gestion d’erreurs côté serveur
- Logs applicatifs + audit en base de données

> Projet de démonstration/local. Non destiné à être déployé tel quel en production.

## Prérequis
- Docker + docker compose

## Démarrage rapide (Docker Compose)
1. Copier `.env.example` vers `.env` et adapter les valeurs.
2. Lancer les services:
```bash
docker compose up --build -d
```
3. Ouvrir l’application: `http://localhost:8080`

Arrêter:
```bash
docker compose down
```

Reset complet (supprime volumes/données):
```bash
docker compose down -v
```

## Tests
Lancer les tests API depuis le conteneur serveur:
```bash
docker compose exec server npm run test:api
```

## Structure du dépôt
```text
client/      # SPA (HTML/CSS/JS)
server/      # API Node.js (routes, controllers, models, tests)
db/          # init SQL (schema/seed)
nginx/       # serveur web et reverse proxy
docs/        # documentation et captures
```

## Documentation
- `docs/assignment.md` (consignes du module)
- `docs/documentation_projet.md`
- `docs/classeDiagramme.md`
- `docs/notes.md`
