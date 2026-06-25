// ─── Types ───────────────────────────────────────────────────────────────────

export interface WorldTeam {
  rank: number;
  nation: string;
  points: number;
  yearEstablished?: number;
  accomplishments?: string[];
  keyPlayers?: string[];
  headCoach?: string;
  recentRecord?: string;
  notes?: string;
}

export interface CollegeProgram {
  school: string;
  state: string;
  division: "DI" | "DII" | "DIII";
  conference?: string;
  status: "Competing" | "Announced";
  record?: string;
}

export interface CollegeRanking {
  rank: number;
  school: string;
  state: string;
  division: "DI" | "DII" | "DIII" | "NAIA";
  conference?: string;
  record?: string;
  notes?: string;
}

export interface HSTeam {
  rank: number;
  school: string;
  city: string;
  state: string;
  stateFull: string;
  record?: string;
  stateTitles?: number;
  notes?: string;
}

// ─── Flags ───────────────────────────────────────────────────────────────────

const COUNTRY_FLAGS: Record<string, string> = {
  "Mexico": "🇲🇽",
  "USA": "🇺🇸",
  "Great Britain": "🇬🇧",
  "Canada": "🇨🇦",
  "Japan": "🇯🇵",
  "Austria": "🇦🇹",
  "Spain": "🇪🇸",
  "Italy": "🇮🇹",
  "Germany": "🇩🇪",
  "Australia": "🇦🇺",
  "France": "🇫🇷",
  "Panama": "🇵🇦",
  "New Zealand": "🇳🇿",
  "Switzerland": "🇨🇭",
  "Brazil": "🇧🇷",
  "Czechia": "🇨🇿",
  "Finland": "🇫🇮",
  "Israel": "🇮🇱",
  "China": "🇨🇳",
  "Denmark": "🇩🇰",
  "Ireland": "🇮🇪",
  "Sweden": "🇸🇪",
  "Korea": "🇰🇷",
  "Malaysia": "🇲🇾",
  "Poland": "🇵🇱",
  "Philippines": "🇵🇭",
  "Indonesia": "🇮🇩",
  "Ukraine": "🇺🇦",
  "Nigeria": "🇳🇬",
  "American Samoa": "🇦🇸",
  "Thailand": "🇹🇭",
  "Morocco": "🇲🇦",
  "Slovenia": "🇸🇮",
  "Turkiye": "🇹🇷",
  "India": "🇮🇳",
  "Egypt": "🇪🇬",
  "Colombia": "🇨🇴",
  "Guatemala": "🇬🇹",
  "Norway": "🇳🇴",
  "Jordan": "🇯🇴",
  "Argentina": "🇦🇷",
  "Jamaica": "🇯🇲",
  "Hong Kong, China": "🇭🇰",
  "Netherlands": "🇳🇱",
  "Chile": "🇨🇱",
  "Kuwait": "🇰🇼",
  "Singapore": "🇸🇬",
  "Georgia": "🇬🇪",
  "Cameroon": "🇨🇲",
  "Tunisia": "🇹🇳",
  "Hungary": "🇭🇺",
  "Croatia": "🇭🇷",
  "Portugal": "🇵🇹",
  "Belgium": "🇧🇪",
  "Slovakia": "🇸🇰",
  "South Africa": "🇿🇦",
  "El Salvador": "🇸🇻",
  "Senegal": "🇸🇳",
  "Uganda": "🇺🇬",
  "Serbia": "🇷🇸",
};

export function getFlag(nation: string): string {
  return COUNTRY_FLAGS[nation] ?? "🏳️";
}

// Maps DB country strings to the IFAF ranking `nation` label.
const NATION_ALIASES: Record<string, string> = {
  "united states": "usa",
  "us": "usa",
  "u.s.a.": "usa",
  "great britain": "great britain",
  "united kingdom": "great britain",
  "uk": "great britain",
};

/** Normalize any country/nation string to a comparable key. */
export function nationKey(value: string | null | undefined): string {
  const v = (value ?? "").trim().toLowerCase();
  return NATION_ALIASES[v] ?? v;
}

// ─── World Rankings ───────────────────────────────────────────────────────────
// Source: IFAF World Rankings — americanfootball.sport/ifaf-world-rankings/
// Last updated: 2025

