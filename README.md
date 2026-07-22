# Huishouden — self-hosted

Een huishoud-PWA voor twee personen (Rowan & Jamie-Lee): dagelijkse taken,
wekelijkse taakverdeling, kookplanning, gedeelde boodschappenlijst en statistieken.

Deze versie draait **volledig self-hosted** als één Docker-container op je eigen
server (bv. ZimaOS). Geen Google Sheets, geen Apps Script, geen externe diensten —
alle data staat in een SQLite-bestand op de server.

## Stack

| Laag | Keuze |
|------|-------|
| Frontend | Vue 3 + Vite, PWA (offline-first), lettertypes lokaal gebundeld |
| Backend  | Node 20 + Fastify, serveert de static build én de JSON-API op `/api` |
| Opslag   | SQLite (`better-sqlite3`), één bestand in het gemounte `/data`-volume |
| Auth     | Login per persoon met sessie-cookie |
| Push     | Web Push (VAPID) + dagelijkse herinnering via cron — zelf gehost |

```
frontend/   Vue-bron → `vite build` → frontend/dist (door de backend geserveerd)
backend/    Fastify-server (TypeScript) + SQLite-schema, API-routes, push
Dockerfile          multi-stage build (frontend → backend → slanke runtime)
docker-compose.yml  ZimaOS/Docker deployment
.env.example        alle configuratie-opties
```

## Snel starten (Docker / ZimaOS)

```bash
docker compose up -d --build
```

Open daarna `http://<server-ip>:8080` en log in.

**Standaard accounts (wijzig het wachtwoord na de eerste login):**

| Gebruiker | Wachtwoord |
|-----------|-----------|
| `rowan`   | `rowan` (of `SEED_ROWAN_PASSWORD`) |
| `jamie`   | `jamie` (of `SEED_JAMIE_PASSWORD`) |

### ZimaOS

1. Kopieer `docker-compose.yml` naar je server.
2. ZimaOS → App Store → **Custom Install** (of het `+`-icoon) → importeer de compose-file.
3. Pas zo nodig de poort (`8080`), `TZ` en `SESSION_SECRET` aan.
4. Start; de app is bereikbaar op de gekozen poort.

Data (SQLite-db + gegenereerde sleutels) leeft in het named volume `huishouden-data`.
Back-up = dat volume kopiëren.

## Configuratie

Alle opties staan in [`.env.example`](./.env.example). De belangrijkste:

- `SESSION_SECRET` — zet een lange, vaste waarde zodat logins restarts overleven.
- `SEED_ROWAN_PASSWORD` / `SEED_JAMIE_PASSWORD` — alleen gebruikt bij de eerste boot.
- `REMINDER_CRON` — tijdstip van de ochtendherinnering (standaard `0 7 * * *`).
- `COOKIE_SECURE=true` — zet dit **alleen** achter HTTPS (reverse proxy).
- `VAPID_*` — worden automatisch gegenereerd en bewaard; alleen instellen als je
  je eigen sleutels wil vastzetten.

## Buitenshuis bereikbaar maken

Web Push en secure cookies vereisen HTTPS. Zet de app achter een reverse proxy
(Caddy, Nginx Proxy Manager, Traefik) met een TLS-certificaat en zet dan
`COOKIE_SECURE=true`. Op iOS werkt push pas nadat de app aan het beginscherm is
toegevoegd.

## Lokaal ontwikkelen

```bash
# Backend (API op :3000)
cd backend && npm install && npm run dev

# Frontend (Vite dev server op :5173, proxyt /api naar :3000)
cd frontend && npm install && npm run dev
```

## Weken, taken en koken invoeren

Omdat de Google Sheet vervalt, beheer je alles in de app zelf:

- **Taken** → `+ Week` maakt een nieuwe week aan; met **Bewerken** vul je per
  persoon per dag de taken in.
- **Koken** → **Bewerken** wijst per dag een kok (of "Samen") en gerecht toe.
- De referentie-takenlijst per kamer wordt bij de eerste start geseed en is
  uitbreidbaar via de API (`/api/rooms`, `/api/chores`).
