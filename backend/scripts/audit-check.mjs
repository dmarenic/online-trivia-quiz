#!/usr/bin/env node
// Provjera sigurnosnih ranjivosti za CI.
//
// `npm audit --audit-level=high` nema način da se pojedina ranjivost svjesno
// prihvati, pa cijeli build pada i zbog ranjivosti koje trenutno uopće nemaju
// popravak. Ova skripta radi isto što i `npm audit --audit-level=high`, ali
// dopušta izričito dokumentirane iznimke iz popisa DOPUSTENE_IZNIMKE.
//
// Pokretanje: npm run audit:ci

import { execSync } from 'node:child_process';

const DOPUSTENE_IZNIMKE = [
  {
    id: 'GHSA-ggr8-5vv4-36mx',
    paket: 'deepmerge-ts',
    razlog:
      'Dolazi isključivo kroz Prisma CLI (prisma -> @prisma/config -> deepmerge-ts@7.1.5). ' +
      'Nijedno izdanje Prisme, uključujući 7.9.1, još ne koristi zakrpani deepmerge-ts 8, ' +
      'a `npm audit fix --force` bi vratio prisma na 6.12.0, što je korak unatrag. ' +
      'Ranjivost je iscrpljivanje stoga pri spajanju rekurzivnih objekata u Prisma ' +
      'konfiguraciji, koju pišemo mi sami i ne dolazi iz vanjskog unosa.',
  },
];

function pokreniAudit() {
  try {
    return execSync('npm audit --json', {
      encoding: 'utf8',
      maxBuffer: 32 * 1024 * 1024,
      stdio: ['ignore', 'pipe', 'ignore'],
    });
  } catch (greska) {
    // `npm audit` vraća izlazni kod != 0 kad nađe ranjivosti, ali JSON i dalje
    // ispisuje na stdout, pa ga ovdje pokupimo umjesto da rušimo skriptu.
    if (greska.stdout) return greska.stdout;
    throw greska;
  }
}

function idIzUrla(url) {
  const podudaranje = /(GHSA-[a-z0-9-]+)/i.exec(url ?? '');
  return podudaranje ? podudaranje[1] : null;
}

const izvjestaj = JSON.parse(pokreniAudit());
const paketi = izvjestaj.vulnerabilities ?? {};

// Skupimo stvarne savjete (advisories). Stavke tipa string u `via` znače samo
// da je paket ranjiv preko svoje ovisnosti, pa ih ne brojimo dvaput.
const ozbiljne = new Map();
for (const [nazivPaketa, podaci] of Object.entries(paketi)) {
  for (const stavka of podaci.via ?? []) {
    if (typeof stavka !== 'object') continue;
    if (stavka.severity !== 'high' && stavka.severity !== 'critical') continue;

    const id = idIzUrla(stavka.url) ?? `source-${stavka.source}`;
    if (ozbiljne.has(id)) continue;
    ozbiljne.set(id, {
      id,
      paket: stavka.name ?? nazivPaketa,
      naslov: stavka.title ?? '(bez naslova)',
      razina: stavka.severity,
      url: stavka.url ?? '',
    });
  }
}

const dopusteniIdevi = new Set(DOPUSTENE_IZNIMKE.map((i) => i.id));
const blokirajuce = [...ozbiljne.values()].filter((s) => !dopusteniIdevi.has(s.id));
const prihvacene = [...ozbiljne.values()].filter((s) => dopusteniIdevi.has(s.id));

for (const stavka of prihvacene) {
  const iznimka = DOPUSTENE_IZNIMKE.find((i) => i.id === stavka.id);
  console.log(`[prihvaćeno] ${stavka.id} (${stavka.paket}, ${stavka.razina}): ${stavka.naslov}`);
  console.log(`             razlog: ${iznimka.razlog}`);
}

// Ako iznimka više nije potrebna, javi da se može obrisati iz popisa.
for (const iznimka of DOPUSTENE_IZNIMKE) {
  if (!ozbiljne.has(iznimka.id)) {
    console.log(
      `[napomena] Iznimka ${iznimka.id} (${iznimka.paket}) više se ne pojavljuje u auditu — može se ukloniti iz audit-check.mjs.`,
    );
  }
}

if (blokirajuce.length > 0) {
  console.error(`\nPronađeno ${blokirajuce.length} neriješenih ranjivosti razine high/critical:\n`);
  for (const stavka of blokirajuce) {
    console.error(`  ${stavka.id} — ${stavka.paket} (${stavka.razina})`);
    console.error(`    ${stavka.naslov}`);
    if (stavka.url) console.error(`    ${stavka.url}`);
  }
  console.error('\nPokreni `npm audit fix`. Ako popravak ne postoji, dodaj dokumentiranu');
  console.error('iznimku u DOPUSTENE_IZNIMKE u backend/scripts/audit-check.mjs.');
  process.exit(1);
}

console.log('\nNema neriješenih ranjivosti razine high ili critical.');
