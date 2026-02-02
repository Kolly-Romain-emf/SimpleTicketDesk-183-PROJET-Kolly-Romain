# TODO (alignement PROJECT_RULES_183.md)

## Deja implemente (etat actuel)
- Auth sessions + bcrypt + regeneration login + logout + MFA (login-mfa/enable-mfa)
- CRUD tickets + autorisations owner/admin + tickets publics
- CRUD users + autorisations admin/owner + creation admin
- CRUD statuts (admin)
- Validation serveur basique (auth, tickets, users, statuts)
- Script de tests API (inclut MFA + roles)
- SPA: routing + pages login/register/dashboard + tickets publics sur login
- Profile: update infos + password via API
- SPA: page "System Logs" (admin) connectee a /admin/audit
- Seed demo (comptes + tickets) + run automatique au demarrage
- Normalisation des roles (ADMIN/USER) et mapping user/tickets cote client
- Email unique verifie au update user (message 409)
- Base alignee sur db_simpleticketdesk (env)
- UX nettoyage partiel: dashboards simplifies + logs page minimaliste
- DocumentationGLOBALTECHNIQUE.md creee (choix techniques + securite)
- documentation_projet.md rempli (sections 4-9 + checklist MFA/rate-limit/logs)
- Messages d'erreur generiques cote client
- Controle routes: ticket detail public + routes auth/roles ok
- Framework tests API (testFramework.js)
- Rate-limit auth/MFA (login, login-mfa, enable-mfa)
- Tests auto rate-limit auth/MFA
- Winston + middleware HTTP (logs/access.log)
- Journal d'audit MySQL (table audit_log) + insertion auto actions sensibles
- Route /admin/audit (admin seulement)
- Tests API pour /admin/audit (guest/client/admin)
- Proxy Nginx pour /admin (audit)
- Echappement HTML cote client (tickets, users, status, sidebar)
- Echappement HTML renforce (profile + IDs dans vues/lien)
- Tests API: cookie session (HttpOnly/SameSite) + regeneration session + role injection register
- Test unitaire client: escapeHtml

## Restant global (grandes taches)