export const WOMENS_WORLD_RANKINGS: WorldTeam[] = [
  {
    rank: 1, nation: "Mexico", points: 10987,
    yearEstablished: 2010,
    accomplishments: ["2022 IFAF World Championship Gold", "2024 IFAF World Championship Gold", "2x Americas Championship"],
    keyPlayers: ["Valeria Ortiz", "Diana Flores (QB)", "Karina Ortiz", "Ana Rojano (DB)", "Tania Rincón (QB)", "Rebeca Landa (Rusher)"],
    headCoach: "Fernando Alfaro",
    recentRecord: "Gold — 2024 IFAF World Championship",
    notes: "Mexico's women's program is the most dominant in the world, led by quarterback Diana Flores who became a global face of flag football ahead of the 2028 Olympics.",
  },
  {
    rank: 2, nation: "USA", points: 10817,
    yearEstablished: 2008,
    accomplishments: ["2018 IFAF World Championship Gold", "2021 IFAF World Championship Gold", "2024 IFAF World Championship Gold", "2023 IFAF Americas Championship Gold"],
    keyPlayers: ["Vanita Krouch (QB)", "Maci Joncich (WR/QB)", "Brianna Hernandez-Silva (DB)", "Deliah Autry-Jones (DB)", "Addison Orsborn (Rusher)"],
    headCoach: "Saaid Mortazavi",
    recentRecord: "Gold — 2024 IFAF World Championship (Lahti, FIN)",
    notes: "USA Women are 3x IFAF World Champions (2018, 2021, 2024), ranked #2 globally. QB Vanita Krouch was honored at an NFL game following the team's 2024 championship victory. Head coach Saaid Mortazavi leads a 12-player roster of elite flag specialists from across the country.",
  },
  {
    rank: 3, nation: "Great Britain", points: 8879,
    yearEstablished: 2012,
    accomplishments: ["2x IFAF European Championship", "2022 IFAF World Championship Bronze"],
    keyPlayers: ["Brittany Botterill (QB)", "Phoebe Schecter (C)", "Sarah Wakelin (Rusher)"],
    headCoach: "Dean Whittingslow",
    recentRecord: "Bronze — 2024 IFAF World Championship",
    notes: "Great Britain's women's program has been the top European flag football nation, with strong organizational support from British American Football Association.",
  },
  {
    rank: 4, nation: "Canada", points: 8870,
    yearEstablished: 2011,
    accomplishments: ["Multiple IFAF Americas podium finishes"],
    recentRecord: "Top 4 — 2024 IFAF World Championship",
    notes: "Canada's women's national team consistently ranks among the top four globally and draws from a strong domestic league structure.",
  },
  {
    rank: 5, nation: "Japan", points: 8643,
    yearEstablished: 2009,
    accomplishments: ["2x IFAF Asia/Oceania Championship", "Top 5 World Championship"],
    recentRecord: "Top 6 — 2024 IFAF World Championship",
    notes: "Japan's women's program is the dominant force in Asia, backed by a well-organized domestic flag football federation.",
  },
  {
    rank: 6, nation: "Austria", points: 8575,
    yearEstablished: 2013,
    accomplishments: ["2x IFAF European Championship (Women's)"],
    recentRecord: "Top 6 — 2024 IFAF World Championship",
    notes: "Austria's women are among the top European nations, benefiting from strong overall Austrian flag football infrastructure.",
  },
  {
    rank: 7, nation: "Spain", points: 6619,
    yearEstablished: 2014,
    accomplishments: ["IFAF European Championship finalist"],
    notes: "Spain's women's program has grown rapidly alongside their men's program, competing at the top of the European circuit.",
  },
  {
    rank: 8, nation: "Italy", points: 6606,
    yearEstablished: 2012,
    accomplishments: ["2x IFAF European Championship podium", "Top 8 — 2024 IFAF World Championship (Lahti, FIN)"],
    keyPlayers: ["Martika 'Tika' Marcucci (DB)", "Sofia Petrillo (QB)", "Nausicaa Dell'Orto (WR)", "Aleksandra Radisavljević (WR)", "Yvonne Guglielmino (DB)"],
    headCoach: "Katherine Sowers",
    recentRecord: "Top 8 — 2024 IFAF World Championship (Lahti, FIN)",
    notes: "Italy's women's national team is one of Europe's rising forces, coached by Katherine Sowers — former San Francisco 49ers offensive assistant and the first woman to coach in a Super Bowl. Tika Marcucci (co-host of Talkin Flag) is a starting DB for the squad. Ambra Marcucci (co-host) is also part of the Italy flag football community.",
  },
  {
    rank: 9, nation: "Germany", points: 6000,
    yearEstablished: 2013,
    accomplishments: ["IFAF European Championship contender"],
    notes: "Germany's women's flag program has grown alongside their strong gridiron football culture, regularly competing at European Championships.",
  },
  {
    rank: 10, nation: "Australia", points: 5818,
    yearEstablished: 2014,
    accomplishments: ["IFAF Oceania Championship"],
    notes: "Australia's women compete as the top Oceania nation at world-level events.",
  },
  { rank: 11, nation: "France",         points: 5813, yearEstablished: 2014 },
  { rank: 12, nation: "Panama",         points: 5755, yearEstablished: 2015 },
  { rank: 13, nation: "New Zealand",    points: 5143, yearEstablished: 2016 },
  { rank: 14, nation: "Switzerland",    points: 5138, yearEstablished: 2015 },
  { rank: 15, nation: "Brazil",         points: 5093, yearEstablished: 2016 },
  { rank: 16, nation: "Czechia",        points: 4907, yearEstablished: 2016 },
  { rank: 17, nation: "Finland",        points: 4662, yearEstablished: 2017 },
  { rank: 18, nation: "Israel",         points: 4462, yearEstablished: 2017 },
  { rank: 18, nation: "China",          points: 4462, yearEstablished: 2016 },
  { rank: 20, nation: "Denmark",        points: 4396, yearEstablished: 2017 },
  { rank: 21, nation: "Ireland",        points: 4368, yearEstablished: 2018 },
  { rank: 22, nation: "Sweden",         points: 4355, yearEstablished: 2017 },
  { rank: 23, nation: "Korea",          points: 4136, yearEstablished: 2018 },
  { rank: 24, nation: "Malaysia",       points: 3508 },
  { rank: 25, nation: "Poland",         points: 3050 },
  { rank: 26, nation: "Philippines",    points: 2980 },
  { rank: 27, nation: "Indonesia",      points: 2967 },
  { rank: 28, nation: "Ukraine",        points: 2942 },
  { rank: 29, nation: "Nigeria",        points: 2833 },
  { rank: 30, nation: "American Samoa", points: 2800 },
  { rank: 31, nation: "Thailand",       points: 2751 },
  { rank: 32, nation: "Morocco",        points: 2500 },
  { rank: 33, nation: "Slovenia",       points: 2333 },
  { rank: 34, nation: "Turkiye",        points: 2283 },
  { rank: 35, nation: "India",          points: 2280 },
  { rank: 36, nation: "Egypt",          points: 2167 },
  { rank: 37, nation: "Colombia",       points: 2160 },
  { rank: 38, nation: "Guatemala",      points: 2125 },
  { rank: 39, nation: "Norway",         points: 2100 },
  { rank: 40, nation: "Jordan",         points: 2017 },
  { rank: 41, nation: "Argentina",      points: 1960 },
  { rank: 42, nation: "Jamaica",        points: 1920 },
  { rank: 42, nation: "Hong Kong, China", points: 1920 },
  { rank: 44, nation: "Netherlands",    points: 1817 },
  { rank: 45, nation: "Chile",          points: 642  },
];

