/* Every photograph on the site, by role. All are real, green-toned photographs
   from Unsplash, shown in their natural colour. Swap an id to change a picture. */
export const IMG = (id, w, q = 70) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=${q}`;
export const srcSet = (id, max = 1400) =>
  [480, 800, 1200, 1600, 2200].filter((w) => w <= max * 1.3).map((w) => `${IMG(id, w)} ${w}w`).join(', ');

export const P = {
  heroRoom: 'photo-1695809584828-1ee251170805',     // green-lit hall of empty chairs
  spotlight: 'photo-1774016591286-f75a8d2e6a24',    // figure in an emerald spotlight
  openingLights: 'photo-1786237948716-a57d5bcd92cc',
  talksStage: 'photo-1630395822831-3e8205c2f8e8',   // audience facing a green stage
  speaker: 'photo-1773828977866-baed2942b424',
  panel: 'photo-1774094453087-0207a0cd2309',
  chalkTeacher: 'photo-1758685848754-0aa566b4ddf4',
  chalkStudents: 'photo-1758685848261-16a5a9e68811',
  chalkNotes: 'photo-1573871014706-263f4dfec410',
  chalkHand: 'photo-1758685848691-3933bc2aa3ce',
  podium: 'photo-1765020553499-1ec9aeb21298',
  glasshouse: 'photo-1693323588976-bff2c5bd9e22',
  cafeTree: 'photo-1758939561091-d29215cfcd76',
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
