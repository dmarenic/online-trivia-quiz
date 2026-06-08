# Online Trivia Quiz

> Završni rad: Online Trivia Kviz za više igrača

Online Trivia Quiz je moderna full-stack web aplikacija razvijena kao završni rad. Sustav omogućuje natjecanje više igrača u stvarnom vremenu kroz kvizove različitih kategorija, uz podršku za privatne sobe, sustav prijatelja, dnevne izazove, postignuća i ljestvice poretka.

## Opis projekta

Cilj projekta bio je razviti online multiplayer kviz igru u kojoj se igrači natječu u stvarnom vremenu odgovarajući na pitanja iz različitih kategorija. Aplikacija omogućuje kreiranje privatnih soba, pozivanje prijatelja, prikaz rezultata uživo te praćenje uspješnosti svih sudionika.

Uz osnovne multiplayer funkcionalnosti implementirani su i dodatni moduli poput dnevnih izazova (Daily Challenge), sustava postignuća (Achievements), sustava prijatelja (Friends System), administratorskog sučelja za upravljanje pitanjima te integracija umjetne inteligencije za automatsko generiranje novih pitanja.

Produkcijska verzija aplikacije dostupna je na:

**https://online-trivia-quiz.vercel.app/**

---

# Pregled projekta

Aplikacija je razvijena korištenjem moderne web arhitekture koja se sastoji od:

* Next.js frontend aplikacije
* NestJS backend API-ja
* PostgreSQL baze podataka
* Prisma ORM sloja
* Socket.IO komunikacije u stvarnom vremenu
* Google Gemini AI integracije

Projekt podržava:

* Daily Challenge način igre
* Multiplayer kviz sobe
* Sustav prijatelja
* Room pozivnice
* Achievement sustav
* Globalne i dnevne leaderboarde
* Administratorsko upravljanje pitanjima
* AI generiranje novih pitanja

---

# Live Demo

Produkcijska aplikacija:

https://online-trivia-quiz.vercel.app/

Deployment:

| Komponenta              | Platforma  |
| ----------------------- | ---------- |
| Frontend                | Vercel     |
| Backend                 | Render     |
| Database                | PostgreSQL |
| Real-time Communication | Socket.IO  |

---

# Glavne funkcionalnosti

## Korisnički sustav

* Registracija korisnika
* Prijava korisnika
* JWT autentifikacija
* Upravljanje profilom
* Promjena avatara
* Pregled statistike korisnika

## Daily Challenge

* Jedan pokušaj dnevno
* Nasumično generirana pitanja
* Bodovanje prema uspješnosti
* Dnevna ljestvica poretka

## Multiplayer sustav

* Kreiranje privatnih soba
* Pridruživanje postojećim sobama
* Pozivanje prijatelja
* Chat u stvarnom vremenu
* Ready sustav
* Live leaderboard
* Automatsko bodovanje

## Friends sustav

* Slanje zahtjeva za prijateljstvo
* Prihvaćanje zahtjeva
* Odbijanje zahtjeva
* Pregled liste prijatelja
* Room pozivnice

## Achievement sustav

* Otključavanje postignuća
* Praćenje napretka
* Pregled osvojenih achievementa

## Administratorski sustav

* Dodavanje pitanja
* Uređivanje pitanja
* Brisanje pitanja
* AI generiranje pitanja
* Upravljanje bazom pitanja

---

# Korištene tehnologije

## Frontend

### Next.js 15

Korišten za razvoj korisničkog sučelja aplikacije koristeći App Router arhitekturu.

### React 19

Korišten za razvoj interaktivnih komponenti i upravljanje stanjem aplikacije.

### TypeScript

Osigurava tipnu sigurnost i smanjuje mogućnost runtime grešaka.

### Tailwind CSS

Korišten za responzivni dizajn i moderni izgled aplikacije.

### Socket.IO Client

Omogućuje komunikaciju s backendom u stvarnom vremenu.

---

## Backend

### NestJS

Glavni backend framework korišten za:

* REST API
* JWT autentifikaciju
* WebSocket Gateway
* Upravljanje korisnicima
* Upravljanje pitanjima
* Upravljanje prijateljima
* Upravljanje rezultatima

### Prisma ORM

Korišten za:

* pristup bazi podataka
* migracije baze
* tipizirane upite

### PostgreSQL

Relacijska baza podataka za trajnu pohranu podataka.

### JWT + Passport

Koristi se za autentifikaciju i autorizaciju korisnika.

### bcrypt

Koristi se za hashiranje korisničkih lozinki prije spremanja u bazu podataka.