export const MENS_WORLD_RANKINGS: WorldTeam[] = [
  {
    rank: 1, nation: "USA", points: 7915,
    yearEstablished: 2002,
    accomplishments: ["2012 IFAF World Championship Gold", "2016 IFAF World Championship Gold", "2022 IFAF World Championship Gold", "2024 IFAF World Championship Gold — 53-21 vs Austria"],
    keyPlayers: ["Darrell 'Housh' Doucette III (QB)", "Nico Casares (QB)", "Velton Brown Jr. (WR)", "Ja'Deion High (WR)", "Shawn Theard Jr. (Rusher)"],
    headCoach: "Jorge Cascudo",
    recentRecord: "Gold — 2024 IFAF World Championship (53-21 vs Austria, Lahti FIN)",
    notes: "The USA Men's national team is the most decorated program in IFAF history. QB Darrell 'Housh' Doucette III threw 6 touchdown passes in the 2024 championship final — a dominant 53-21 victory over Austria. Head coach Jorge Cascudo leads a roster of elite flag specialists with no active NFL players.",
  },
  {
    rank: 2, nation: "Austria", points: 7109,
    yearEstablished: 2003,
    accomplishments: ["2x IFAF World Championship Silver", "4x IFAF European Championship"],
    keyPlayers: ["Felix Wasshuber (QB)", "Martin Stur (C)", "Daniel Hochleitner (WR)"],
    headCoach: "Michael Salamon",
    recentRecord: "Silver — 2024 IFAF World Championship",
    notes: "Austria is the premier flag football nation outside North America, with a dominant European Championship record and consistent World Championship podium finishes.",
  },
  {
    rank: 3, nation: "Mexico", points: 6871,
    yearEstablished: 2005,
    accomplishments: ["Multiple IFAF World Championship podium finishes", "Americas Championship winners"],
    headCoach: "Fernando Alfaro",
    recentRecord: "Bronze — 2024 IFAF World Championship",
    notes: "Mexico's men's program is the strongest in Latin America, buoyed by huge domestic enthusiasm and a well-organized national federation.",
  },
  {
    rank: 4, nation: "Italy", points: 6248,
    yearEstablished: 2006,
    accomplishments: ["2x IFAF European Championship finalist", "2022 European Championship Silver", "6th Place — 2024 IFAF World Championship"],
    keyPlayers: ["Luke Zahradka (QB)", "Gianluca Santagostino (WR)", "Vincent Papale (WR)", "Tamsir Seck (WR)", "Lorenzo Scaperrotta (DB)"],
    headCoach: "Giorgio Gerbaldi",
    recentRecord: "6th Place — 2024 IFAF World Championship (Lahti, FIN)",
    notes: "Italy's men's program ranks among Europe's elite, reaching the quarterfinals of the 2024 IFAF World Championship before falling to eventual champions USA 46-21. The Italian Flag Football Federation (FIDAF) has grown rapidly, producing strong national teams at all levels.",
  },
  {
    rank: 5, nation: "France", points: 6121,
    yearEstablished: 2007,
    accomplishments: ["IFAF European Championship finalist", "Multiple European podium finishes"],
    notes: "France benefits from one of Europe's largest and most organized flag football communities.",
  },
  {
    rank: 6, nation: "Switzerland", points: 5949,
    yearEstablished: 2006,
    accomplishments: ["IFAF European Championship contender", "Multiple European top 6 finishes"],
    notes: "Switzerland is a consistent European powerhouse, regularly qualifying for and competing at IFAF World Championships.",
  },
  {
    rank: 7, nation: "Japan", points: 5869,
    yearEstablished: 2004,
    accomplishments: ["Multiple IFAF Asia/Oceania Championships", "Consistent World Championship qualifier"],
    notes: "Japan's men's program is dominant in Asia, with a long tradition of American football that has fueled flag football growth.",
  },
  {
    rank: 8, nation: "Australia", points: 5703,
    yearEstablished: 2008,
    accomplishments: ["IFAF Oceania Championship", "Multiple World Championship appearances"],
    notes: "Australia competes as the top Oceania nation and has made consistent strides at the world level.",
  },
  {
    rank: 9, nation: "Israel", points: 5667,
    yearEstablished: 2010,
    accomplishments: ["IFAF European top 8 regular", "Multiple World Championship appearances"],
    notes: "Israel's men's flag program has grown steadily, becoming a regular at both European and world competitions.",
  },
  {
    rank: 10, nation: "Canada", points: 5628,
    yearEstablished: 2004,
    accomplishments: ["Americas Championship finalist", "Multiple World Championship appearances"],
    notes: "Canada draws from a deep pool of athletes with strong ties to both American football and flag football programs.",
  },
  { rank: 11, nation: "Germany",         points: 5426, yearEstablished: 2007 },
  { rank: 12, nation: "Great Britain",   points: 5230, yearEstablished: 2008 },
  { rank: 13, nation: "Panama",          points: 5180, yearEstablished: 2010 },
  { rank: 14, nation: "Denmark",         points: 4954, yearEstablished: 2010 },
  { rank: 15, nation: "New Zealand",     points: 4860, yearEstablished: 2012 },
  { rank: 16, nation: "Spain",           points: 4612, yearEstablished: 2011 },
  { rank: 17, nation: "Brazil",          points: 4516, yearEstablished: 2012 },
  { rank: 18, nation: "Sweden",          points: 4510, yearEstablished: 2011 },
  { rank: 19, nation: "Ireland",         points: 4413, yearEstablished: 2013 },
  { rank: 20, nation: "Ukraine",         points: 4374, yearEstablished: 2014 },
  { rank: 21, nation: "Finland",         points: 4305, yearEstablished: 2013 },
  { rank: 22, nation: "Czechia",         points: 4196, yearEstablished: 2013 },
  { rank: 23, nation: "Argentina",       points: 4089, yearEstablished: 2014 },
  { rank: 24, nation: "Kuwait",          points: 3973, yearEstablished: 2015 },
  { rank: 25, nation: "Chile",           points: 3900, yearEstablished: 2015 },
  { rank: 26, nation: "Poland",          points: 3802, yearEstablished: 2015 },
  { rank: 27, nation: "Singapore",       points: 3685 },
  { rank: 28, nation: "Korea",           points: 3590 },
  { rank: 29, nation: "Thailand",        points: 3500 },
  { rank: 30, nation: "Georgia",         points: 3336 },
  { rank: 31, nation: "Cameroon",        points: 3133 },
  { rank: 32, nation: "Nigeria",         points: 2980 },
  { rank: 33, nation: "American Samoa",  points: 2900 },
  { rank: 34, nation: "China",           points: 2800 },
  { rank: 35, nation: "Egypt",           points: 2620 },
  { rank: 36, nation: "Indonesia",       points: 2590 },
  { rank: 37, nation: "Tunisia",         points: 2540 },
  { rank: 38, nation: "Slovenia",        points: 2463 },
  { rank: 39, nation: "Netherlands",     points: 2413 },
  { rank: 40, nation: "Philippines",     points: 2396 },
  { rank: 41, nation: "Hungary",         points: 2200 },
  { rank: 42, nation: "Guatemala",       points: 2150 },
  { rank: 42, nation: "Croatia",         points: 2150 },
  { rank: 42, nation: "Hong Kong, China",points: 2150 },
  { rank: 45, nation: "Portugal",        points: 2138 },
  { rank: 46, nation: "Belgium",         points: 2073 },
  { rank: 47, nation: "Slovakia",        points: 2072 },
  { rank: 48, nation: "Morocco",         points: 2070 },
  { rank: 49, nation: "Colombia",        points: 2067 },
  { rank: 50, nation: "South Africa",    points: 2050 },
  { rank: 51, nation: "Norway",          points: 1975 },
  { rank: 52, nation: "Jamaica",         points: 1967 },
  { rank: 53, nation: "Jordan",          points: 1925 },
  { rank: 54, nation: "El Salvador",     points: 1900 },
  { rank: 55, nation: "Senegal",         points: 1850 },
  { rank: 56, nation: "India",           points: 1794 },
  { rank: 57, nation: "Uganda",          points: 1600 },
  { rank: 58, nation: "Serbia",          points: 986  },
  { rank: 59, nation: "Malaysia",        points: 100  },
];

