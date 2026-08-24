# Online Trivia Quiz

Završni rad — online kviz za više igrača u stvarnom vremenu.

Igrači stvaraju privatnu sobu, pozivaju prijatelje i zajedno odgovaraju na pitanja
iz odabrane kategorije. Bodovi se računaju prema točnosti i brzini odgovora, a
rezultat se prikazuje uživo tijekom partije.

Objavljena verzija: **https://online-trivia-quiz.vercel.app/**

## Funkcionalnosti

- Registracija i prijava (JWT)
- Privatne sobe s kodom, chat i sustav spremnosti igrača
- Bodovanje po točnosti i brzini, ljestvica uživo
- Dnevni izazov — jedan pokušaj po danu, ista pitanja za sve igrače
- Prijatelji i pozivnice u sobu
- Administratorsko sučelje za pitanja, uz generiranje pomoću Google Gemini API-ja
- Profil sa statistikom i poviješću odigranih partija

Gost može igrati samo s nadimkom; prijava je potrebna za profil, prijatelje i
dnevni izazov.

## Tehnologije

| Dio | Tehnologije |
| --- | --- |
| Frontend | Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS |
| Backend | NestJS 11, TypeScript, Socket.IO, Passport (JWT), bcrypt |
| Baza | PostgreSQL, Prisma ORM |
| Ostalo | Google Gemini API, Docker, GitHub Actions |

## Arhitektura

```text
        preglednik
            │
   ┌────────┴────────┐
   │  Next.js (3001) │
   └────────┬────────┘
            │  REST  +  Socket.IO
   ┌────────┴────────┐
   │  NestJS (3000)  │
   └────────┬────────┘
            │  Prisma
      ┌─────┴─────┐
      │ PostgreSQL│
      └───────────┘
```

REST pokriva prijavu, profil, prijatelje, dnevni izazov i administraciju pitanja.
Socket.IO pokriva sve što se događa unutar sobe — ulazak, chat, pitanja, odgovore
i rezultat.

Stanje aktivnih partija drži se u memoriji poslužitelja, a u bazu se sprema tek
konačni rezultat. Zbog toga ponovno pokretanje poslužitelja prekida partije koje
su u tijeku. Detalji real-time sloja opisani su u
[`SOCKET_PROTOCOL.md`](SOCKET_PROTOCOL.md).

## Struktura projekta

```text
online-trivia-quiz
├── backend/               NestJS API + Socket.IO gateway
│   ├── prisma/            shema, migracije, seed skripta
│   ├── src/
│   │   ├── auth/          registracija, prijava, JWT, guardovi
│   │   ├── daily-challenge/
│   │   ├── questions/     administracija i AI generiranje
│   │   ├── users/         profil, statistika, prijatelji
│   │   ├── game.gateway.ts   cjelokupna logika multiplayer partije
│   │   └── main.ts
│   └── test/
├── frontend/              Next.js aplikacija
│   ├── app/               stranice po značajkama
│   └── src/lib/           zajednički kod (API poziv, konstante)
├── .github/workflows/     CI
├── docker-compose.yml
└── SOCKET_PROTOCOL.md
```

## Pokretanje

Potrebni su Node.js 20+ i PostgreSQL (ili Docker).

### 1. Varijable okruženja

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env.local
```

Backend se namjerno neće pokrenuti ako neka obavezna varijabla nedostaje:
`DATABASE_URL`, `DIRECT_URL`, `JWT_SECRET` (najmanje 32 znaka), `FRONTEND_URL`
i `GEMINI_API_KEY`. Frontend treba samo `NEXT_PUBLIC_API_URL`.

### 2. Backend

Iz direktorija `backend/`:

```bash
npm install
npx prisma generate
npx prisma migrate deploy
npx prisma db seed
npm run start:dev
```

Bez koraka `npx prisma db seed` baza nema nijedno pitanje pa se partija ne može
pokrenuti. API je zatim na `http://localhost:3000`.

### 3. Frontend

Iz direktorija `frontend/`:

```bash
npm install
npm run dev
```

Sučelje je na `http://localhost:3001`.

### Docker

Cijeli stack (baza + backend + frontend) pokreće se odjednom:

```bash
docker compose up --build
```

Bez `--build` Compose ponovno koristi ranije izgrađene slike, pa se izmjene koda
ne vide. Za ovaj način rada `DATABASE_URL` i `DIRECT_URL` u `backend/.env` moraju
pokazivati na servis `postgres`.

> Prije naredbi `prisma migrate reset` i `prisma db seed` provjeri na koju bazu
> ciljaš — obje brišu podatke. `npx prisma migrate status` ispisuje ciljni
> poslužitelj i ništa ne mijenja.

## Testovi

Iz direktorija `backend/`:

```bash
npm test
```

Testovi pokrivaju bodovanje, tijek odgovaranja i ovlasti domaćina sobe u Socket.IO
gatewayu te izračun točnosti igrača. Ne zahtijevaju bazu podataka. Isti se testovi,
uz ESLint, provjeru tipova i build oba projekta, izvode i u GitHub Actions
workflowu (`.github/workflows/build.yml`).

## Sigurnost

- Lozinke se pohranjuju isključivo kao bcrypt hash
- JWT za prijavu; korisnik se pri svakom zahtjevu ponovno čita iz baze, pa obrisan
  račun s još valjanim tokenom nema pristup
- Administratorske rute zaštićene su provjerom uloge
- REST zahtjevi validiraju se DTO-ima; zahtjev s poljem koje DTO ne opisuje se odbija
- Socket događaji validiraju se zasebno, jer se DTO validacija na WebSocket sloj
  ne primjenjuje
- Ograničenje broja zahtjeva na razini API-ja i pojedinih socket događaja
- CORS je ograničen na adresu frontenda

Točnost odgovora i bodove računa isključivo poslužitelj. Točan odgovor ne šalje se
klijentu prije nego što igrač odgovori, pa se ne može pročitati iz mrežnog prometa.

## Autor

Dominik Marenić