### NestJS Throttler

Koristi se za zaštitu API-ja od prekomjernog broja zahtjeva i potencijalnog spama.

---

## AI Integracija

### Google Gemini API

Koristi se za automatsko generiranje novih kviz pitanja unutar administratorskog sustava.

Administrator može definirati:

* kategoriju
* težinu
* broj pitanja
* temu

Nakon čega Gemini generira nova pitanja koja se mogu spremiti u bazu podataka.

---

## DevOps i razvoj

### Docker

Koristi se za kontejnerizaciju aplikacije i pojednostavljeno pokretanje razvojnog okruženja.

### Git

Sustav za verzioniranje izvornog koda.

### GitHub

Repozitorij i upravljanje razvojem projekta.

### GitHub Actions

Automatizacija build procesa putem CI/CD workflowa.

---

# Arhitektura sustava

```text
Client Browser
       │
       ▼
Frontend (Next.js)
       │
       ├──────────── REST API ────────────┐
       │                                  │
       ▼                                  ▼
NestJS Backend                    Socket.IO Gateway
       │                                  │
       └──────────── Prisma ORM ──────────┘
                      │
                      ▼
                PostgreSQL
```

---

# Struktura projekta

```text
ONLINE-TRIVIA-QUIZ
│
├── backend
│   ├── prisma
│   │   ├── migrations
│   │   ├── schema.prisma
│   │   └── seed.ts
│   │
│   ├── src
│   │   ├── auth
│   │   ├── config
│   │   ├── daily-challenge
│   │   ├── health
│   │   ├── leaderboard
│   │   ├── prisma
│   │   ├── questions
│   │   ├── users
│   │   ├── game.gateway.ts
│   │   ├── app.module.ts
│   │   └── main.ts
│   │
│   ├── Dockerfile
│   └── package.json
│
├── frontend
│   ├── app
│   │   ├── achievements
│   │   ├── admin
│   │   ├── daily
│   │   ├── friends
│   │   ├── leaderboard
│   │   ├── login
│   │   ├── profile
│   │   ├── register
│   │   ├── room
│   │   ├── layout.tsx
│   │   └── page.tsx
│   │
│   ├── public
│   ├── src
│   ├── Dockerfile
│   └── package.json
│
├── .github
│   └── workflows
│       └── build.yml
│
├── docker-compose.yml
└── README.md
```

---

# Sigurnost

Projekt implementira više sigurnosnih mehanizama:

## Autentifikacija

* JWT tokeni
* Passport strategije
* Zaštićene rute

## Sigurnost lozinki

* bcrypt hashiranje
* Lozinke se nikada ne pohranjuju u izvornom obliku

## Validacija podataka

* DTO validacija
* class-validator
* class-transformer

## Rate Limiting

Zaštita od:

* spam poruka
* spam pozivnica
* prekomjernog broja API zahtjeva

## Environment validacija

Prilikom pokretanja aplikacije provjeravaju se obavezne konfiguracijske vrijednosti.

---

# Lokalno pokretanje

## Preduvjeti

Potrebno je imati instalirano:

* Node.js 20+
* PostgreSQL
* Docker (opcionalno)

## Backend

Instalacija paketa:

```bash
npm install
npx prisma migrate deploy
npx prisma generate
npm run start:dev
```

## Frontend

Instalacija paketa:

```bash
npm install
npm run dev
```

---

# Environment konfiguracija

Backend koristi sljedeće environment varijable:

```env
DATABASE_URL=
DIRECT_URL=
JWT_SECRET=
FRONTEND_URL=
GEMINI_API_KEY=
```

Frontend koristi:

```env
NEXT_PUBLIC_API_URL=
```

Nikada ne objavljivati stvarne vrijednosti environment varijabli u repozitoriju.

---

# CI/CD

Projekt koristi GitHub Actions workflow za automatsku provjeru build procesa.

Workflow se nalazi u:

```text
.github/workflows/build.yml
```

Automatski se izvršava prilikom promjena u repozitoriju.

---

# Moguća buduća proširenja

* Napredniji matchmaking sustav
* Dodatni tipovi achievementa
* Analitika i statistika igrača
* Sezonski leaderboard sustav
* Dodatne kategorije i tipovi kvizova
* Proširenje AI alata za generiranje sadržaja

---

# Autor

Dominik Mrarenić

Projekt je razvijen kao završni rad na temu **"Online Trivia Kviz za više igrača"** koristeći moderne full-stack tehnologije s naglaskom na multiplayer komunikaciju u stvarnom vremenu.