// ─── College Rankings ─────────────────────────────────────────────────────────
// Curated power rankings — womens college flag football, Spring 2026
// Sources: collegiateflagfootball.com, conference standings, womenscollegeflagfootball.com

export const COLLEGE_RANKINGS: CollegeRanking[] = [
  { rank: 1,  school: "Marymount University",            state: "VA", division: "DIII", conference: "Atlantic East",       record: "18-2",  notes: "13-1 in conference play; dominant program since inaugural season" },
  { rank: 2,  school: "Wingate University",              state: "NC", division: "DII",  conference: "Conference Carolinas", record: "8-1",   notes: "Conference Carolinas regular season champions" },
  { rank: 3,  school: "Eastern University",              state: "PA", division: "DIII", conference: "Atlantic East",       record: "13-2",  notes: "11-1 conference record; Atlantic East runner-up" },
  { rank: 4,  school: "Gallaudet University",            state: "DC", division: "DIII", conference: "United East",         record: "9-1",   notes: "6-0 in United East; undefeated conference play" },
  { rank: 5,  school: "Ferrum College",                  state: "VA", division: "DII",  conference: "Conference Carolinas", record: "8-1",   notes: "Co-champions of Conference Carolinas alongside Wingate" },
  { rank: 6,  school: "SUNY Geneseo",                    state: "NY", division: "DIII", conference: "Empire 8",            record: "12-5",  notes: "Empire 8 Conference champion; 7-1 conference record" },
  { rank: 7,  school: "Penn State Harrisburg",           state: "PA", division: "DIII", conference: "United East",         record: "7-2",   notes: "5-2 in United East; runner-up behind Gallaudet" },
  { rank: 8,  school: "Barton College",                  state: "NC", division: "DII",  conference: "Conference Carolinas", record: "7-2",   notes: "Strong DII program in competitive Conference Carolinas" },
  { rank: 9,  school: "Lees-McRae College",              state: "NC", division: "DII",  conference: "Conference Carolinas", record: "7-2",   notes: "Co-ranked with Barton; one of the top DII programs nationally" },
  { rank: 10, school: "Immaculata University",           state: "PA", division: "DIII", conference: "Atlantic East",       record: "11-3",  notes: "10-3 conference; consistent top-tier program in Atlantic East" },
  { rank: 11, school: "SUNY Brockport",                  state: "NY", division: "DIII", conference: "Empire 8",            record: "10-5",  notes: "6-3 conference play; one of Empire 8's top challengers" },
  { rank: 12, school: "Winston-Salem State University",  state: "NC", division: "DII",  conference: "CIAA",                notes: "CIAA's top program; building a strong national reputation" },
  { rank: 13, school: "Virginia Union University",       state: "VA", division: "DII",  conference: "CIAA",                notes: "Strong CIAA contender with deep roster" },
  { rank: 14, school: "University of Mary Hardin-Baylor",state: "TX", division: "DIII", conference: "ASC",                 notes: "Top program in the American Southwest Conference" },
  { rank: 15, school: "Fayetteville State University",   state: "NC", division: "DII",  conference: "CIAA",                notes: "Competitive CIAA program; consistent postseason presence" },
  { rank: 16, school: "Wisconsin-Oshkosh",               state: "WI", division: "DIII", conference: "WIAC",                notes: "Midwest's top program; building strong Midwest presence" },
  { rank: 17, school: "Hardin-Simmons University",       state: "TX", division: "DIII", conference: "ASC",                 notes: "Strong Texas program in ASC conference" },
  { rank: 18, school: "Bowie State University",          state: "MD", division: "DII",  conference: "CIAA",                notes: "Competitive CIAA program with strong recruiting base" },
  { rank: 19, school: "Alabama State University",        state: "AL", division: "DI",   conference: "SWAC",                notes: "Top DI program in SWAC; one of first DI flag programs in the country" },
  { rank: 20, school: "Roberts Wesleyan University",     state: "NY", division: "DII",  conference: "ECC",                 notes: "ECC Conference's standout flag program" },
  { rank: 21, school: "University of Mount Union",       state: "OH", division: "DIII", conference: "Ohio Athletic",       notes: "Powerhouse OAC program with strong overall athletic tradition" },
  { rank: 22, school: "Howard Payne University",         state: "TX", division: "DIII", conference: "ASC",                 notes: "Solid ASC program contributing to Texas flag football growth" },
  { rank: 23, school: "Long Island University",          state: "NY", division: "DI",   conference: "ECAC",                notes: "One of the few DI programs with immediate competitive impact" },
  { rank: 24, school: "Mercyhurst University",           state: "PA", division: "DI",   conference: "ECAC",                notes: "Strong DI ECAC program in Pennsylvania" },
  { rank: 25, school: "Cedar Crest College",             state: "PA", division: "DIII", conference: "United East",         record: "5-5",   notes: "Competitive mid-tier program in United East" },
];

