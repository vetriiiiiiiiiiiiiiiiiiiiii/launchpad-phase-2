/* Every photograph on the site, by role. All are real, green-toned photographs
   from Unsplash, shown in their natural colour. Swap an id to change a picture. */
export const IMG = (id, w, q = 70) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=${q}`;
export const srcSet = (id, max = 1400) =>
  [480, 800, 1200, 1600, 2200].filter((w) => w <= max * 1.3).map((w) => `${IMG(id, w)} ${w}w`).join(', ');

export const P = {
  heroRoom: 'photo-1695809584828-1ee251170805',     // green-lit hall of empty chairs
  tealHall: 'photo-1785458034214-a61b21ddeda1',        // teal auditorium, empty
  lectern: 'photo-1770097286213-6d6fc60f4cdf',         // a speaker at the lectern
  greenSeats: 'photo-1650962863647-8a131e1bf2c6',
  greenFabric: 'photo-1728927585857-28e7c14955b2',     // a builder against green fabric
  talksStage: 'photo-1630395822831-3e8205c2f8e8',   // audience facing a green stage
  speaker: 'photo-1773828977866-baed2942b424',
  chalkTeacher: 'photo-1758685848754-0aa566b4ddf4',
  chalkStudents: 'photo-1758685848261-16a5a9e68811',
  chalkNotes: 'photo-1573871014706-263f4dfec410',
  chalkHand: 'photo-1758685848691-3933bc2aa3ce',
  podium: 'photo-1765020553499-1ec9aeb21298',
  glasshouse: 'photo-1693323588976-bff2c5bd9e22',
  cafeTree: 'photo-1758939561091-d29215cfcd76',
  greenhouseTalk: 'photo-1758524055465-3693209f6b9e',  // two people mid-conversation in a greenhouse
  cafeMonstera: 'photo-1763124320262-60c7aa066999',    // a crowded café under hanging lights
  teamArt: 'photo-1681949098487-2f3a62d52fe8',
  cafePlants: 'photo-1784462293906-c74acc4f768d',
  cafeChairs: 'photo-1773051427980-e6a8d74cc24f',
  cafeGreenWall: 'photo-1561221820-5ed0595bcb4c',
  forestLibrary: 'photo-1749299475177-c1c6c52c62e0',
  roundLibrary: 'photo-1767862638863-302e3cd54ce6',
  glassBlocks: 'photo-1712588501747-5b7f9f715fca',
  greenTiles: 'photo-1761255241065-6f58ffa1cc8a',
  emeraldGlass: 'photo-1625479610681-f789345a8157',
  emeraldStone: 'photo-1767131545090-e13ae86c8e13',
  velvetSofa: 'photo-1755325541565-aca7a68f6e66',
  founderLeaves: 'photo-1564980295992-288a2237a55c',
  greenhouseDuo: 'photo-1758524057756-7dc8ce53d88c',
  teamOffice: 'photo-1758691737212-3eebbc8f84ed',
  planningTable: 'photo-1681949103006-70066fb25dfe',
  greenRoom: 'photo-1520702935840-b40e3d15c234',
  glasshouseWalk: 'photo-1746344509848-e43929b8e66b',
  whiteRibs: 'photo-1567201864585-6baec9110dac',
};
