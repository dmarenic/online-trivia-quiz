# Frontend — Online Trivia Quiz

Next.js (App Router) aplikacija koja čini korisničko sučelje kviza: prijava i
registracija, multiplayer sobe u stvarnom vremenu, dnevni izazov, sustav
prijatelja, profil sa statistikom i administracija pitanja.

Cjelovit opis projekta i arhitektura nalaze se u
[korijenskom README-u](../README.md).

## Struktura

- `app/` — stranice po značajkama (`room`, `daily`, `friends`, `profile`,
  `admin/questions`, `leaderboard`, `login`, `register`).
- `src/lib/` — zajednički kod: `api.ts` (omotač oko fetcha s JWT zaglavljem),
  `ui.ts` (dijeljene Tailwind klase), `categories.ts`, `validation.ts`.
- `public/sounds/` — zvučni efekti igre.

Svi REST pozivi idu kroz `apiFetch` iz `src/lib/api.ts`. Komunikacija u
stvarnom vremenu ide preko Socket.IO klijenta koji se stvara u
`app/room/page.tsx`.

## Instalacija

```bash
npm install
cp .env.example .env.local
```

## npm skripte

| Skripta                | Namjena                                      |
| ---------------------- | -------------------------------------------- |
| `npm run dev`          | Razvojni poslužitelj na portu **3001**        |
| `npm run build`        | Produkcijski build                            |
| `npm start`            | Pokretanje builda (port 3000)                 |
| `npm run lint`         | ESLint                                        |
| `npm run format`       | Prettier nad izvornim kodom                   |
| `npm run format:check` | Provjera formatiranja bez izmjena             |

## Environment varijable

| Varijabla             | Obavezna | Opis                                    |
| --------------------- | -------- | --------------------------------------- |
| `NEXT_PUBLIC_API_URL` | da       | Bazni URL backenda, npr. `http://localhost:3000` |

Varijabla se ugrađuje u build, pa nakon njezine promjene treba ponoviti
`npm run build`.

## Razvojni poslužitelj

```bash
npm run dev
```

Sučelje je dostupno na `http://localhost:3001`. Backend mora biti pokrenut
odvojeno (v. [backend/README.md](../backend/README.md)).