// ─── High School Rankings ─────────────────────────────────────────────────────
// Curated girls flag football national top 50 — 2025–26 season
// Sources: MaxPreps, FHSAA, state athletic associations
// Rankings reflect program prestige, recent results & state championship history

export const HS_RANKINGS: HSTeam[] = [
  { rank: 1,  school: "Carol City Chiefs",          city: "Miami Gardens",   state: "FL", stateFull: "Florida",  stateTitles: 4, record: "14-1", notes: "Multi-time FHSAA state champions; one of the most decorated programs in the country" },
  { rank: 2,  school: "Dr. Phillips Panthers",      city: "Orlando",         state: "FL", stateFull: "Florida",  stateTitles: 2, record: "13-2", notes: "Perennial contender in FHSAA Class 4A; consistently among Florida's best" },
  { rank: 3,  school: "IMG Academy Ascenders",      city: "Bradenton",       state: "FL", stateFull: "Florida",  notes: "Elite national prep program; roster features top recruits from across the country" },
  { rank: 4,  school: "Bishop Gorman Gaels",        city: "Las Vegas",       state: "NV", stateFull: "Nevada",   stateTitles: 3, record: "15-0", notes: "Dominant Nevada program; undefeated state champions multiple years running" },
  { rank: 5,  school: "Treasure Coast Titans",      city: "Port St. Lucie",  state: "FL", stateFull: "Florida",  stateTitles: 1, record: "12-2", notes: "Consistent FHSAA playoff program with deep talent pipeline" },
  { rank: 6,  school: "Corona del Sol Aztecs",      city: "Tempe",           state: "AZ", stateFull: "Arizona",  stateTitles: 2, record: "13-1", notes: "Top Arizona program; AIA state champions; flag football powerhouse in the Southwest" },
  { rank: 7,  school: "Western Wildcats",           city: "Davie",           state: "FL", stateFull: "Florida",  record: "11-2", notes: "Broward County powerhouse; regular FHSAA postseason contender" },
  { rank: 8,  school: "Seminole Ridge Hawks",       city: "Loxahatchee",     state: "FL", stateFull: "Florida",  record: "12-3", notes: "Strong Palm Beach County program with multiple deep playoff runs" },
  { rank: 9,  school: "Collins Hill Eagles",        city: "Suwanee",         state: "GA", stateFull: "Georgia",  stateTitles: 1, record: "12-2", notes: "Georgia's premier girls flag program; GHSA state champions" },
  { rank: 10, school: "Monarch Jaguars",            city: "Coconut Creek",   state: "FL", stateFull: "Florida",  record: "11-3", notes: "Broward County contender with strong year-over-year recruiting" },
  { rank: 11, school: "Plantation Colonels",        city: "Plantation",      state: "FL", stateFull: "Florida",  record: "10-3", notes: "Established Broward program with championship pedigree" },
  { rank: 12, school: "Hamilton Huskies",           city: "Chandler",        state: "AZ", stateFull: "Arizona",  record: "11-2", notes: "Arizona powerhouse; consistently among top programs in the state" },
  { rank: 13, school: "Palm Beach Gardens Gators",  city: "Palm Beach Gardens",state:"FL", stateFull: "Florida", record: "11-3", notes: "Competitive Palm Beach County program in FHSAA" },
  { rank: 14, school: "Cypress Bay Lightning",      city: "Weston",          state: "FL", stateFull: "Florida",  record: "10-4", notes: "South Florida contender; regular deep playoff run" },
  { rank: 15, school: "South Anchorage Wolverines", city: "Anchorage",       state: "AK", stateFull: "Alaska",   stateTitles: 2, record: "10-1", notes: "Alaska's top girls flag program; ASAA state champions" },
  { rank: 16, school: "Buford Wolves",              city: "Buford",          state: "GA", stateFull: "Georgia",  record: "11-3", notes: "GHSA top contender; one of Georgia's most athletic programs overall" },
  { rank: 17, school: "St. Thomas Aquinas Raiders", city: "Fort Lauderdale", state: "FL", stateFull: "Florida",  record: "10-4", notes: "Premier private school program in South Florida" },
  { rank: 18, school: "Mater Dei Monarchs",         city: "Santa Ana",       state: "CA", stateFull: "California",record: "12-2",notes: "California's top girls flag program; nationally known overall athletic program" },
  { rank: 19, school: "Chaminade-Madonna Lions",    city: "Hollywood",       state: "FL", stateFull: "Florida",  record: "10-4", notes: "Private school powerhouse with strong overall athletics tradition" },
  { rank: 20, school: "Desert Pines Jaguars",       city: "Las Vegas",       state: "NV", stateFull: "Nevada",   record: "12-2", notes: "Nevada runner-up; Bishop Gorman's top rival in Southern Nevada" },
  { rank: 21, school: "John Curtis Patriots",       city: "River Ridge",     state: "LA", stateFull: "Louisiana",stateTitles: 1, record: "11-2", notes: "Louisiana's top program; LHSAA state champions in girls flag" },
  { rank: 22, school: "Southlake Carroll Dragons",  city: "Southlake",       state: "TX", stateFull: "Texas",    record: "13-1", notes: "Texas powerhouse; one of the premier programs in UIL flag" },
  { rank: 23, school: "Desert Vista Thunder",       city: "Phoenix",         state: "AZ", stateFull: "Arizona",  record: "10-3", notes: "AIA top-tier program; consistent Arizona postseason team" },
  { rank: 24, school: "Coral Springs Charter Panthers",city:"Coral Springs", state: "FL", stateFull: "Florida",  record: "10-4", notes: "Broward County program with strong coaching staff" },
  { rank: 25, school: "Allen Eagles",               city: "Allen",           state: "TX", stateFull: "Texas",    record: "12-2", notes: "Top DFW-area program; benefits from Allen ISD's strong athletics infrastructure" },
  { rank: 26, school: "Archbishop Carroll Patriots",city: "Miami",           state: "FL", stateFull: "Florida",  record: "9-4",  notes: "Miami private school program with growing flag football tradition" },
  { rank: 27, school: "Long Beach Poly Jackrabbits",city: "Long Beach",      state: "CA", stateFull: "California",record: "11-3",notes: "SoCal contender; one of California's elite overall athletics programs" },
  { rank: 28, school: "Deerfield Beach Bucks",      city: "Deerfield Beach", state: "FL", stateFull: "Florida",  record: "9-4",  notes: "Competitive Broward County program in FHSAA" },
  { rank: 29, school: "McArthur Mustangs",          city: "Hollywood",       state: "FL", stateFull: "Florida",  record: "9-4",  notes: "Broward County mid-tier playoff program" },
  { rank: 30, school: "Alpharetta Raiders",         city: "Alpharetta",      state: "GA", stateFull: "Georgia",  record: "10-3", notes: "Competitive GHSA program in Atlanta's north suburbs" },
  { rank: 31, school: "Katy Tigers",                city: "Katy",            state: "TX", stateFull: "Texas",    record: "11-3", notes: "Houston-area UIL flag program with elite overall athletic tradition" },
  { rank: 32, school: "Rummel Raiders",             city: "Metairie",        state: "LA", stateFull: "Louisiana",record: "10-3", notes: "Louisiana's second-best program; consistent runner-up to John Curtis" },
  { rank: 33, school: "Boone Braves",               city: "Orlando",         state: "FL", stateFull: "Florida",  record: "9-5",  notes: "Orlando-area program; competitive in FHSAA's loaded Orlando region" },
  { rank: 34, school: "St. Francis Red Raiders",    city: "Mountain View",   state: "CA", stateFull: "California",record: "10-4",notes: "NorCal's top flag program; strong Bay Area program" },
  { rank: 35, school: "Chandler Wolves",            city: "Chandler",        state: "AZ", stateFull: "Arizona",  record: "9-4",  notes: "Top East Valley Arizona program; consistent AIA playoff team" },
  { rank: 36, school: "Mater Lakes Academy",        city: "Hialeah",         state: "FL", stateFull: "Florida",  record: "9-5",  notes: "Miami-Dade program with growing flag football tradition" },
  { rank: 37, school: "The Woodlands Highlanders",  city: "The Woodlands",   state: "TX", stateFull: "Texas",    record: "10-4", notes: "North Houston UIL program with strong community support" },
  { rank: 38, school: "Coronado Cougars",           city: "Henderson",       state: "NV", stateFull: "Nevada",   record: "10-3", notes: "Southern Nevada program; consistent playoff team behind Bishop Gorman" },
  { rank: 39, school: "North Shore Mustangs",       city: "Houston",         state: "TX", stateFull: "Texas",    record: "11-3", notes: "East Houston UIL powerhouse with elite overall athletics" },
  { rank: 40, school: "Dimond Lynx",                city: "Anchorage",       state: "AK", stateFull: "Alaska",   record: "9-2",  notes: "Runner-up to South Anchorage in Alaska's competitive ASAA bracket" },
  { rank: 41, school: "Palm Beach Lakes Rams",      city: "West Palm Beach",  state: "FL", stateFull: "Florida", record: "8-5",  notes: "Palm Beach County program building a consistent playoff presence" },
  { rank: 42, school: "Jensen Beach Falcons",       city: "Jensen Beach",    state: "FL", stateFull: "Florida",  record: "9-4",  notes: "Treasure Coast area program with strong FHSAA competitive record" },
  { rank: 43, school: "Lake Mary Rams",             city: "Lake Mary",       state: "FL", stateFull: "Florida",  record: "9-5",  notes: "Central Florida program competing in FHSAA's loaded metro region" },
  { rank: 44, school: "DeSoto Eagles",              city: "DeSoto",          state: "TX", stateFull: "Texas",    record: "10-3", notes: "DFW-area UIL program with elite athletic program overall" },
  { rank: 45, school: "Apopka Blue Darters",        city: "Apopka",          state: "FL", stateFull: "Florida",  record: "8-5",  notes: "Central Florida program; consistent FHSAA participant" },
  { rank: 46, school: "Milton Eagles",              city: "Milton",          state: "GA", stateFull: "Georgia",  record: "9-4",  notes: "Atlanta-area GHSA program with strong athletics infrastructure" },
  { rank: 47, school: "Hialeah-Miami Lakes Trojans",city: "Hialeah",         state: "FL", stateFull: "Florida",  record: "8-5",  notes: "Miami-Dade program competing in one of Florida's most competitive areas" },
  { rank: 48, school: "South Broward Bulldogs",     city: "Hollywood",       state: "FL", stateFull: "Florida",  record: "8-5",  notes: "Competitive Hollywood-area program in FHSAA" },
  { rank: 49, school: "Boone Braves",               city: "Orlando",         state: "FL", stateFull: "Florida",  record: "8-6",  notes: "Orlando metro program; consistent FHSAA qualifier" },
  { rank: 50, school: "Miami Springs Golden Hawks",  city: "Miami Springs",  state: "FL", stateFull: "Florida",  record: "8-5",  notes: "Miami-Dade program with growing girls flag tradition" },
];

