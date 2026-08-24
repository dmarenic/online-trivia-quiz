# Backend

NestJS aplikacija koja poslužuje REST API i Socket.IO gateway za kviz. Podatke
sprema u PostgreSQL preko Prisma ORM-a.

Opis cijelog projekta je u [korijenskom README-u](../README.md), a real-time sloj
u [`SOCKET_PROTOCOL.md`](../SOCKET_PROTOCOL.md).

## Sadržaj

- `src/auth/` — registracija, prijava, JWT strategija i guardovi
- `src/users/` — profil, statistika, prijatelji, pozivnice u sobu
- `src/daily-challenge/` — dnevni izazov
- `src/questions/` — administracija pitanja i generiranje preko Gemini API-ja
- `src/game.gateway.ts` — cjelokupna logika multiplayer partije
- `prisma/` — shema, migracije i seed skripta s pitanjima

## Instalacija

```bash
npm install
cp .env.example .env
npx prisma generate
npx prisma migrate deploy
npx prisma db seed
```

## Skripte

| Skripta | Namjena |
| --- | --- |
| `npm run start:dev` | Razvojni poslužitelj s praćenjem promjena, port 3000 |
| `npm run build` | Produkcijski build u `dist/` |
| `npm run start:prod` | Pokretanje builda |
| `npm run lint` | ESLint s automatskim popravkom |
| `npm run format` | Prettier nad `src/` i `test/` |
| `npm test` | Jedinični testovi |
| `npm run test:e2e` | E2e testovi (traže popunjen `.env` i dostupnu bazu) |
| `npx prisma migrate dev` | Nova migracija u razvoju |
| `npx prisma db seed` | Punjenje baze pitanjima |

## Varijable okruženja

Aplikacija se namjerno neće pokrenuti ako neka obavezna varijabla nedostaje
(`src/config/validate-env.ts`).

| Varijabla | Obavezna | Opis |
| --- | --- | --- |
| `DATABASE_URL` | da | Veza prema PostgreSQL bazi |
| `DIRECT_URL` | da | Izravna veza, koristi je Prisma za migracije |
| `JWT_SECRET` | da | Tajna za potpisivanje tokena, najmanje 32 znaka |
| `FRONTEND_URL` | da | Dopušteno podrijetlo za CORS |
| `GEMINI_API_KEY` | da | Ključ za generiranje pitanja |
| `JWT_EXPIRES_IN` | ne | Trajanje tokena, zadano `7d` |
| `PORT` | ne | Port poslužitelja, zadano `3000` |
| `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB` | za Docker | Koristi ih `postgres` servis iz `docker-compose.yml` |

## Pokretanje

```bash
npm run start:dev
```

API je na `http://localhost:3000`, provjera zdravlja na `http://localhost:3000/health`.
