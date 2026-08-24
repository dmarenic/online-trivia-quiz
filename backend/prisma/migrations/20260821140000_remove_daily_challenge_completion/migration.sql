/*
  Uklanjanje tablice "DailyChallengeCompletion".

  Tablica je uvedena migracijom 20260601142324_daily_challenges kao zapis o
  ispunjenom dnevnom izazovu. Njezinu je ulogu u međuvremenu u cijelosti
  preuzela tablica "DailyChallengeAttempt", koja uz sam pokušaj bilježi i
  rezultat te zastavicu "completed". Aplikacija "DailyChallengeCompletion"
  više ne čita ni ne upisuje ni na jednom mjestu, pa je tablica ostala samo
  kao mrtvi dio sheme.

  UPOZORENJE: postojeći zapisi u toj tablici bit će trajno obrisani. Podatci
  se time ne gube jer isti dnevni izazovi imaju odgovarajući zapis u tablici
  "DailyChallengeAttempt".

  DROP TABLE u PostgreSQL-u sam uklanja indekse i strane ključeve te tablice,
  pa zasebni DROP CONSTRAINT nije potreban. IF EXISTS je ovdje namjerno: bez
  njega bi migracija pala na bazi na kojoj je tablica već ručno uklonjena.
*/

-- DropTable
DROP TABLE IF EXISTS "DailyChallengeCompletion";