// ─── College Commits ──────────────────────────────────────────────────────────
// Known D1 / NAIA commits by HS and club flag football players — 2025/2026

export interface CollegeCommit {
  name: string;
  position: string;
  highSchool: string;
  state: string;
  commitSchool: string;
  division: "D1" | "DII" | "DIII" | "NAIA";
  conference?: string;
  notes?: string;
  season?: string;
}

export const COLLEGE_COMMITS: CollegeCommit[] = [
  {
    name: "Ariana Akey",
    position: "QB",
    highSchool: "Mountain Vista",
    state: "CO",
    commitSchool: "University of Nebraska",
    division: "D1",
    conference: "Big Ten",
    notes: "4,545 pass yds, 89 TDs. Nebraska announced D1 flag football program.",
    season: "2026",
  },
  {
    name: "Aribella Spandiary",
    position: "WR",
    highSchool: "Maine South",
    state: "IL",
    commitSchool: "Purdue University Northwest",
    division: "NAIA",
    conference: "Sun Conference",
    notes: "Illinois Player of the Year.",
    season: "2026",
  },
  {
    name: "Makena Cook",
    position: "WR",
    highSchool: "TBD",
    state: "TBD",
    commitSchool: "Power Four (offer — school TBD)",
    division: "D1",
    notes: "First known Power Four flag football offer.",
    season: "2026",
  },
];

