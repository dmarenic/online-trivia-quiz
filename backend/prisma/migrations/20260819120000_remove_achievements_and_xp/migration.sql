/*
  Uklanjanje ostataka sustava postignuća i sustava iskustva.

  Sustav postignuća i sustav iskustva uklonjeni su iz aplikacije zapisom
  f99d8bd "Remove achievements and XP/level system", ali za to nikada nije
  napravljena migracija. Zbog toga se stanje baze podataka razilazilo od
  datoteke schema.prisma, koja te tablice i stupce više ne deklarira.

  Ova migracija to usklađuje:

  - briše se tablica "Achievement" zajedno sa svojim stranim ključem i indeksima
  - brišu se stupci "xp", "level", "dailyStreak" i "lastDailyDate" iz tablice "User"
  - briše se stupac "rewardXp" iz tablice "DailyChallenge"

  UPOZORENJE: postojeći podatci u tim tablicama i stupcima bit će trajno obrisani.

  Stupac "rewardXp" bio je NOT NULL bez zadane vrijednosti, a aplikacija ga
  nakon uklanjanja sustava iskustva više ne postavlja pri stvaranju dnevnog
  izazova. Na bazi izgrađenoj iz migracija to je značilo da upis novog dnevnog
  izazova pada s pogreškom "null value in column rewardXp violates not-null
  constraint", pa dnevni izazov nije radio.
*/

-- DropForeignKey
ALTER TABLE "Achievement" DROP CONSTRAINT IF EXISTS "Achievement_userId_fkey";

-- DropTable
DROP TABLE IF EXISTS "Achievement";

-- AlterTable
ALTER TABLE "User" DROP COLUMN IF EXISTS "xp",
DROP COLUMN IF EXISTS "level",
DROP COLUMN IF EXISTS "dailyStreak",
DROP COLUMN IF EXISTS "lastDailyDate";

-- AlterTable
ALTER TABLE "DailyChallenge" DROP COLUMN IF EXISTS "rewardXp";
