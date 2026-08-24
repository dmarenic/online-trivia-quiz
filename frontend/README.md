# Frontend

Next.js aplikacija (App Router) koja čini korisničko sučelje kviza: prijava i
registracija, multiplayer sobe, dnevni izazov, prijatelji, profil sa statistikom
i administracija pitanja.

Opis cijelog projekta je u [korijenskom README-u](../README.md).

## Sadržaj

- `app/` — stranice po značajkama: `room`, `daily`, `friends`, `profile`,
  `leaderboard`, `admin/questions`, `login`, `register`
- `src/lib/` — zajednički kod: `api.ts` (omotač oko fetcha koji dodaje JWT),
  `ui.ts` (dijeljene Tailwind klase), `categories.ts`, `validation.ts`
- `public/sounds/` — zvučni efekti

Većina REST poziva ide kroz `apiFetch` iz `src/lib/api.ts`. Iznimke su prijava,
registracija, dodavanje prijatelja i izmjena nadimka: one zovu `fetch` izravno
jer im treba status ili tijelo neuspješnog odgovora (npr. 409 kad je nadimak
zauzet), a `apiFetch` svaki neuspjeh pretvara u iznimku. Komunikacija u stvarnom
vremenu ide preko Socket.IO klijenta koji se stvara u `app/room/page.tsx`.

## Instalacija

```bash
npm install
cp .env.example .env.local
```

## Skripte

| Skripta | Namjena |
| --- | --- |
| `npm run dev` | Razvojni poslužitelj, port 3001 |
| `npm run build` | Produkcijski build |
| `npm start` | Pokretanje builda, port 3000 |
| `npm run lint` | ESLint |
| `npm run format` | Prettier |
| `npm run format:check` | Provjera formatiranja bez izmjena |

## Varijable okruženja

| Varijabla | Obavezna | Opis |
| --- | --- | --- |
| `NEXT_PUBLIC_API_URL` | da | Adresa backenda, npr. `http://localhost:3000` |

Varijabla se ugrađuje u build, pa nakon promjene treba ponoviti `npm run build`.

## Pokretanje

```bash
npm run dev
```

Sučelje je na `http://localhost:3001`. Backend mora biti pokrenut odvojeno
(v. [backend/README.md](../backend/README.md)).