// ─── Olympic 2028 ─────────────────────────────────────────────────────────────
// Flag football debuts as an Olympic sport at Los Angeles 2028.
// Official national team rosters have not yet been named by USA Football or IFAF.

export interface OlympicTeamInfo {
  nation: string;
  gender: "men" | "women";
  qualificationStatus: string;
  rosterStatus: "TBD" | "Announced" | "Partial";
  notes: string;
  ifafRank?: number;
}

export const OLYMPIC_2028_TEAMS: OlympicTeamInfo[] = [
  {
    nation: "United States",
    gender: "women",
    qualificationStatus: "Host nation — automatic berth",
    rosterStatus: "TBD",
    ifafRank: 1,
    notes: "USA Women are the 2x reigning IFAF World Champions (2021, 2024) and enter LA 2028 as the prohibitive favorites. Roster selection TBD by USA Football.",
  },
  {
    nation: "United States",
    gender: "men",
    qualificationStatus: "Host nation — automatic berth",
    rosterStatus: "TBD",
    ifafRank: 1,
    notes: "USA Men won the 2024 IFAF World Championship 53-21 over Austria. Roster selection TBD by USA Football.",
  },
  {
    nation: "Mexico",
    gender: "women",
    qualificationStatus: "IFAF Americas qualification pathway",
    rosterStatus: "TBD",
    ifafRank: 2,
    notes: "Mexico Women are the #2 ranked team in the world, led by quarterback Diana Flores. Strong Olympic candidates via Americas qualifier.",
  },
  {
    nation: "Austria",
    gender: "men",
    qualificationStatus: "IFAF Europe qualification pathway",
    rosterStatus: "TBD",
    ifafRank: 2,
    notes: "Austria Men finished 2nd at the 2024 IFAF World Championship. Top European qualifier candidate.",
  },
];

export const OLYMPIC_2028_INFO = {
  hostCity: "Los Angeles, CA",
  year: 2028,
  olympicDebut: true,
  genders: ["men", "women"] as const,
  teamsPerGender: 6,
  format: "Round robin + knockout",
  qualificationNote:
    "Six teams per gender will qualify through a combination of host nation automatic berth (USA), continental IFAF championships, and world rankings. Full qualification pathway to be announced by IOC and IFAF.",
  ifafSource: "https://www.ifaf.org",
  usaFootballSource: "https://usafootball.com/national-team/",
};

