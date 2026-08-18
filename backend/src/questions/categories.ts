// Jedini popis kategorija na backendu. Koriste ga rotacija dnevnog izazova
// (daily-challenge.controller.ts) i seed skripta (prisma/seed.ts) — prije je
// isti popis postojao u obje datoteke pa se mogao razići.
// Frontend ima vlastitu kopiju (frontend/src/lib/categories.ts) jer su to dva
// odvojena npm projekta bez zajedničkog paketa; popisi se moraju poklapati.
export const QUIZ_CATEGORIES = [
  'Sport',
  'Geografija',
  'Računarstvo',
  'Povijest',
  'Znanost',
  'Književnost',
  'Umjetnost',
  'Glazba',
  'Videoigre',
  'Trendovi i aktualnosti',
  'Poslovanje i brendovi',
  'Životinje',
  'Ljudsko tijelo i zdravlje',
];
