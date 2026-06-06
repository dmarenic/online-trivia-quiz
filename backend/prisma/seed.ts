import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

type SeedQuestion = {
  category: string;
  difficulty: "easy" | "medium" | "hard";
  question: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctAnswer: string;
};

const categoriesToReset = [
  "Matematika",
  "Sport",
  "Geografija",
  "Računarstvo",
  "Povijest",
  "Znanost",
  "Književnost",
  "Umjetnost",
  "Glazba",
  "Videoigre",
  "Trendovi i aktualnosti",
  "Poslovanje i brendovi",
  "Životinje",
  "Ljudsko tijelo i zdravlje"
];

const questionsWithDifficulty: SeedQuestion[] = [
  {
    "category": "Sport",
    "difficulty": "easy",
    "question": "Koliko igrača ima nogometna momčad na terenu?",
    "optionA": "11",
    "optionB": "9",
    "optionC": "10",
    "optionD": "12",
    "correctAnswer": "11"
  },
  {
    "category": "Sport",
    "difficulty": "easy",
    "question": "Koji sport igra Novak Đoković?",
    "optionA": "Nogomet",
    "optionB": "Košarka",
    "optionC": "Rukomet",
    "optionD": "Tenis",
    "correctAnswer": "Tenis"
  },
  {
    "category": "Sport",
    "difficulty": "easy",
    "question": "Koliko traje regularna nogometna utakmica?",
    "optionA": "80 minuta",
    "optionB": "120 minuta",
    "optionC": "90 minuta",
    "optionD": "60 minuta",
    "correctAnswer": "90 minuta"
  },
  {
    "category": "Sport",
    "difficulty": "easy",
    "question": "Koliko igrača jedne ekipe igra na terenu u košarci?",
    "optionA": "7",
    "optionB": "5",
    "optionC": "4",
    "optionD": "6",
    "correctAnswer": "5"
  },
  {
    "category": "Sport",
    "difficulty": "easy",
    "question": "Koji se Grand Slam turnir igra u Londonu?",
    "optionA": "Wimbledon",
    "optionB": "US Open",
    "optionC": "Australian Open",
    "optionD": "Roland Garros",
    "correctAnswer": "Wimbledon"
  },
  {
    "category": "Sport",
    "difficulty": "easy",
    "question": "U kojem sportu se koristi pak?",
    "optionA": "Ragbi",
    "optionB": "Baseball",
    "optionC": "Odbojka",
    "optionD": "Hokej na ledu",
    "correctAnswer": "Hokej na ledu"
  },
  {
    "category": "Sport",
    "difficulty": "easy",
    "question": "Koliko bodova vrijedi trica u košarci?",
    "optionA": "2",
    "optionB": "4",
    "optionC": "3",
    "optionD": "1",
    "correctAnswer": "3"
  },
  {
    "category": "Sport",
    "difficulty": "medium",
    "question": "Koja država je poznata po samurajima i sumo hrvanju?",
    "optionA": "Egipat",
    "optionB": "Japan",
    "optionC": "Brazil",
    "optionD": "Kanada",
    "correctAnswer": "Japan"
  },
  {
    "category": "Sport",
    "difficulty": "easy",
    "question": "Koji sport se igra na Tour de Franceu?",
    "optionA": "Biciklizam",
    "optionB": "Atletika",
    "optionC": "Plivanje",
    "optionD": "Skijanje",
    "correctAnswer": "Biciklizam"
  },
  {
    "category": "Sport",
    "difficulty": "easy",
    "question": "Kako se zove najveće nogometno natjecanje reprezentacija?",
    "optionA": "Liga prvaka",
    "optionB": "Europska liga",
    "optionC": "Davis Cup",
    "optionD": "Svjetsko prvenstvo",
    "correctAnswer": "Svjetsko prvenstvo"
  },
  {
    "category": "Sport",
    "difficulty": "easy",
    "question": "U kojem sportu se izvodi servis?",
    "optionA": "Skijanje",
    "optionB": "Gimnastika",
    "optionC": "Tenis",
    "optionD": "Boks",
    "correctAnswer": "Tenis"
  },
  {
    "category": "Sport",
    "difficulty": "medium",
    "question": "Koliko setova najčešće treba osvojiti za pobjedu u muškom Grand Slam meču?",
    "optionA": "4",
    "optionB": "3",
    "optionC": "1",
    "optionD": "2",
    "correctAnswer": "3"
  },
  {
    "category": "Sport",
    "difficulty": "easy",
    "question": "Koji sport ima discipline slobodno, prsno, leđno i leptir?",
    "optionA": "Plivanje",
    "optionB": "Atletika",
    "optionC": "Vaterpolo",
    "optionD": "Gimnastika",
    "correctAnswer": "Plivanje"
  },
  {
    "category": "Sport",
    "difficulty": "hard",
    "question": "Kako se zove prostor oko golf rupe?",
    "optionA": "Ring",
    "optionB": "Pit",
    "optionC": "Base",
    "optionD": "Green",
    "correctAnswer": "Green"
  },
  {
    "category": "Sport",
    "difficulty": "easy",
    "question": "Koji sport se igra palicom i lopticom na ledu?",
    "optionA": "Golf",
    "optionB": "Ragbi",
    "optionC": "Hokej na ledu",
    "optionD": "Kriket",
    "correctAnswer": "Hokej na ledu"
  },
  {
    "category": "Sport",
    "difficulty": "medium",
    "question": "Koliko igrača čini rukometnu ekipu na terenu uključujući vratara?",
    "optionA": "8",
    "optionB": "7",
    "optionC": "5",
    "optionD": "6",
    "correctAnswer": "7"
  },
  {
    "category": "Sport",
    "difficulty": "medium",
    "question": "Koja je osnovna jedinica bodovanja u tenisu nakon 30?",
    "optionA": "40",
    "optionB": "35",
    "optionC": "45",
    "optionD": "50",
    "correctAnswer": "40"
  },
  {
    "category": "Sport",
    "difficulty": "hard",
    "question": "Koji sport ima položaje quarterback i wide receiver?",
    "optionA": "Ragbi",
    "optionB": "Baseball",
    "optionC": "Košarka",
    "optionD": "Američki nogomet",
    "correctAnswer": "Američki nogomet"
  },
  {
    "category": "Sport",
    "difficulty": "medium",
    "question": "U kojem sportu postoji pojam hat-trick?",
    "optionA": "Stolni tenis",
    "optionB": "Golf",
    "optionC": "Nogomet",
    "optionD": "Šah",
    "correctAnswer": "Nogomet"
  },
  {
    "category": "Sport",
    "difficulty": "easy",
    "question": "Koja boja kartona u nogometu znači isključenje?",
    "optionA": "Zeleni",
    "optionB": "Crveni",
    "optionC": "Žuti",
    "optionD": "Plavi",
    "correctAnswer": "Crveni"
  },
  {
    "category": "Geografija",
    "difficulty": "easy",
    "question": "Koji je glavni grad Hrvatske?",
    "optionA": "Zagreb",
    "optionB": "Split",
    "optionC": "Rijeka",
    "optionD": "Osijek",
    "correctAnswer": "Zagreb"
  },
  {
    "category": "Geografija",
    "difficulty": "easy",
    "question": "Koja je najveća država na svijetu površinom?",
    "optionA": "Kanada",
    "optionB": "Kina",
    "optionC": "SAD",
    "optionD": "Rusija",
    "correctAnswer": "Rusija"
  },
  {
    "category": "Geografija",
    "difficulty": "easy",
    "question": "Koja rijeka prolazi kroz Budimpeštu?",
    "optionA": "Drava",
    "optionB": "Rajna",
    "optionC": "Dunav",
    "optionD": "Sava",
    "correctAnswer": "Dunav"
  },
  {
    "category": "Geografija",
    "difficulty": "easy",
    "question": "Na kojem kontinentu se nalazi Egipat?",
    "optionA": "Australija",
    "optionB": "Afrika",
    "optionC": "Azija",
    "optionD": "Europa",
    "correctAnswer": "Afrika"
  },
  {
    "category": "Geografija",
    "difficulty": "easy",
    "question": "Koji je glavni grad Italije?",
    "optionA": "Rim",
    "optionB": "Milano",
    "optionC": "Napulj",
    "optionD": "Torino",
    "correctAnswer": "Rim"
  },
  {
    "category": "Geografija",
    "difficulty": "easy",
    "question": "Koji ocean je najveći?",
    "optionA": "Atlantski ocean",
    "optionB": "Indijski ocean",
    "optionC": "Arktički ocean",
    "optionD": "Tihi ocean",
    "correctAnswer": "Tihi ocean"
  },
  {
    "category": "Geografija",
    "difficulty": "easy",
    "question": "Koja država ima gradove Madrid i Barcelonu?",
    "optionA": "Francuska",
    "optionB": "Italija",
    "optionC": "Španjolska",
    "optionD": "Portugal",
    "correctAnswer": "Španjolska"
  },
  {
    "category": "Geografija",
    "difficulty": "easy",
    "question": "Koji je najviši vrh svijeta?",
    "optionA": "Kilimandžaro",
    "optionB": "Mount Everest",
    "optionC": "K2",
    "optionD": "Mont Blanc",
    "correctAnswer": "Mount Everest"
  },
  {
    "category": "Geografija",
    "difficulty": "medium",
    "question": "Koja pustinja je najveća vruća pustinja?",
    "optionA": "Sahara",
    "optionB": "Gobi",
    "optionC": "Kalahari",
    "optionD": "Atacama",
    "correctAnswer": "Sahara"
  },
  {
    "category": "Geografija",
    "difficulty": "easy",
    "question": "Koji je glavni grad Francuske?",
    "optionA": "Lyon",
    "optionB": "Marseille",
    "optionC": "Nice",
    "optionD": "Pariz",
    "correctAnswer": "Pariz"
  },
  {
    "category": "Geografija",
    "difficulty": "medium",
    "question": "Koja rijeka protječe kroz Pariz?",
    "optionA": "Dunav",
    "optionB": "Tiber",
    "optionC": "Seine",
    "optionD": "Temza",
    "correctAnswer": "Seine"
  },
  {
    "category": "Geografija",
    "difficulty": "easy",
    "question": "Koji kontinent nema stalno stanovništvo?",
    "optionA": "Afrika",
    "optionB": "Antarktika",
    "optionC": "Australija",
    "optionD": "Europa",
    "correctAnswer": "Antarktika"
  },
  {
    "category": "Geografija",
    "difficulty": "easy",
    "question": "Koja država ima oblik čizme?",
    "optionA": "Italija",
    "optionB": "Grčka",
    "optionC": "Španjolska",
    "optionD": "Norveška",
    "correctAnswer": "Italija"
  },
  {
    "category": "Geografija",
    "difficulty": "easy",
    "question": "Koji je glavni grad Japana?",
    "optionA": "Kyoto",
    "optionB": "Osaka",
    "optionC": "Nagoya",
    "optionD": "Tokio",
    "correctAnswer": "Tokio"
  },
  {
    "category": "Geografija",
    "difficulty": "easy",
    "question": "Koje more dodiruje hrvatsku obalu?",
    "optionA": "Baltičko more",
    "optionB": "Sjeverno more",
    "optionC": "Jadransko more",
    "optionD": "Crno more",
    "correctAnswer": "Jadransko more"
  },
  {
    "category": "Geografija",
    "difficulty": "hard",
    "question": "Koja planina dijeli Europu i Aziju?",
    "optionA": "Karpati",
    "optionB": "Ural",
    "optionC": "Alpe",
    "optionD": "Pireneji",
    "correctAnswer": "Ural"
  },
  {
    "category": "Geografija",
    "difficulty": "medium",
    "question": "Koji je glavni grad Australije?",
    "optionA": "Canberra",
    "optionB": "Sydney",
    "optionC": "Melbourne",
    "optionD": "Perth",
    "correctAnswer": "Canberra"
  },
  {
    "category": "Geografija",
    "difficulty": "medium",
    "question": "Koja država ima najviše stanovnika među ponuđenima?",
    "optionA": "Kanada",
    "optionB": "Australija",
    "optionC": "Norveška",
    "optionD": "Indija",
    "correctAnswer": "Indija"
  },
  {
    "category": "Geografija",
    "difficulty": "medium",
    "question": "Koji kanal povezuje Sredozemno i Crveno more?",
    "optionA": "Kielski kanal",
    "optionB": "La Manche",
    "optionC": "Sueski kanal",
    "optionD": "Panamski kanal",
    "correctAnswer": "Sueski kanal"
  },
  {
    "category": "Geografija",
    "difficulty": "easy",
    "question": "Koji je glavni grad Bosne i Hercegovine?",
    "optionA": "Tuzla",
    "optionB": "Sarajevo",
    "optionC": "Mostar",
    "optionD": "Banja Luka",
    "correctAnswer": "Sarajevo"
  },
  {
    "category": "Računarstvo",
    "difficulty": "easy",
    "question": "Što znači CPU?",
    "optionA": "Central Processing Unit",
    "optionB": "Computer Power Unit",
    "optionC": "Central Program Utility",
    "optionD": "Core Power Unit",
    "correctAnswer": "Central Processing Unit"
  },
  {
    "category": "Računarstvo",
    "difficulty": "easy",
    "question": "Koji je programski jezik razvijen od Microsofta?",
    "optionA": "Java",
    "optionB": "Python",
    "optionC": "PHP",
    "optionD": "C#",
    "correctAnswer": "C#"
  },
  {
    "category": "Računarstvo",
    "difficulty": "easy",
    "question": "Što znači HTML?",
    "optionA": "Home Tool Markup Language",
    "optionB": "Hyper Tool Machine Language",
    "optionC": "Hyper Text Markup Language",
    "optionD": "High Text Machine Language",
    "correctAnswer": "Hyper Text Markup Language"
  },
  {
    "category": "Računarstvo",
    "difficulty": "easy",
    "question": "Koja tvrtka razvija Windows?",
    "optionA": "IBM",
    "optionB": "Microsoft",
    "optionC": "Apple",
    "optionD": "Google",
    "correctAnswer": "Microsoft"
  },
  {
    "category": "Računarstvo",
    "difficulty": "easy",
    "question": "Koja je ekstenzija TypeScript datoteka?",
    "optionA": ".ts",
    "optionB": ".js",
    "optionC": ".tsx",
    "optionD": ".jsx",
    "correctAnswer": ".ts"
  },
  {
    "category": "Računarstvo",
    "difficulty": "easy",
    "question": "Što je RAM?",
    "optionA": "Trajni disk",
    "optionB": "Grafička kartica",
    "optionC": "Mrežni kabel",
    "optionD": "Radna memorija",
    "correctAnswer": "Radna memorija"
  },
  {
    "category": "Računarstvo",
    "difficulty": "easy",
    "question": "Koji protokol se koristi za web stranice?",
    "optionA": "SMTP",
    "optionB": "USB",
    "optionC": "HTTP",
    "optionD": "FTP",
    "correctAnswer": "HTTP"
  },
  {
    "category": "Računarstvo",
    "difficulty": "medium",
    "question": "Što znači URL?",
    "optionA": "Unified Runtime Logic",
    "optionB": "Uniform Resource Locator",
    "optionC": "Universal Routing Link",
    "optionD": "User Registry List",
    "correctAnswer": "Uniform Resource Locator"
  },
  {
    "category": "Računarstvo",
    "difficulty": "medium",
    "question": "Koja baza je relacijska?",
    "optionA": "PostgreSQL",
    "optionB": "Redis",
    "optionC": "MongoDB",
    "optionD": "Neo4j",
    "correctAnswer": "PostgreSQL"
  },
  {
    "category": "Računarstvo",
    "difficulty": "easy",
    "question": "Što je Git?",
    "optionA": "Programski jezik",
    "optionB": "Operacijski sustav",
    "optionC": "Antivirus",
    "optionD": "Sustav za verzioniranje koda",
    "correctAnswer": "Sustav za verzioniranje koda"
  },
  {
    "category": "Računarstvo",
    "difficulty": "easy",
    "question": "Koja naredba instalira npm pakete?",
    "optionA": "npm build",
    "optionB": "npm delete",
    "optionC": "npm install",
    "optionD": "npm start",
    "correctAnswer": "npm install"
  },
  {
    "category": "Računarstvo",
    "difficulty": "medium",
    "question": "Što je API?",
    "optionA": "Tip procesora",
    "optionB": "Sučelje za komunikaciju programa",
    "optionC": "Vrsta monitora",
    "optionD": "Format slike",
    "correctAnswer": "Sučelje za komunikaciju programa"
  },
  {
    "category": "Računarstvo",
    "difficulty": "medium",
    "question": "Što je firewall?",
    "optionA": "Zaštita mrežnog prometa",
    "optionB": "Uređivač teksta",
    "optionC": "Tip baterije",
    "optionD": "Audio format",
    "correctAnswer": "Zaštita mrežnog prometa"
  },
  {
    "category": "Računarstvo",
    "difficulty": "medium",
    "question": "Koja oznaka u HTML-u stvara link?",
    "optionA": "p",
    "optionB": "div",
    "optionC": "img",
    "optionD": "a",
    "correctAnswer": "a"
  },
  {
    "category": "Računarstvo",
    "difficulty": "medium",
    "question": "Koji operator u JavaScriptu strogo uspoređuje vrijednost i tip?",
    "optionA": "=",
    "optionB": "!=",
    "optionC": "===",
    "optionD": "==",
    "correctAnswer": "==="
  },
  {
    "category": "Računarstvo",
    "difficulty": "easy",
    "question": "Što je bug u programu?",
    "optionA": "Brzi procesor",
    "optionB": "Greška u radu programa",
    "optionC": "Nova značajka",
    "optionD": "Sigurnosna kopija",
    "correctAnswer": "Greška u radu programa"
  },
  {
    "category": "Računarstvo",
    "difficulty": "easy",
    "question": "Koji format se često koristi za razmjenu podataka na webu?",
    "optionA": "JSON",
    "optionB": "MP3",
    "optionC": "PNG",
    "optionD": "EXE",
    "correctAnswer": "JSON"
  },
  {
    "category": "Računarstvo",
    "difficulty": "medium",
    "question": "Što je cloud computing?",
    "optionA": "Rad bez interneta",
    "optionB": "Popravak monitora",
    "optionC": "Vrsta tipkovnice",
    "optionD": "Korištenje računalnih resursa preko interneta",
    "correctAnswer": "Korištenje računalnih resursa preko interneta"
  },
  {
    "category": "Računarstvo",
    "difficulty": "medium",
    "question": "Što radi kompilator?",
    "optionA": "Mjeri temperaturu",
    "optionB": "Crta ikone",
    "optionC": "Prevodi kod u izvršni oblik",
    "optionD": "Briše bazu",
    "correctAnswer": "Prevodi kod u izvršni oblik"
  },
  {
    "category": "Računarstvo",
    "difficulty": "hard",
    "question": "Koji princip znači da korisnik ima samo nužna prava?",
    "optionA": "Pixel perfect",
    "optionB": "Least privilege",
    "optionC": "Overclocking",
    "optionD": "Hot swap",
    "correctAnswer": "Least privilege"
  },
  {
    "category": "Povijest",
    "difficulty": "easy",
    "question": "Koje godine je završio Drugi svjetski rat?",
    "optionA": "1945",
    "optionB": "1943",
    "optionC": "1944",
    "optionD": "1946",
    "correctAnswer": "1945"
  },
  {
    "category": "Povijest",
    "difficulty": "easy",
    "question": "Tko je bio prvi predsjednik SAD-a?",
    "optionA": "Abraham Lincoln",
    "optionB": "John Adams",
    "optionC": "Thomas Jefferson",
    "optionD": "George Washington",
    "correctAnswer": "George Washington"
  },
  {
    "category": "Povijest",
    "difficulty": "easy",
    "question": "U kojem gradu se nalazi Koloseum?",
    "optionA": "Pariz",
    "optionB": "Madrid",
    "optionC": "Rim",
    "optionD": "Atena",
    "correctAnswer": "Rim"
  },
  {
    "category": "Povijest",
    "difficulty": "easy",
    "question": "Tko je otkrio Ameriku 1492. godine?",
    "optionA": "Vasco da Gama",
    "optionB": "Kristofor Kolumbo",
    "optionC": "Marco Polo",
    "optionD": "Magellan",
    "correctAnswer": "Kristofor Kolumbo"
  },
  {
    "category": "Povijest",
    "difficulty": "medium",
    "question": "Koje je carstvo izgradilo Machu Picchu?",
    "optionA": "Inke",
    "optionB": "Rimsko",
    "optionC": "Egipatsko",
    "optionD": "Maje",
    "correctAnswer": "Inke"
  },
  {
    "category": "Povijest",
    "difficulty": "easy",
    "question": "Koja civilizacija je gradila piramide u Gizi?",
    "optionA": "Rimljani",
    "optionB": "Vikinzi",
    "optionC": "Perzijanci",
    "optionD": "Egipćani",
    "correctAnswer": "Egipćani"
  },
  {
    "category": "Povijest",
    "difficulty": "easy",
    "question": "Koji zid je pao 1989. godine?",
    "optionA": "Kineski zid",
    "optionB": "Zid plača",
    "optionC": "Berlinski zid",
    "optionD": "Hadrijanov zid",
    "correctAnswer": "Berlinski zid"
  },
  {
    "category": "Povijest",
    "difficulty": "medium",
    "question": "Tko je bio Napoleon Bonaparte?",
    "optionA": "Grčki filozof",
    "optionB": "Francuski vojskovođa i car",
    "optionC": "Engleski kralj",
    "optionD": "Ruski car",
    "correctAnswer": "Francuski vojskovođa i car"
  },
  {
    "category": "Povijest",
    "difficulty": "hard",
    "question": "U kojem stoljeću je počela industrijska revolucija u Britaniji?",
    "optionA": "18. stoljeću",
    "optionB": "15. stoljeću",
    "optionC": "16. stoljeću",
    "optionD": "20. stoljeću",
    "correctAnswer": "18. stoljeću"
  },
  {
    "category": "Povijest",
    "difficulty": "medium",
    "question": "Koji narod je osnovao Rim prema predaji?",
    "optionA": "Ahejci",
    "optionB": "Gali",
    "optionC": "Huni",
    "optionD": "Romul i Rem",
    "correctAnswer": "Romul i Rem"
  },
  {
    "category": "Povijest",
    "difficulty": "easy",
    "question": "Koji rat se vodio između Sjevera i Juga u SAD-u?",
    "optionA": "Krimski rat",
    "optionB": "Hladni rat",
    "optionC": "Američki građanski rat",
    "optionD": "Stogodišnji rat",
    "correctAnswer": "Američki građanski rat"
  },
  {
    "category": "Povijest",
    "difficulty": "easy",
    "question": "Kako se zvala kraljica Egipta poznata po savezu s Rimom?",
    "optionA": "Izida",
    "optionB": "Kleopatra",
    "optionC": "Nefertiti",
    "optionD": "Hatšepsut",
    "correctAnswer": "Kleopatra"
  },
  {
    "category": "Povijest",
    "difficulty": "easy",
    "question": "Koji je brod potonuo 1912. godine?",
    "optionA": "Titanic",
    "optionB": "Bismarck",
    "optionC": "Mayflower",
    "optionD": "Santa Maria",
    "correctAnswer": "Titanic"
  },
  {
    "category": "Povijest",
    "difficulty": "hard",
    "question": "Tko je napisao 95 teza?",
    "optionA": "Galileo Galilei",
    "optionB": "Isaac Newton",
    "optionC": "Charles Darwin",
    "optionD": "Martin Luther",
    "correctAnswer": "Martin Luther"
  },
  {
    "category": "Povijest",
    "difficulty": "medium",
    "question": "Koja država je 1917. imala revoluciju koja je dovela boljševike na vlast?",
    "optionA": "Njemačka",
    "optionB": "Italija",
    "optionC": "Rusija",
    "optionD": "Francuska",
    "correctAnswer": "Rusija"
  },
  {
    "category": "Povijest",
    "difficulty": "medium",
    "question": "Koja bolest je u srednjem vijeku poznata kao Crna smrt?",
    "optionA": "Malarija",
    "optionB": "Kuga",
    "optionC": "Kolera",
    "optionD": "Gripa",
    "correctAnswer": "Kuga"
  },
  {
    "category": "Povijest",
    "difficulty": "medium",
    "question": "U kojem gradu je ubijen Franjo Ferdinand 1914.?",
    "optionA": "Sarajevo",
    "optionB": "Beč",
    "optionC": "Berlin",
    "optionD": "Prag",
    "correctAnswer": "Sarajevo"
  },
  {
    "category": "Povijest",
    "difficulty": "medium",
    "question": "Koje je carstvo imalo sultane i prijestolnicu Istanbul?",
    "optionA": "Rimsko Carstvo",
    "optionB": "Bizantsko Carstvo",
    "optionC": "Mongolsko Carstvo",
    "optionD": "Osmansko Carstvo",
    "correctAnswer": "Osmansko Carstvo"
  },
  {
    "category": "Povijest",
    "difficulty": "easy",
    "question": "Tko je bio vođa nenasilnog pokreta za neovisnost Indije?",
    "optionA": "Winston Churchill",
    "optionB": "Jawaharlal Nehru",
    "optionC": "Mahatma Gandhi",
    "optionD": "Nelson Mandela",
    "correctAnswer": "Mahatma Gandhi"
  },
  {
    "category": "Povijest",
    "difficulty": "medium",
    "question": "Koji sukob se zvao Hladni rat?",
    "optionA": "Rat Engleske i Francuske",
    "optionB": "Napetost između SAD-a i SSSR-a",
    "optionC": "Rat Rimljana i Grka",
    "optionD": "Rat u Vijetnamu",
    "correctAnswer": "Napetost između SAD-a i SSSR-a"
  },
  {
    "category": "Znanost",
    "difficulty": "easy",
    "question": "Koji je kemijski simbol za vodu?",
    "optionA": "H2O",
    "optionB": "O2",
    "optionC": "CO2",
    "optionD": "HO",
    "correctAnswer": "H2O"
  },
  {
    "category": "Znanost",
    "difficulty": "easy",
    "question": "Koliko planeta ima Sunčev sustav?",
    "optionA": "7",
    "optionB": "9",
    "optionC": "10",
    "optionD": "8",
    "correctAnswer": "8"
  },
  {
    "category": "Znanost",
    "difficulty": "easy",
    "question": "Koji je najbliži planet Suncu?",
    "optionA": "Mars",
    "optionB": "Zemlja",
    "optionC": "Merkur",
    "optionD": "Venera",
    "correctAnswer": "Merkur"
  },
  {
    "category": "Znanost",
    "difficulty": "easy",
    "question": "Koji organ pumpa krv kroz tijelo?",
    "optionA": "Jetra",
    "optionB": "Srce",
    "optionC": "Mozak",
    "optionD": "Pluća",
    "correctAnswer": "Srce"
  },
  {
    "category": "Znanost",
    "difficulty": "easy",
    "question": "Koji plin biljke koriste u fotosintezi?",
    "optionA": "Ugljikov dioksid",
    "optionB": "Kisik",
    "optionC": "Dušik",
    "optionD": "Helij",
    "correctAnswer": "Ugljikov dioksid"
  },
  {
    "category": "Znanost",
    "difficulty": "easy",
    "question": "Koja sila nas drži na površini Zemlje?",
    "optionA": "Magnetizam",
    "optionB": "Trenje",
    "optionC": "Uzgon",
    "optionD": "Gravitacija",
    "correctAnswer": "Gravitacija"
  },
  {
    "category": "Znanost",
    "difficulty": "medium",
    "question": "Koja čestica ima negativan električni naboj?",
    "optionA": "Neutron",
    "optionB": "Foton",
    "optionC": "Elektron",
    "optionD": "Proton",
    "correctAnswer": "Elektron"
  },
  {
    "category": "Znanost",
    "difficulty": "medium",
    "question": "Koji je kemijski simbol za zlato?",
    "optionA": "Cu",
    "optionB": "Au",
    "optionC": "Ag",
    "optionD": "Fe",
    "correctAnswer": "Au"
  },
  {
    "category": "Znanost",
    "difficulty": "easy",
    "question": "Što mjeri termometar?",
    "optionA": "Temperaturu",
    "optionB": "Tlak",
    "optionC": "Brzinu",
    "optionD": "Masa",
    "correctAnswer": "Temperaturu"
  },
  {
    "category": "Znanost",
    "difficulty": "medium",
    "question": "Koji plin najviše čini Zemljinu atmosferu?",
    "optionA": "Kisik",
    "optionB": "Ugljikov dioksid",
    "optionC": "Argon",
    "optionD": "Dušik",
    "correctAnswer": "Dušik"
  },
  {
    "category": "Znanost",
    "difficulty": "easy",
    "question": "Koji znanstvenik je poznat po teoriji relativnosti?",
    "optionA": "Nikola Tesla",
    "optionB": "Galileo Galilei",
    "optionC": "Albert Einstein",
    "optionD": "Isaac Newton",
    "correctAnswer": "Albert Einstein"
  },
  {
    "category": "Znanost",
    "difficulty": "easy",
    "question": "Koji je prirodni satelit Zemlje?",
    "optionA": "Venera",
    "optionB": "Mjesec",
    "optionC": "Mars",
    "optionD": "Sunce",
    "correctAnswer": "Mjesec"
  },
  {
    "category": "Znanost",
    "difficulty": "easy",
    "question": "Koji proces pretvara tekućinu u plin?",
    "optionA": "Isparavanje",
    "optionB": "Kondenzacija",
    "optionC": "Taljenje",
    "optionD": "Smrzavanje",
    "correctAnswer": "Isparavanje"
  },
  {
    "category": "Znanost",
    "difficulty": "medium",
    "question": "Koji je pH neutralne vode približno?",
    "optionA": "1",
    "optionB": "5",
    "optionC": "14",
    "optionD": "7",
    "correctAnswer": "7"
  },
  {
    "category": "Znanost",
    "difficulty": "easy",
    "question": "Što proučava astronomija?",
    "optionA": "Društva",
    "optionB": "Jezike",
    "optionC": "Nebeska tijela i svemir",
    "optionD": "Biljke",
    "correctAnswer": "Nebeska tijela i svemir"
  },
  {
    "category": "Znanost",
    "difficulty": "hard",
    "question": "Koja je osnovna jedinica za silu?",
    "optionA": "Pascal",
    "optionB": "Njutn",
    "optionC": "Džul",
    "optionD": "Vat",
    "correctAnswer": "Njutn"
  },
  {
    "category": "Znanost",
    "difficulty": "medium",
    "question": "Koji metal je tekuć na sobnoj temperaturi?",
    "optionA": "Živa",
    "optionB": "Bakar",
    "optionC": "Aluminij",
    "optionD": "Cink",
    "correctAnswer": "Živa"
  },
  {
    "category": "Znanost",
    "difficulty": "hard",
    "question": "Koji instrument mjeri tlak zraka?",
    "optionA": "Higrometar",
    "optionB": "Seizmograf",
    "optionC": "Ampermetar",
    "optionD": "Barometar",
    "correctAnswer": "Barometar"
  },
  {
    "category": "Znanost",
    "difficulty": "medium",
    "question": "Što je DNK?",
    "optionA": "Mineral u kostima",
    "optionB": "Plin u atmosferi",
    "optionC": "Molekula koja nosi genetske upute",
    "optionD": "Vrsta proteina za disanje",
    "correctAnswer": "Molekula koja nosi genetske upute"
  },
  {
    "category": "Znanost",
    "difficulty": "medium",
    "question": "Koji je najlakši kemijski element?",
    "optionA": "Ugljik",
    "optionB": "Vodik",
    "optionC": "Helij",
    "optionD": "Kisik",
    "correctAnswer": "Vodik"
  },
  {
    "category": "Književnost",
    "difficulty": "easy",
    "question": "Tko je autor djela Hamlet?",
    "optionA": "William Shakespeare",
    "optionB": "Charles Dickens",
    "optionC": "Mark Twain",
    "optionD": "Lav Tolstoj",
    "correctAnswer": "William Shakespeare"
  },
  {
    "category": "Književnost",
    "difficulty": "easy",
    "question": "Koji roman počinje likom Harryja Pottera?",
    "optionA": "Hobit",
    "optionB": "Mali princ",
    "optionC": "1984",
    "optionD": "Harry Potter i Kamen mudraca",
    "correctAnswer": "Harry Potter i Kamen mudraca"
  },
  {
    "category": "Književnost",
    "difficulty": "medium",
    "question": "Tko je napisao Zločin i kazna?",
    "optionA": "Anton Čehov",
    "optionB": "Nikolaj Gogolj",
    "optionC": "Fjodor Dostojevski",
    "optionD": "Lav Tolstoj",
    "correctAnswer": "Fjodor Dostojevski"
  },
  {
    "category": "Književnost",
    "difficulty": "easy",
    "question": "Koji je autor Malog princa?",
    "optionA": "Albert Camus",
    "optionB": "Antoine de Saint-Exupéry",
    "optionC": "Jules Verne",
    "optionD": "Victor Hugo",
    "correctAnswer": "Antoine de Saint-Exupéry"
  },
  {
    "category": "Književnost",
    "difficulty": "easy",
    "question": "Koji hrvatski pisac je napisao Čudnovate zgode šegrta Hlapića?",
    "optionA": "Ivana Brlić-Mažuranić",
    "optionB": "August Šenoa",
    "optionC": "Miroslav Krleža",
    "optionD": "Marija Jurić Zagorka",
    "correctAnswer": "Ivana Brlić-Mažuranić"
  },
  {
    "category": "Književnost",
    "difficulty": "easy",
    "question": "Koji lik je poznat kao detektiv iz Baker Streeta?",
    "optionA": "Hercule Poirot",
    "optionB": "Don Quijote",
    "optionC": "Gulliver",
    "optionD": "Sherlock Holmes",
    "correctAnswer": "Sherlock Holmes"
  },
  {
    "category": "Književnost",
    "difficulty": "medium",
    "question": "Tko je autor Ilijade i Odiseje?",
    "optionA": "Vergilije",
    "optionB": "Ovidije",
    "optionC": "Homer",
    "optionD": "Sofoklo",
    "correctAnswer": "Homer"
  },
  {
    "category": "Književnost",
    "difficulty": "medium",
    "question": "Koji roman je napisao George Orwell?",
    "optionA": "Proces",
    "optionB": "1984",
    "optionC": "Dina",
    "optionD": "Lovac u žitu",
    "correctAnswer": "1984"
  },
  {
    "category": "Književnost",
    "difficulty": "easy",
    "question": "Kako se zove autor Gospodara prstenova?",
    "optionA": "J. R. R. Tolkien",
    "optionB": "C. S. Lewis",
    "optionC": "George R. R. Martin",
    "optionD": "Terry Pratchett",
    "correctAnswer": "J. R. R. Tolkien"
  },
  {
    "category": "Književnost",
    "difficulty": "medium",
    "question": "Koji je Cervantesov slavni junak?",
    "optionA": "Faust",
    "optionB": "Hamlet",
    "optionC": "Robinson Crusoe",
    "optionD": "Don Quijote",
    "correctAnswer": "Don Quijote"
  },
  {
    "category": "Književnost",
    "difficulty": "hard",
    "question": "Tko je napisao Božanstvenu komediju?",
    "optionA": "Boccaccio",
    "optionB": "Goethe",
    "optionC": "Dante Alighieri",
    "optionD": "Petrarca",
    "correctAnswer": "Dante Alighieri"
  },
  {
    "category": "Književnost",
    "difficulty": "medium",
    "question": "Koji je književni rod roman?",
    "optionA": "Esejistika",
    "optionB": "Epika",
    "optionC": "Lirika",
    "optionD": "Drama",
    "correctAnswer": "Epika"
  },
  {
    "category": "Književnost",
    "difficulty": "easy",
    "question": "Kako se zove kratka poučna priča sa životinjama?",
    "optionA": "Basna",
    "optionB": "Sonet",
    "optionC": "Ep",
    "optionD": "Tragedija",
    "correctAnswer": "Basna"
  },
  {
    "category": "Književnost",
    "difficulty": "medium",
    "question": "Tko je autor Ane Karenjine?",
    "optionA": "Fjodor Dostojevski",
    "optionB": "Ivan Turgenjev",
    "optionC": "Maksim Gorki",
    "optionD": "Lav Tolstoj",
    "correctAnswer": "Lav Tolstoj"
  },
  {
    "category": "Književnost",
    "difficulty": "medium",
    "question": "Koji je pisac stvorio Herculea Poirota?",
    "optionA": "Edgar Allan Poe",
    "optionB": "Mary Shelley",
    "optionC": "Agatha Christie",
    "optionD": "Arthur Conan Doyle",
    "correctAnswer": "Agatha Christie"
  },
  {
    "category": "Književnost",
    "difficulty": "medium",
    "question": "Tko je napisao Frankensteina?",
    "optionA": "Virginia Woolf",
    "optionB": "Mary Shelley",
    "optionC": "Jane Austen",
    "optionD": "Emily Brontë",
    "correctAnswer": "Mary Shelley"
  },
  {
    "category": "Književnost",
    "difficulty": "easy",
    "question": "Koji je Shakespeareov lik danski princ?",
    "optionA": "Hamlet",
    "optionB": "Macbeth",
    "optionC": "Othello",
    "optionD": "Romeo",
    "correctAnswer": "Hamlet"
  },
  {
    "category": "Književnost",
    "difficulty": "hard",
    "question": "Koji roman prati kapetana Ahaba?",
    "optionA": "Robinson Crusoe",
    "optionB": "Otoci s blagom",
    "optionC": "Starac i more",
    "optionD": "Moby-Dick",
    "correctAnswer": "Moby-Dick"
  },
  {
    "category": "Književnost",
    "difficulty": "hard",
    "question": "Koji hrvatski pisac je napisao U registraturi?",
    "optionA": "August Šenoa",
    "optionB": "Silvije Strahimir Kranjčević",
    "optionC": "Ante Kovačić",
    "optionD": "Ksaver Šandor Gjalski",
    "correctAnswer": "Ante Kovačić"
  },
  {
    "category": "Književnost",
    "difficulty": "medium",
    "question": "Kako se zove pjesma s 14 stihova?",
    "optionA": "Epigram",
    "optionB": "Sonet",
    "optionC": "Haiku",
    "optionD": "Balada",
    "correctAnswer": "Sonet"
  },
  {
    "category": "Umjetnost",
    "difficulty": "easy",
    "question": "Tko je naslikao Mona Lisu?",
    "optionA": "Leonardo da Vinci",
    "optionB": "Michelangelo",
    "optionC": "Pablo Picasso",
    "optionD": "Vincent van Gogh",
    "correctAnswer": "Leonardo da Vinci"
  },
  {
    "category": "Umjetnost",
    "difficulty": "easy",
    "question": "Koji umjetnik je naslikao Zvjezdanu noć?",
    "optionA": "Claude Monet",
    "optionB": "Salvador Dalí",
    "optionC": "Rembrandt",
    "optionD": "Vincent van Gogh",
    "correctAnswer": "Vincent van Gogh"
  },
  {
    "category": "Umjetnost",
    "difficulty": "medium",
    "question": "U kojem muzeju se nalazi Mona Lisa?",
    "optionA": "Uffizi",
    "optionB": "MoMA",
    "optionC": "Louvre",
    "optionD": "Prado",
    "correctAnswer": "Louvre"
  },
  {
    "category": "Umjetnost",
    "difficulty": "medium",
    "question": "Koja je skulptura Michelangelovo djelo?",
    "optionA": "Mala sirena",
    "optionB": "David",
    "optionC": "Mislilac",
    "optionD": "Kip slobode",
    "correctAnswer": "David"
  },
  {
    "category": "Umjetnost",
    "difficulty": "medium",
    "question": "Koji stil je povezan s Picassom?",
    "optionA": "Kubizam",
    "optionB": "Impresionizam",
    "optionC": "Barok",
    "optionD": "Gotika",
    "correctAnswer": "Kubizam"
  },
  {
    "category": "Umjetnost",
    "difficulty": "medium",
    "question": "Koji slikar je poznat po lopočima?",
    "optionA": "Edvard Munch",
    "optionB": "Rafael",
    "optionC": "Caravaggio",
    "optionD": "Claude Monet",
    "correctAnswer": "Claude Monet"
  },
  {
    "category": "Umjetnost",
    "difficulty": "easy",
    "question": "Kako se zove umjetnost oblikovanja prostora i zgrada?",
    "optionA": "Grafika",
    "optionB": "Keramika",
    "optionC": "Arhitektura",
    "optionD": "Kaligrafija",
    "correctAnswer": "Arhitektura"
  },
  {
    "category": "Umjetnost",
    "difficulty": "medium",
    "question": "Koji je poznati norveški slikar autor Krika?",
    "optionA": "Henri Matisse",
    "optionB": "Edvard Munch",
    "optionC": "Gustav Klimt",
    "optionD": "Paul Cézanne",
    "correctAnswer": "Edvard Munch"
  },
  {
    "category": "Umjetnost",
    "difficulty": "medium",
    "question": "Koje razdoblje dolazi nakon srednjeg vijeka i naglašava obnovu antike?",
    "optionA": "Renesansa",
    "optionB": "Barok",
    "optionC": "Romantizam",
    "optionD": "Realizam",
    "correctAnswer": "Renesansa"
  },
  {
    "category": "Umjetnost",
    "difficulty": "easy",
    "question": "Koji se materijal često koristi u kiparstvu?",
    "optionA": "Pamuk",
    "optionB": "Papir za pečenje",
    "optionC": "Guma",
    "optionD": "Mramor",
    "correctAnswer": "Mramor"
  },
  {
    "category": "Umjetnost",
    "difficulty": "medium",
    "question": "Tko je oslikao strop Sikstinske kapele?",
    "optionA": "Rafael",
    "optionB": "Donatello",
    "optionC": "Michelangelo",
    "optionD": "Leonardo da Vinci",
    "correctAnswer": "Michelangelo"
  },
  {
    "category": "Umjetnost",
    "difficulty": "easy",
    "question": "Koja je umjetnost pisanja lijepim slovima?",
    "optionA": "Grafiti",
    "optionB": "Kaligrafija",
    "optionC": "Origami",
    "optionD": "Mozaik",
    "correctAnswer": "Kaligrafija"
  },
  {
    "category": "Umjetnost",
    "difficulty": "medium",
    "question": "Koji umjetnik je poznat po topljenim satovima?",
    "optionA": "Salvador Dalí",
    "optionB": "Pablo Picasso",
    "optionC": "Andy Warhol",
    "optionD": "Rembrandt",
    "correctAnswer": "Salvador Dalí"
  },
  {
    "category": "Umjetnost",
    "difficulty": "medium",
    "question": "Koji je stil poznat po raskoši i dramatičnosti u 17. stoljeću?",
    "optionA": "Minimalizam",
    "optionB": "Kubizam",
    "optionC": "Pop-art",
    "optionD": "Barok",
    "correctAnswer": "Barok"
  },
  {
    "category": "Umjetnost",
    "difficulty": "hard",
    "question": "Tko je autor Djevojke s bisernom naušnicom?",
    "optionA": "Rubens",
    "optionB": "Van Gogh",
    "optionC": "Johannes Vermeer",
    "optionD": "Rembrandt",
    "correctAnswer": "Johannes Vermeer"
  },
  {
    "category": "Umjetnost",
    "difficulty": "medium",
    "question": "Koja tehnika koristi male komadiće kamena ili stakla?",
    "optionA": "Litografija",
    "optionB": "Mozaik",
    "optionC": "Akvarel",
    "optionD": "Freska",
    "correctAnswer": "Mozaik"
  },
  {
    "category": "Umjetnost",
    "difficulty": "hard",
    "question": "Koja je slika poznata po likovima u španjolskom građanskom ratu i autoru Picassu?",
    "optionA": "Guernica",
    "optionB": "Las Meninas",
    "optionC": "Noćna straža",
    "optionD": "Rađanje Venere",
    "correctAnswer": "Guernica"
  },
  {
    "category": "Umjetnost",
    "difficulty": "medium",
    "question": "Tko je poznat po Campbell's Soup Cans?",
    "optionA": "Roy Lichtenstein",
    "optionB": "Jackson Pollock",
    "optionC": "Mark Rothko",
    "optionD": "Andy Warhol",
    "correctAnswer": "Andy Warhol"
  },
  {
    "category": "Umjetnost",
    "difficulty": "easy",
    "question": "Kako se zove slikanje vodenim bojama?",
    "optionA": "Uljani pastel",
    "optionB": "Gravura",
    "optionC": "Akvarel",
    "optionD": "Freska",
    "correctAnswer": "Akvarel"
  },
  {
    "category": "Umjetnost",
    "difficulty": "hard",
    "question": "Koji je grad poznat po galeriji Uffizi?",
    "optionA": "Milano",
    "optionB": "Firenca",
    "optionC": "Venecija",
    "optionD": "Rim",
    "correctAnswer": "Firenca"
  },
  {
    "category": "Glazba",
    "difficulty": "easy",
    "question": "Koliko žica najčešće ima standardna gitara?",
    "optionA": "6",
    "optionB": "4",
    "optionC": "5",
    "optionD": "7",
    "correctAnswer": "6"
  },
  {
    "category": "Glazba",
    "difficulty": "easy",
    "question": "Koji instrument ima crne i bijele tipke?",
    "optionA": "Violina",
    "optionB": "Truba",
    "optionC": "Bubanj",
    "optionD": "Klavir",
    "correctAnswer": "Klavir"
  },
  {
    "category": "Glazba",
    "difficulty": "medium",
    "question": "Tko je skladao Odu radosti?",
    "optionA": "Johann Sebastian Bach",
    "optionB": "Franz Schubert",
    "optionC": "Ludwig van Beethoven",
    "optionD": "Wolfgang Amadeus Mozart",
    "correctAnswer": "Ludwig van Beethoven"
  },
  {
    "category": "Glazba",
    "difficulty": "easy",
    "question": "Koji glazbeni pravac je povezan s improvizacijom i swingom?",
    "optionA": "Klasika",
    "optionB": "Jazz",
    "optionC": "Metal",
    "optionD": "Techno",
    "correctAnswer": "Jazz"
  },
  {
    "category": "Glazba",
    "difficulty": "easy",
    "question": "Koji pjevač je poznat kao kralj popa?",
    "optionA": "Michael Jackson",
    "optionB": "Elvis Presley",
    "optionC": "Freddie Mercury",
    "optionD": "Prince",
    "correctAnswer": "Michael Jackson"
  },
  {
    "category": "Glazba",
    "difficulty": "easy",
    "question": "Koji bend je snimio pjesmu Bohemian Rhapsody?",
    "optionA": "The Beatles",
    "optionB": "ABBA",
    "optionC": "Nirvana",
    "optionD": "Queen",
    "correctAnswer": "Queen"
  },
  {
    "category": "Glazba",
    "difficulty": "medium",
    "question": "Kako se zove najviši ženski glas?",
    "optionA": "Tenor",
    "optionB": "Bas",
    "optionC": "Sopran",
    "optionD": "Alt",
    "correctAnswer": "Sopran"
  },
  {
    "category": "Glazba",
    "difficulty": "easy",
    "question": "Koji instrument svira bubnjar?",
    "optionA": "Saksofon",
    "optionB": "Bubnjeve",
    "optionC": "Flautu",
    "optionD": "Harfu",
    "correctAnswer": "Bubnjeve"
  },
  {
    "category": "Glazba",
    "difficulty": "medium",
    "question": "Koja oznaka znači tiho u glazbi?",
    "optionA": "piano",
    "optionB": "forte",
    "optionC": "allegro",
    "optionD": "presto",
    "correctAnswer": "piano"
  },
  {
    "category": "Glazba",
    "difficulty": "medium",
    "question": "Koliko nota ima standardna C-dur ljestvica do oktave bez ponavljanja C?",
    "optionA": "5",
    "optionB": "6",
    "optionC": "8",
    "optionD": "7",
    "correctAnswer": "7"
  },
  {
    "category": "Glazba",
    "difficulty": "medium",
    "question": "Koji skladatelj je napisao Četiri godišnja doba?",
    "optionA": "Mozart",
    "optionB": "Haydn",
    "optionC": "Antonio Vivaldi",
    "optionD": "Bach",
    "correctAnswer": "Antonio Vivaldi"
  },
  {
    "category": "Glazba",
    "difficulty": "medium",
    "question": "Koji žanr je nastao u Jamajci?",
    "optionA": "Country",
    "optionB": "Reggae",
    "optionC": "Flamenco",
    "optionD": "K-pop",
    "correctAnswer": "Reggae"
  },
  {
    "category": "Glazba",
    "difficulty": "easy",
    "question": "Koji instrument je tipičan za orkestar i ima gudalo?",
    "optionA": "Violina",
    "optionB": "Klavir",
    "optionC": "Truba",
    "optionD": "Timpani",
    "correctAnswer": "Violina"
  },
  {
    "category": "Glazba",
    "difficulty": "easy",
    "question": "Kako se zove brzina izvođenja glazbe?",
    "optionA": "Ritam",
    "optionB": "Melodija",
    "optionC": "Harmonija",
    "optionD": "Tempo",
    "correctAnswer": "Tempo"
  },
  {
    "category": "Glazba",
    "difficulty": "easy",
    "question": "Koja grupa je poznata po pjesmi Dancing Queen?",
    "optionA": "The Rolling Stones",
    "optionB": "U2",
    "optionC": "ABBA",
    "optionD": "Queen",
    "correctAnswer": "ABBA"
  },
  {
    "category": "Glazba",
    "difficulty": "easy",
    "question": "Što je refren?",
    "optionA": "Tišina između stavaka",
    "optionB": "Dio pjesme koji se ponavlja",
    "optionC": "Uvodni akord",
    "optionD": "Zadnja nota",
    "correctAnswer": "Dio pjesme koji se ponavlja"
  },
  {
    "category": "Glazba",
    "difficulty": "medium",
    "question": "Koji je glazbeni instrument limeni puhački?",
    "optionA": "Truba",
    "optionB": "Klarinet",
    "optionC": "Flauta",
    "optionD": "Violončelo",
    "correctAnswer": "Truba"
  },
  {
    "category": "Glazba",
    "difficulty": "medium",
    "question": "Koji je najniži muški glas?",
    "optionA": "Tenor",
    "optionB": "Bariton",
    "optionC": "Sopran",
    "optionD": "Bas",
    "correctAnswer": "Bas"
  },
  {
    "category": "Glazba",
    "difficulty": "easy",
    "question": "Koji žanr često koristi DJ-eve i elektroničke beatove?",
    "optionA": "Blues",
    "optionB": "Koral",
    "optionC": "Elektronička glazba",
    "optionD": "Opera",
    "correctAnswer": "Elektronička glazba"
  },
  {
    "category": "Glazba",
    "difficulty": "medium",
    "question": "Tko je poznat po skladbi Mala noćna muzika?",
    "optionA": "Vivaldi",
    "optionB": "Mozart",
    "optionC": "Beethoven",
    "optionD": "Chopin",
    "correctAnswer": "Mozart"
  },
  {
    "category": "Videoigre",
    "difficulty": "easy",
    "question": "Koji lik je maskota Nintenda?",
    "optionA": "Mario",
    "optionB": "Sonic",
    "optionC": "Crash",
    "optionD": "Master Chief",
    "correctAnswer": "Mario"
  },
  {
    "category": "Videoigre",
    "difficulty": "easy",
    "question": "U kojoj igri se gradi od blokova u otvorenom svijetu?",
    "optionA": "Fortnite",
    "optionB": "FIFA",
    "optionC": "Tetris",
    "optionD": "Minecraft",
    "correctAnswer": "Minecraft"
  },
  {
    "category": "Videoigre",
    "difficulty": "medium",
    "question": "Koja igra ima mapu Summoner's Rift?",
    "optionA": "Valorant",
    "optionB": "Overwatch",
    "optionC": "League of Legends",
    "optionD": "Dota 2",
    "correctAnswer": "League of Legends"
  },
  {
    "category": "Videoigre",
    "difficulty": "medium",
    "question": "Koji studio je razvio The Witcher 3?",
    "optionA": "Rockstar Games",
    "optionB": "CD Projekt Red",
    "optionC": "Bethesda",
    "optionD": "Ubisoft",
    "correctAnswer": "CD Projekt Red"
  },
  {
    "category": "Videoigre",
    "difficulty": "easy",
    "question": "Koja igra ima mod Battle Royale i gradnju?",
    "optionA": "Fortnite",
    "optionB": "Apex Legends",
    "optionC": "PUBG",
    "optionD": "Rocket League",
    "correctAnswer": "Fortnite"
  },
  {
    "category": "Videoigre",
    "difficulty": "medium",
    "question": "Koji je glavni lik serijala The Legend of Zelda?",
    "optionA": "Zelda",
    "optionB": "Ganondorf",
    "optionC": "Kirby",
    "optionD": "Link",
    "correctAnswer": "Link"
  },
  {
    "category": "Videoigre",
    "difficulty": "easy",
    "question": "Koja igra koristi pokemone za borbu i skupljanje?",
    "optionA": "Animal Crossing",
    "optionB": "Stardew Valley",
    "optionC": "Pokémon",
    "optionD": "Digimon World",
    "correctAnswer": "Pokémon"
  },
  {
    "category": "Videoigre",
    "difficulty": "medium",
    "question": "Koji FPS je razvila tvrtka Riot Games?",
    "optionA": "Halo",
    "optionB": "Valorant",
    "optionC": "Counter-Strike 2",
    "optionD": "Call of Duty",
    "correctAnswer": "Valorant"
  },
  {
    "category": "Videoigre",
    "difficulty": "easy",
    "question": "Koja igra ima kockice Tetrimino?",
    "optionA": "Tetris",
    "optionB": "Pac-Man",
    "optionC": "Pong",
    "optionD": "Snake",
    "correctAnswer": "Tetris"
  },
  {
    "category": "Videoigre",
    "difficulty": "medium",
    "question": "Koji serijal je poznat po gradu Los Santos?",
    "optionA": "Need for Speed",
    "optionB": "Watch Dogs",
    "optionC": "Mafia",
    "optionD": "Grand Theft Auto",
    "correctAnswer": "Grand Theft Auto"
  },
  {
    "category": "Videoigre",
    "difficulty": "easy",
    "question": "Koji žanr je Minecraft najbliže?",
    "optionA": "Fighting",
    "optionB": "Rhythm",
    "optionC": "Sandbox",
    "optionD": "Racing",
    "correctAnswer": "Sandbox"
  },
  {
    "category": "Videoigre",
    "difficulty": "easy",
    "question": "Koja igra ima likove Steve i Alex?",
    "optionA": "Among Us",
    "optionB": "Minecraft",
    "optionC": "Roblox",
    "optionD": "Terraria",
    "correctAnswer": "Minecraft"
  },
  {
    "category": "Videoigre",
    "difficulty": "easy",
    "question": "Koji je cilj u Among Us kao impostor?",
    "optionA": "Eliminirati posadu bez otkrivanja",
    "optionB": "Sakupiti sve novčiće",
    "optionC": "Pobijediti utrku",
    "optionD": "Obraniti bazu od zombija",
    "correctAnswer": "Eliminirati posadu bez otkrivanja"
  },
  {
    "category": "Videoigre",
    "difficulty": "easy",
    "question": "Koja kompanija proizvodi konzolu PlayStation?",
    "optionA": "Microsoft",
    "optionB": "Nintendo",
    "optionC": "Sega",
    "optionD": "Sony",
    "correctAnswer": "Sony"
  },
  {
    "category": "Videoigre",
    "difficulty": "easy",
    "question": "Koja kompanija proizvodi Xbox?",
    "optionA": "Nintendo",
    "optionB": "Valve",
    "optionC": "Microsoft",
    "optionD": "Sony",
    "correctAnswer": "Microsoft"
  },
  {
    "category": "Videoigre",
    "difficulty": "medium",
    "question": "Koji serijal ima lik Kratosa?",
    "optionA": "Uncharted",
    "optionB": "God of War",
    "optionC": "Assassin's Creed",
    "optionD": "Dark Souls",
    "correctAnswer": "God of War"
  },
  {
    "category": "Videoigre",
    "difficulty": "easy",
    "question": "Koja igra ima nogomet s automobilima?",
    "optionA": "Rocket League",
    "optionB": "Forza Horizon",
    "optionC": "Gran Turismo",
    "optionD": "Trackmania",
    "correctAnswer": "Rocket League"
  },
  {
    "category": "Videoigre",
    "difficulty": "medium",
    "question": "Koji studio je poznat po serijalu Grand Theft Auto?",
    "optionA": "EA Sports",
    "optionB": "Valve",
    "optionC": "Epic Games",
    "optionD": "Rockstar Games",
    "correctAnswer": "Rockstar Games"
  },
  {
    "category": "Videoigre",
    "difficulty": "easy",
    "question": "Koji je poznati digitalni dućan tvrtke Valve?",
    "optionA": "Battle.net",
    "optionB": "GOG",
    "optionC": "Steam",
    "optionD": "Origin",
    "correctAnswer": "Steam"
  },
  {
    "category": "Videoigre",
    "difficulty": "hard",
    "question": "Koji žanr označava MMORPG?",
    "optionA": "Igra utrkivanja",
    "optionB": "Masivna online igra uloga",
    "optionC": "Sportska simulacija",
    "optionD": "Puzzle igra",
    "correctAnswer": "Masivna online igra uloga"
  },
  {
    "category": "Trendovi i aktualnosti",
    "difficulty": "easy",
    "question": "Koja platforma je poznata po kratkim vertikalnim videozapisima?",
    "optionA": "TikTok",
    "optionB": "LinkedIn",
    "optionC": "Wikipedia",
    "optionD": "Dropbox",
    "correctAnswer": "TikTok"
  },
  {
    "category": "Trendovi i aktualnosti",
    "difficulty": "easy",
    "question": "Što označava hashtag na društvenim mrežama?",
    "optionA": "Lozinku",
    "optionB": "Vrstu slike",
    "optionC": "Mrežni kabel",
    "optionD": "Oznaku teme",
    "correctAnswer": "Oznaku teme"
  },
  {
    "category": "Trendovi i aktualnosti",
    "difficulty": "easy",
    "question": "Koji format videa je popularan na Instagramu za kratke klipove?",
    "optionA": "Slides",
    "optionB": "Boards",
    "optionC": "Reels",
    "optionD": "Sheets",
    "correctAnswer": "Reels"
  },
  {
    "category": "Trendovi i aktualnosti",
    "difficulty": "easy",
    "question": "Što znači viralno na internetu?",
    "optionA": "Sadržaj nema zvuk",
    "optionB": "Sadržaj se brzo širi",
    "optionC": "Sadržaj je tajan",
    "optionD": "Sadržaj je obrisan",
    "correctAnswer": "Sadržaj se brzo širi"
  },
  {
    "category": "Trendovi i aktualnosti",
    "difficulty": "easy",
    "question": "Koji pojam se koristi za internet meme koji se brzo širi?",
    "optionA": "Meme",
    "optionB": "Patch",
    "optionC": "Plugin",
    "optionD": "Kernel",
    "correctAnswer": "Meme"
  },
  {
    "category": "Trendovi i aktualnosti",
    "difficulty": "easy",
    "question": "Što je influencer?",
    "optionA": "Mrežni server",
    "optionB": "Vrsta algoritma",
    "optionC": "Tajni račun",
    "optionD": "Osoba koja utječe na publiku online",
    "correctAnswer": "Osoba koja utječe na publiku online"
  },
  {
    "category": "Trendovi i aktualnosti",
    "difficulty": "easy",
    "question": "Koja tehnologija se često povezuje s generiranjem slika i teksta?",
    "optionA": "Telegraf",
    "optionB": "DVD",
    "optionC": "Umjetna inteligencija",
    "optionD": "Parni stroj",
    "correctAnswer": "Umjetna inteligencija"
  },
  {
    "category": "Trendovi i aktualnosti",
    "difficulty": "easy",
    "question": "Što je livestream?",
    "optionA": "Offline igra",
    "optionB": "Prijenos uživo preko interneta",
    "optionC": "Snimka na CD-u",
    "optionD": "Papirnati časopis",
    "correctAnswer": "Prijenos uživo preko interneta"
  },
  {
    "category": "Trendovi i aktualnosti",
    "difficulty": "easy",
    "question": "Koji je izraz za kratkotrajni trend na društvenim mrežama?",
    "optionA": "Trend",
    "optionB": "Backup",
    "optionC": "Blueprint",
    "optionD": "Firewall",
    "correctAnswer": "Trend"
  },
  {
    "category": "Trendovi i aktualnosti",
    "difficulty": "medium",
    "question": "Što znači FOMO?",
    "optionA": "Format za slike",
    "optionB": "Vrsta softvera",
    "optionC": "Sportska liga",
    "optionD": "Strah od propuštanja",
    "correctAnswer": "Strah od propuštanja"
  },
  {
    "category": "Trendovi i aktualnosti",
    "difficulty": "easy",
    "question": "Što je podcast?",
    "optionA": "Uređaj za punjenje",
    "optionB": "Sportska oprema",
    "optionC": "Audio ili video emisija dostupna online",
    "optionD": "Vrsta lozinke",
    "correctAnswer": "Audio ili video emisija dostupna online"
  },
  {
    "category": "Trendovi i aktualnosti",
    "difficulty": "easy",
    "question": "Koji oblik kupovine se često promovira preko influencera?",
    "optionA": "Analogni katalog",
    "optionB": "Online kupovina",
    "optionC": "Kupovina poštanskim golubom",
    "optionD": "Trgovina na burzi elektrona",
    "correctAnswer": "Online kupovina"
  },
  {
    "category": "Trendovi i aktualnosti",
    "difficulty": "medium",
    "question": "Što znači binge-watch?",
    "optionA": "Gledati više epizoda zaredom",
    "optionB": "Čitati novine naglas",
    "optionC": "Brisati aplikacije",
    "optionD": "Puniti bateriju",
    "correctAnswer": "Gledati više epizoda zaredom"
  },
  {
    "category": "Trendovi i aktualnosti",
    "difficulty": "medium",
    "question": "Koja oznaka se često koristi za sponzorirani sadržaj?",
    "optionA": "#off",
    "optionB": "#bug",
    "optionC": "#zip",
    "optionD": "#ad",
    "correctAnswer": "#ad"
  },
  {
    "category": "Trendovi i aktualnosti",
    "difficulty": "medium",
    "question": "Što je algoritamski feed?",
    "optionA": "Vrsta miša",
    "optionB": "Manualni kabelski kanal",
    "optionC": "Prikaz sadržaja prema procjeni sustava",
    "optionD": "Popis spremljen na papiru",
    "correctAnswer": "Prikaz sadržaja prema procjeni sustava"
  },
  {
    "category": "Trendovi i aktualnosti",
    "difficulty": "easy",
    "question": "Koji pojam opisuje stalno osvježavanje feeda pomicanjem prsta?",
    "optionA": "Kodiranje",
    "optionB": "Scrollanje",
    "optionC": "Kompajliranje",
    "optionD": "Renderiranje",
    "correctAnswer": "Scrollanje"
  },
  {
    "category": "Trendovi i aktualnosti",
    "difficulty": "easy",
    "question": "Što je filter na društvenim mrežama?",
    "optionA": "Efekt koji mijenja izgled slike ili videa",
    "optionB": "Bankovni račun",
    "optionC": "Tip procesora",
    "optionD": "Vrsta mrežnog porta",
    "correctAnswer": "Efekt koji mijenja izgled slike ili videa"
  },
  {
    "category": "Trendovi i aktualnosti",
    "difficulty": "easy",
    "question": "Koja je česta mjera popularnosti objave?",
    "optionA": "Broj utičnica",
    "optionB": "Broj tipki na tipkovnici",
    "optionC": "Količina memorije monitora",
    "optionD": "Broj lajkova",
    "correctAnswer": "Broj lajkova"
  },
  {
    "category": "Trendovi i aktualnosti",
    "difficulty": "easy",
    "question": "Što znači DM?",
    "optionA": "Dnevni menu",
    "optionB": "Duboka memorija",
    "optionC": "Privatna poruka",
    "optionD": "Digitalni monitor",
    "correctAnswer": "Privatna poruka"
  },
  {
    "category": "Trendovi i aktualnosti",
    "difficulty": "easy",
    "question": "Što je challenge na društvenim mrežama?",
    "optionA": "Tip kamere",
    "optionB": "Izazov koji korisnici ponavljaju",
    "optionC": "Službeni porez",
    "optionD": "Format datoteke",
    "correctAnswer": "Izazov koji korisnici ponavljaju"
  },
  {
    "category": "Poslovanje i brendovi",
    "difficulty": "easy",
    "question": "Koja kompanija proizvodi iPhone?",
    "optionA": "Apple",
    "optionB": "Samsung",
    "optionC": "Google",
    "optionD": "Sony",
    "correctAnswer": "Apple"
  },
  {
    "category": "Poslovanje i brendovi",
    "difficulty": "easy",
    "question": "Koji brend je poznat po sloganu Just Do It?",
    "optionA": "Adidas",
    "optionB": "Puma",
    "optionC": "Reebok",
    "optionD": "Nike",
    "correctAnswer": "Nike"
  },
  {
    "category": "Poslovanje i brendovi",
    "difficulty": "medium",
    "question": "Koja kompanija je vlasnik brenda YouTube?",
    "optionA": "Microsoft",
    "optionB": "Amazon",
    "optionC": "Google",
    "optionD": "Meta",
    "correctAnswer": "Google"
  },
  {
    "category": "Poslovanje i brendovi",
    "difficulty": "easy",
    "question": "Što je logo?",
    "optionA": "Računovodstvena knjiga",
    "optionB": "Vizualni znak brenda",
    "optionC": "Vrsta poreza",
    "optionD": "Pravni ugovor",
    "correctAnswer": "Vizualni znak brenda"
  },
  {
    "category": "Poslovanje i brendovi",
    "difficulty": "hard",
    "question": "Što znači ROI u poslovanju?",
    "optionA": "Povrat ulaganja",
    "optionB": "Raspored osobnih informacija",
    "optionC": "Računalni izlaz",
    "optionD": "Regionalni indeks obuke",
    "correctAnswer": "Povrat ulaganja"
  },
  {
    "category": "Poslovanje i brendovi",
    "difficulty": "easy",
    "question": "Koji brend je poznat po gaziranom piću crvene etikete?",
    "optionA": "Pepsi",
    "optionB": "Fanta",
    "optionC": "Sprite",
    "optionD": "Coca-Cola",
    "correctAnswer": "Coca-Cola"
  },
  {
    "category": "Poslovanje i brendovi",
    "difficulty": "easy",
    "question": "Koja tvrtka je poznata po Windows i Office proizvodima?",
    "optionA": "Oracle",
    "optionB": "Spotify",
    "optionC": "Microsoft",
    "optionD": "Apple",
    "correctAnswer": "Microsoft"
  },
  {
    "category": "Poslovanje i brendovi",
    "difficulty": "medium",
    "question": "Što je startup?",
    "optionA": "Zatvorena trgovina",
    "optionB": "Novo poduzeće s potencijalom rasta",
    "optionC": "Stara tvornica",
    "optionD": "Vrsta poreza",
    "correctAnswer": "Novo poduzeće s potencijalom rasta"
  },
  {
    "category": "Poslovanje i brendovi",
    "difficulty": "easy",
    "question": "Što je tržište?",
    "optionA": "Mjesto ili sustav razmjene robe i usluga",
    "optionB": "Vrsta računala",
    "optionC": "Glazbeni instrument",
    "optionD": "Lijek",
    "correctAnswer": "Mjesto ili sustav razmjene robe i usluga"
  },
  {
    "category": "Poslovanje i brendovi",
    "difficulty": "easy",
    "question": "Što je brend?",
    "optionA": "Skladišni račun",
    "optionB": "Vrsta transporta",
    "optionC": "Knjigovodstvena greška",
    "optionD": "Prepoznatljiv identitet proizvoda ili tvrtke",
    "correctAnswer": "Prepoznatljiv identitet proizvoda ili tvrtke"
  },
  {
    "category": "Poslovanje i brendovi",
    "difficulty": "medium",
    "question": "Koja kompanija je poznata po online trgovini i AWS-u?",
    "optionA": "Spotify",
    "optionB": "Intel",
    "optionC": "Amazon",
    "optionD": "Netflix",
    "correctAnswer": "Amazon"
  },
  {
    "category": "Poslovanje i brendovi",
    "difficulty": "easy",
    "question": "Što je marketing?",
    "optionA": "Pisanje zakona",
    "optionB": "Promocija i pozicioniranje proizvoda",
    "optionC": "Popravak strojeva",
    "optionD": "Mjerenje krvnog tlaka",
    "correctAnswer": "Promocija i pozicioniranje proizvoda"
  },
  {
    "category": "Poslovanje i brendovi",
    "difficulty": "medium",
    "question": "Koji pojam opisuje prodaju drugim tvrtkama?",
    "optionA": "B2B",
    "optionB": "B2C",
    "optionC": "C2C",
    "optionD": "P2P",
    "correctAnswer": "B2B"
  },
  {
    "category": "Poslovanje i brendovi",
    "difficulty": "medium",
    "question": "Koji pojam opisuje prodaju krajnjim kupcima?",
    "optionA": "B2B",
    "optionB": "API",
    "optionC": "CPU",
    "optionD": "B2C",
    "correctAnswer": "B2C"
  },
  {
    "category": "Poslovanje i brendovi",
    "difficulty": "hard",
    "question": "Što je franšiza u poslovanju?",
    "optionA": "Tip grafičke kartice",
    "optionB": "Sportska kazna",
    "optionC": "Model korištenja tuđeg brenda uz pravila",
    "optionD": "Vrsta baterije",
    "correctAnswer": "Model korištenja tuđeg brenda uz pravila"
  },
  {
    "category": "Poslovanje i brendovi",
    "difficulty": "easy",
    "question": "Koja tvrtka proizvodi Galaxy telefone?",
    "optionA": "Nokia",
    "optionB": "Samsung",
    "optionC": "Apple",
    "optionD": "Huawei",
    "correctAnswer": "Samsung"
  },
  {
    "category": "Poslovanje i brendovi",
    "difficulty": "easy",
    "question": "Što je profit?",
    "optionA": "Dobit nakon troškova",
    "optionB": "Ukupan broj zaposlenika",
    "optionC": "Naziv proizvoda",
    "optionD": "Vrsta kredita",
    "correctAnswer": "Dobit nakon troškova"
  },
  {
    "category": "Poslovanje i brendovi",
    "difficulty": "easy",
    "question": "Što je cilj oglašavanja?",
    "optionA": "Smanjiti vidljivost",
    "optionB": "Sakriti proizvod",
    "optionC": "Obrisati brend",
    "optionD": "Privući pažnju i potaknuti kupnju",
    "correctAnswer": "Privući pažnju i potaknuti kupnju"
  },
  {
    "category": "Poslovanje i brendovi",
    "difficulty": "easy",
    "question": "Koja kompanija je poznata po platformi Facebook?",
    "optionA": "Apple",
    "optionB": "Netflix",
    "optionC": "Meta",
    "optionD": "Google",
    "correctAnswer": "Meta"
  },
  {
    "category": "Poslovanje i brendovi",
    "difficulty": "easy",
    "question": "Što je e-commerce?",
    "optionA": "Analogni radio",
    "optionB": "Elektronička trgovina",
    "optionC": "Ručni rad u tvornici",
    "optionD": "Vrsta sporta",
    "correctAnswer": "Elektronička trgovina"
  },
  {
    "category": "Životinje",
    "difficulty": "easy",
    "question": "Koja je najveća kopnena životinja?",
    "optionA": "Afrički slon",
    "optionB": "Nosorog",
    "optionC": "Žirafa",
    "optionD": "Hipopotamus",
    "correctAnswer": "Afrički slon"
  },
  {
    "category": "Životinje",
    "difficulty": "easy",
    "question": "Koja životinja je poznata po crno-bijelim prugama?",
    "optionA": "Tigar",
    "optionB": "Panda",
    "optionC": "Leopard",
    "optionD": "Zebra",
    "correctAnswer": "Zebra"
  },
  {
    "category": "Životinje",
    "difficulty": "easy",
    "question": "Koja ptica ne može letjeti, a živi na Antarktici?",
    "optionA": "Galeb",
    "optionB": "Sova",
    "optionC": "Pingvin",
    "optionD": "Orao",
    "correctAnswer": "Pingvin"
  },
  {
    "category": "Životinje",
    "difficulty": "hard",
    "question": "Koji sisavac polaže jaja?",
    "optionA": "Medvjed",
    "optionB": "Čudnovati kljunaš",
    "optionC": "Klokan",
    "optionD": "Delfin",
    "correctAnswer": "Čudnovati kljunaš"
  },
  {
    "category": "Životinje",
    "difficulty": "easy",
    "question": "Koja životinja je najbrža na kopnu?",
    "optionA": "Gepard",
    "optionB": "Lav",
    "optionC": "Antilopa",
    "optionD": "Konj",
    "correctAnswer": "Gepard"
  },
  {
    "category": "Životinje",
    "difficulty": "easy",
    "question": "Koja životinja ima najduži vrat?",
    "optionA": "Deva",
    "optionB": "Slon",
    "optionC": "Noj",
    "optionD": "Žirafa",
    "correctAnswer": "Žirafa"
  },
  {
    "category": "Životinje",
    "difficulty": "easy",
    "question": "Kako se zove mladunče psa?",
    "optionA": "Tele",
    "optionB": "Janje",
    "optionC": "Štene",
    "optionD": "Mačić",
    "correctAnswer": "Štene"
  },
  {
    "category": "Životinje",
    "difficulty": "easy",
    "question": "Koja životinja proizvodi med?",
    "optionA": "Komarac",
    "optionB": "Pčela",
    "optionC": "Mrav",
    "optionD": "Leptir",
    "correctAnswer": "Pčela"
  },
  {
    "category": "Životinje",
    "difficulty": "easy",
    "question": "Koja morska životinja ima osam krakova?",
    "optionA": "Hobotnica",
    "optionB": "Meduza",
    "optionC": "Rak",
    "optionD": "Dupin",
    "correctAnswer": "Hobotnica"
  },
  {
    "category": "Životinje",
    "difficulty": "medium",
    "question": "Koji je najveći sisavac na svijetu?",
    "optionA": "Slon",
    "optionB": "Kit ubojica",
    "optionC": "Morski pas",
    "optionD": "Plavi kit",
    "correctAnswer": "Plavi kit"
  },
  {
    "category": "Životinje",
    "difficulty": "easy",
    "question": "Koja životinja mijenja boju kože radi kamuflaže?",
    "optionA": "Žaba",
    "optionB": "Vjeverica",
    "optionC": "Kameleon",
    "optionD": "Kornjača",
    "correctAnswer": "Kameleon"
  },
  {
    "category": "Životinje",
    "difficulty": "easy",
    "question": "Koji kukac prolazi metamorfozu iz gusjenice?",
    "optionA": "Skakavac",
    "optionB": "Leptir",
    "optionC": "Pčela",
    "optionD": "Mrav",
    "correctAnswer": "Leptir"
  },
  {
    "category": "Životinje",
    "difficulty": "medium",
    "question": "Koja životinja je poznata po torbi za mladunce?",
    "optionA": "Klokan",
    "optionB": "Koala",
    "optionC": "Vombat",
    "optionD": "Tigar",
    "correctAnswer": "Klokan"
  },
  {
    "category": "Životinje",
    "difficulty": "medium",
    "question": "Koji sisavac koristi eholokaciju?",
    "optionA": "Mačka",
    "optionB": "Konj",
    "optionC": "Vuk",
    "optionD": "Šišmiš",
    "correctAnswer": "Šišmiš"
  },
  {
    "category": "Životinje",
    "difficulty": "easy",
    "question": "Koja životinja je kralj džungle u popularnom izrazu?",
    "optionA": "Slon",
    "optionB": "Gorila",
    "optionC": "Lav",
    "optionD": "Tigar",
    "correctAnswer": "Lav"
  },
  {
    "category": "Životinje",
    "difficulty": "easy",
    "question": "Koji reptil nosi oklop?",
    "optionA": "Krokodil",
    "optionB": "Kornjača",
    "optionC": "Gušter",
    "optionD": "Zmija",
    "correctAnswer": "Kornjača"
  },
  {
    "category": "Životinje",
    "difficulty": "easy",
    "question": "Koja ptica je simbol mudrosti?",
    "optionA": "Sova",
    "optionB": "Vrana",
    "optionC": "Golub",
    "optionD": "Patka",
    "correctAnswer": "Sova"
  },
  {
    "category": "Životinje",
    "difficulty": "easy",
    "question": "Koji životinjski razred ima škrge i peraje?",
    "optionA": "Gmazovi",
    "optionB": "Ptice",
    "optionC": "Sisavci",
    "optionD": "Ribe",
    "correctAnswer": "Ribe"
  },
  {
    "category": "Životinje",
    "difficulty": "easy",
    "question": "Koja životinja živi u čoporu i zavija?",
    "optionA": "Medvjed",
    "optionB": "Jazavac",
    "optionC": "Vuk",
    "optionD": "Lisica",
    "correctAnswer": "Vuk"
  },
  {
    "category": "Životinje",
    "difficulty": "medium",
    "question": "Koji kukac je poznat po organiziranim kolonijama i matici?",
    "optionA": "Buba mara",
    "optionB": "Mrav",
    "optionC": "Muha",
    "optionD": "Skakavac",
    "correctAnswer": "Mrav"
  },
  {
    "category": "Ljudsko tijelo i zdravlje",
    "difficulty": "easy",
    "question": "Koji organ pumpa krv?",
    "optionA": "Srce",
    "optionB": "Jetra",
    "optionC": "Mozak",
    "optionD": "Želudac",
    "correctAnswer": "Srce"
  },
  {
    "category": "Ljudsko tijelo i zdravlje",
    "difficulty": "easy",
    "question": "Koji organ služi za disanje?",
    "optionA": "Bubrezi",
    "optionB": "Slezena",
    "optionC": "Gušterača",
    "optionD": "Pluća",
    "correctAnswer": "Pluća"
  },
  {
    "category": "Ljudsko tijelo i zdravlje",
    "difficulty": "medium",
    "question": "Koliko odrasla osoba obično ima zuba?",
    "optionA": "24",
    "optionB": "28",
    "optionC": "32",
    "optionD": "20",
    "correctAnswer": "32"
  },
  {
    "category": "Ljudsko tijelo i zdravlje",
    "difficulty": "easy",
    "question": "Koja kost štiti mozak?",
    "optionA": "Lopatica",
    "optionB": "Lubanja",
    "optionC": "Rebro",
    "optionD": "Bedrena kost",
    "correctAnswer": "Lubanja"
  },
  {
    "category": "Ljudsko tijelo i zdravlje",
    "difficulty": "medium",
    "question": "Koji organ filtrira krv i stvara urin?",
    "optionA": "Bubrezi",
    "optionB": "Pluća",
    "optionC": "Srce",
    "optionD": "Želudac",
    "correctAnswer": "Bubrezi"
  },
  {
    "category": "Ljudsko tijelo i zdravlje",
    "difficulty": "medium",
    "question": "Koji je najveći organ ljudskog tijela?",
    "optionA": "Jetra",
    "optionB": "Srce",
    "optionC": "Mozak",
    "optionD": "Koža",
    "correctAnswer": "Koža"
  },
  {
    "category": "Ljudsko tijelo i zdravlje",
    "difficulty": "hard",
    "question": "Koji dio oka kontrolira količinu svjetlosti kroz zjenicu?",
    "optionA": "Mrežnica",
    "optionB": "Leća",
    "optionC": "Šarenica",
    "optionD": "Rožnica",
    "correctAnswer": "Šarenica"
  },
  {
    "category": "Ljudsko tijelo i zdravlje",
    "difficulty": "medium",
    "question": "Koji vitamin nastaje u koži uz sunčevu svjetlost?",
    "optionA": "Vitamin K",
    "optionB": "Vitamin D",
    "optionC": "Vitamin C",
    "optionD": "Vitamin B12",
    "correctAnswer": "Vitamin D"
  },
  {
    "category": "Ljudsko tijelo i zdravlje",
    "difficulty": "hard",
    "question": "Što prenosi kisik u krvi?",
    "optionA": "Hemoglobin",
    "optionB": "Inzulin",
    "optionC": "Kolagen",
    "optionD": "Melanin",
    "correctAnswer": "Hemoglobin"
  },
  {
    "category": "Ljudsko tijelo i zdravlje",
    "difficulty": "medium",
    "question": "Koji sustav uključuje mozak i leđnu moždinu?",
    "optionA": "Probavni sustav",
    "optionB": "Dišni sustav",
    "optionC": "Mišićni sustav",
    "optionD": "Živčani sustav",
    "correctAnswer": "Živčani sustav"
  },
  {
    "category": "Ljudsko tijelo i zdravlje",
    "difficulty": "hard",
    "question": "Koji organ proizvodi žuč?",
    "optionA": "Srce",
    "optionB": "Pluća",
    "optionC": "Jetra",
    "optionD": "Bubreg",
    "correctAnswer": "Jetra"
  },
  {
    "category": "Ljudsko tijelo i zdravlje",
    "difficulty": "medium",
    "question": "Koja je glavna funkcija crvenih krvnih stanica?",
    "optionA": "Probava hrane",
    "optionB": "Prijenos kisika",
    "optionC": "Borba protiv infekcija",
    "optionD": "Zgrušavanje krvi",
    "correctAnswer": "Prijenos kisika"
  },
  {
    "category": "Ljudsko tijelo i zdravlje",
    "difficulty": "easy",
    "question": "Koji mineral je važan za kosti?",
    "optionA": "Kalcij",
    "optionB": "Natrij",
    "optionC": "Željezo",
    "optionD": "Jod",
    "correctAnswer": "Kalcij"
  },
  {
    "category": "Ljudsko tijelo i zdravlje",
    "difficulty": "easy",
    "question": "Što mjeri puls?",
    "optionA": "Tjelesnu visinu",
    "optionB": "Razinu šećera",
    "optionC": "Temperaturu zraka",
    "optionD": "Otkucaje srca",
    "correctAnswer": "Otkucaje srca"
  },
  {
    "category": "Ljudsko tijelo i zdravlje",
    "difficulty": "easy",
    "question": "Koji organ je glavni za probavu hrane u kiselom okruženju?",
    "optionA": "Srce",
    "optionB": "Mokraćni mjehur",
    "optionC": "Želudac",
    "optionD": "Pluća",
    "correctAnswer": "Želudac"
  },
  {
    "category": "Ljudsko tijelo i zdravlje",
    "difficulty": "medium",
    "question": "Koji hormon regulira šećer u krvi?",
    "optionA": "Dopamin",
    "optionB": "Inzulin",
    "optionC": "Adrenalin",
    "optionD": "Melatonin",
    "correctAnswer": "Inzulin"
  },
  {
    "category": "Ljudsko tijelo i zdravlje",
    "difficulty": "hard",
    "question": "Koji dio tijela povezuje mišić s kosti?",
    "optionA": "Tetiva",
    "optionB": "Ligament",
    "optionC": "Hrskavica",
    "optionD": "Živac",
    "correctAnswer": "Tetiva"
  },
  {
    "category": "Ljudsko tijelo i zdravlje",
    "difficulty": "hard",
    "question": "Koji dio krvi pomaže u zgrušavanju?",
    "optionA": "Eritrociti",
    "optionB": "Leukociti",
    "optionC": "Plazma",
    "optionD": "Trombociti",
    "correctAnswer": "Trombociti"
  },
  {
    "category": "Ljudsko tijelo i zdravlje",
    "difficulty": "medium",
    "question": "Koje stanice brane tijelo od infekcija?",
    "optionA": "Trombociti",
    "optionB": "Masne stanice",
    "optionC": "Bijele krvne stanice",
    "optionD": "Crvene krvne stanice",
    "correctAnswer": "Bijele krvne stanice"
  },
  {
    "category": "Ljudsko tijelo i zdravlje",
    "difficulty": "easy",
    "question": "Koja navika najviše pomaže higijeni ruku?",
    "optionA": "Preskakanje vode",
    "optionB": "Pranje ruku sapunom",
    "optionC": "Dodirivanje lica",
    "optionD": "Dijeljenje ručnika",
    "correctAnswer": "Pranje ruku sapunom"
  }
];

const questions = questionsWithDifficulty.map(({ difficulty, ...question }) => question);

async function main() {
  await prisma.question.deleteMany({
    where: {
      category: {
        in: categoriesToReset,
      },
    },
  });

  await prisma.question.createMany({
    data: questions,
  });

  const counts = await prisma.question.groupBy({
    by: ["category"],
    _count: {
      category: true,
    },
    orderBy: {
      category: "asc",
    },
  });

  console.log("Matematika je obrisana.");
  console.log("Pitanja su uspješno dodana.");
  console.table(
    counts.map((item) => ({
      category: item.category,
      count: item._count.category,
    })),
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