// ─── College Programs Directory (legacy) ─────────────────────────────────────
// Source: collegiateflagfootball.com, womenscollegeflagfootball.com, conference sites — May 2026
export const COLLEGE_PROGRAMS: CollegeProgram[] = [

  // ── Division I ──────────────────────────────────────────────────────────
  { school: "Alabama State University",        state: "AL", division: "DI", conference: "SWAC",          status: "Competing" },
  { school: "Long Island University",          state: "NY", division: "DI", conference: "ECAC",          status: "Competing" },
  { school: "Mercyhurst University",           state: "PA", division: "DI", conference: "ECAC",          status: "Competing" },
  { school: "Mount St. Mary's University",     state: "MD", division: "DI", conference: "Conference Carolinas", status: "Competing" },
  { school: "Fairleigh Dickinson University",  state: "NJ", division: "DI", conference: "NEC / ECAC",    status: "Announced" },
  { school: "Manhattan University",            state: "NY", division: "DI", conference: "MAAC / ECAC",   status: "Announced" },
  { school: "University of North Alabama",     state: "AL", division: "DI", conference: "CUSA",          status: "Announced" },
  { school: "Mississippi Valley State",        state: "MS", division: "DI", conference: "SWAC",          status: "Announced" },
  { school: "Eastern Michigan University",     state: "MI", division: "DI", conference: "MAC",           status: "Announced" },
  { school: "USC Upstate",                     state: "SC", division: "DI", conference: "Big South",     status: "Announced" },
  { school: "UNC Asheville",                   state: "NC", division: "DI", conference: "Big South",     status: "Announced" },
  { school: "University of Nebraska",          state: "NE", division: "DI", conference: "Big Ten",       status: "Announced" },
  { school: "Cal Poly",                        state: "CA", division: "DI", conference: "Big West",      status: "Announced" },
  { school: "UT Arlington",                    state: "TX", division: "DI", conference: "UAC",           status: "Announced" },
  { school: "Charleston Southern University",  state: "SC", division: "DI", conference: "Big South",     status: "Announced" },
  { school: "Gardner-Webb University",         state: "NC", division: "DI", conference: "Big South",     status: "Announced" },
  { school: "Radford University",              state: "VA", division: "DI", conference: "Big South",     status: "Announced" },
  { school: "Binghamton University",           state: "NY", division: "DI", conference: "America East",  status: "Announced" },
  { school: "Bradley University",              state: "IL", division: "DI", conference: "Missouri Valley", status: "Announced" },

  // ── Division II — Conference Carolinas ──────────────────────────────────
  { school: "Wingate University",              state: "NC", division: "DII", conference: "Conference Carolinas", status: "Competing", record: "8-1 conf." },
  { school: "Ferrum College",                  state: "VA", division: "DII", conference: "Conference Carolinas", status: "Competing", record: "8-1 conf." },
  { school: "Barton College",                  state: "NC", division: "DII", conference: "Conference Carolinas", status: "Competing", record: "7-2 conf." },
  { school: "Lees-McRae College",              state: "NC", division: "DII", conference: "Conference Carolinas", status: "Competing", record: "7-2 conf." },
  { school: "Chowan University",               state: "NC", division: "DII", conference: "Conference Carolinas", status: "Competing" },
  { school: "Emmanuel University",             state: "GA", division: "DII", conference: "Conference Carolinas", status: "Competing" },
  { school: "Erskine College",                 state: "SC", division: "DII", conference: "Conference Carolinas", status: "Competing" },
  { school: "King University",                 state: "TN", division: "DII", conference: "Conference Carolinas", status: "Competing" },
  { school: "Mars Hill University",            state: "NC", division: "DII", conference: "Conference Carolinas", status: "Competing" },
  { school: "Mount Olive University",          state: "NC", division: "DII", conference: "Conference Carolinas", status: "Competing" },

  // ── Division II — CIAA ──────────────────────────────────────────────────
  { school: "Winston-Salem State University",  state: "NC", division: "DII", conference: "CIAA", status: "Competing" },
  { school: "Fayetteville State University",   state: "NC", division: "DII", conference: "CIAA", status: "Competing" },
  { school: "Bowie State University",          state: "MD", division: "DII", conference: "CIAA", status: "Competing" },
  { school: "Bluefield State University",      state: "WV", division: "DII", conference: "CIAA", status: "Competing" },
  { school: "Claflin University",              state: "SC", division: "DII", conference: "CIAA", status: "Competing" },
  { school: "Johnson C. Smith University",     state: "NC", division: "DII", conference: "CIAA", status: "Competing" },
  { school: "Livingstone College",             state: "NC", division: "DII", conference: "CIAA", status: "Competing" },
  { school: "Shaw University",                 state: "NC", division: "DII", conference: "CIAA", status: "Competing" },
  { school: "Virginia Union University",       state: "VA", division: "DII", conference: "CIAA", status: "Competing" },

  // ── Division II — Other ─────────────────────────────────────────────────
  { school: "Roberts Wesleyan University",     state: "NY", division: "DII", conference: "ECC",          status: "Competing" },
  { school: "Allegheny College",               state: "PA", division: "DII", conference: "ECAC",         status: "Competing" },
  { school: "Saginaw Valley State University", state: "MI", division: "DII", conference: "GLIAC",        status: "Announced" },
  { school: "Spring Hill College",             state: "AL", division: "DII", conference: "SIAC",         status: "Announced" },
  { school: "Menlo College",                   state: "CA", division: "DII", conference: "PacWest",      status: "Announced" },

  // ── Division III — Atlantic East ────────────────────────────────────────
  { school: "Marymount University",            state: "VA", division: "DIII", conference: "Atlantic East", status: "Competing", record: "18-2 (13-1 conf.)" },
  { school: "Eastern University",              state: "PA", division: "DIII", conference: "Atlantic East", status: "Competing", record: "13-2 (11-1 conf.)" },
  { school: "Immaculata University",           state: "PA", division: "DIII", conference: "Atlantic East", status: "Competing", record: "11-3 (10-3 conf.)" },
  { school: "Centenary University",            state: "NJ", division: "DIII", conference: "Atlantic East", status: "Competing" },
  { school: "Holy Family University",          state: "PA", division: "DIII", conference: "Atlantic East", status: "Competing" },
  { school: "Neumann University",              state: "PA", division: "DIII", conference: "Atlantic East", status: "Competing" },
  { school: "Penn State Schuylkill",           state: "PA", division: "DIII", conference: "Atlantic East", status: "Competing" },
  { school: "Chestnut Hill College",           state: "PA", division: "DIII", conference: "Atlantic East", status: "Competing" },
  { school: "Marywood University",             state: "PA", division: "DIII", conference: "Atlantic East", status: "Competing" },

  // ── Division III — Empire 8 ─────────────────────────────────────────────
  { school: "SUNY Geneseo",                    state: "NY", division: "DIII", conference: "Empire 8", status: "Competing", record: "12-5 (7-1 conf.)" },
  { school: "SUNY Brockport",                  state: "NY", division: "DIII", conference: "Empire 8", status: "Competing", record: "10-5 (6-3 conf.)" },
  { school: "Elmira College",                  state: "NY", division: "DIII", conference: "Empire 8", status: "Competing", record: "6-6 (3-5 conf.)" },
  { school: "Hartwick College",                state: "NY", division: "DIII", conference: "Empire 8", status: "Competing", record: "4-7 (3-5 conf.)" },
  { school: "Russell Sage College",            state: "NY", division: "DIII", conference: "Empire 8", status: "Competing", record: "1-7 (1-7 conf.)" },

  // ── Division III — United East ──────────────────────────────────────────
  { school: "Gallaudet University",            state: "DC", division: "DIII", conference: "United East", status: "Competing", record: "9-1 (6-0 conf.)" },
  { school: "Penn State Harrisburg",           state: "PA", division: "DIII", conference: "United East", status: "Competing", record: "7-2 (5-2 conf.)" },
  { school: "Cedar Crest College",             state: "PA", division: "DIII", conference: "United East", status: "Competing", record: "5-5" },
  { school: "Cairn University",                state: "PA", division: "DIII", conference: "United East", status: "Competing", record: "3-7" },
  { school: "Keystone College",                state: "PA", division: "DIII", conference: "United East", status: "Competing", record: "2-7" },

  // ── Division III — American Southwest (ASC) ─────────────────────────────
  { school: "University of Mary Hardin-Baylor", state: "TX", division: "DIII", conference: "ASC", status: "Competing" },
  { school: "Hardin-Simmons University",        state: "TX", division: "DIII", conference: "ASC", status: "Competing" },
  { school: "Howard Payne University",          state: "TX", division: "DIII", conference: "ASC", status: "Competing" },
  { school: "McMurry University",               state: "TX", division: "DIII", conference: "ASC", status: "Competing" },
  { school: "East Texas Baptist University",    state: "TX", division: "DIII", conference: "ASC", status: "Competing" },
  { school: "Schreiner University",             state: "TX", division: "DIII", conference: "ASC", status: "Competing" },

  // ── Division III — Other ────────────────────────────────────────────────
  { school: "Baldwin Wallace University",      state: "OH", division: "DIII", conference: "Ohio Athletic", status: "Announced" },
  { school: "University of Mount Union",       state: "OH", division: "DIII", conference: "Ohio Athletic", status: "Announced" },
  { school: "Wisconsin-Oshkosh",               state: "WI", division: "DIII", conference: "WIAC",          status: "Competing" },
  { school: "Texas Wesleyan University",       state: "TX", division: "DIII",                              status: "Competing" },
  { school: "Guilford College",                state: "NC", division: "DIII",                              status: "Announced" },
  { school: "Meredith College",                state: "NC", division: "DIII",                              status: "Announced" },
  { school: "Albright College",                state: "PA", division: "DIII", conference: "MAC Commonwealth", status: "Announced" },
];
