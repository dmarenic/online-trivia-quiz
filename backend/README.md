# Backend — Online Trivia Quiz

NestJS aplikacija koja poslužuje REST API i Socket.IO gateway za multiplayer
kviz. Podatke sprema u PostgreSQL preko Prisma ORM-a.

Cjelovit opis projekta, arhitektura i upute za Docker nalaze se u
[korijenskom README-u](../README.md). Real-time protokol dokumentiran je
zasebno u `SOCKET_PROTOCOL.md`.

## Što sadrži

- **REST API** — autentikacija (JWT), korisnički profil i statistika, sustav
  prijatelja, pozivnice u sobu, dnevni izazov i administracija pitanja
  (uključujući generiranje pomoću Google Gemini API-ja).
- **Socket.IO gateway** (`src/game.gateway.ts`) — cjelokupna logika multiplayer
  partije. Stanje soba drži se u memoriji procesa; u bazu se sprema samo
  konačni rezultat.
- **Prisma sloj** — shema, migracije i seed skripta s bazom pitanja.

## Instalacija

```bash
npm install
npx prisma generate
npx prisma migrate deploy
npx prisma db seed
```

Prije pokretanja kopiraj predložak varijabli okruženja i popuni vrijednosti:

```bash
cp .env.example .env
```

## npm skripte

| Skripta                | Namjena                                          |
| ---------------------- | ------------------------------------------------ |
| `npm run start:dev`    | Razvojni poslužitelj s praćenjem promjena (:3000) |
| `npm run build`        | Produkcijski build (`dist/`)                      |
| `npm run start:prod`   | Pokretanje builda                                 |
| `npm run lint`         | ESLint s automatskim popravkom                    |
| `npm run format`       | Prettier nad `src/` i `test/`                     |
| `npm test`             | Jedinični testovi (Jest)                          |
| `npm run test:e2e`     | End-to-end testovi                                |
| `npx prisma migrate dev` | Nova migracija u razvoju                        |
| `npx prisma db seed`   | Punjenje baze pitanjima (`prisma/seed.ts`)        |

## Environment varijable

Aplikacija se namjerno **neće pokrenuti** ako neka obavezna varijabla
nedostaje (`src/config/validate-env.ts`).

| Varijabla         | Obavezna | Opis                                                  |
| ----------------- | -------- | ----------------------------------------------------- |
| `DATABASE_URL`    | da       | Connection string prema PostgreSQL bazi                |
| `DIRECT_URL`      | da       | Izravna veza za Prisma migracije                       |
| `JWT_SECRET`      | da       | Tajna za potpisivanje tokena, najmanje 32 znaka        |
| `FRONTEND_URL`    | da       | Dopušteno podrijetlo za CORS (REST i WebSocket)        |
| `GEMINI_API_KEY`  | da       | Ključ za AI generiranje pitanja                        |
| `JWT_EXPIRES_IN`  | ne       | Trajanje tokena, zadano `7d`                           |
| `PORT`            | ne       | Port poslužitelja, zadano `3000`                       |
| `POSTGRES_USER` / `POSTGRES_PASSWORD` / `POSTGRES_DB` | za Docker | Koristi ih `postgres` servis iz `docker-compose.yml` |

## Razvojni poslužitelj

```bash
npm run start:dev
```

API je tada dostupan na `http://localhost:3000`, a provjera zdravlja na
`http://localhost:3000/health`.
